import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import studentApi from "../api/studentClient.js";
import { clearStudentToken, getStudentToken } from "../utils/studentAuth.js";

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function StudentExams() {
  const [token, setToken] = useState(() => getStudentToken());
  const [exams, setExams] = useState([]);
  const [activeExam, setActiveExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingExamId, setLoadingExamId] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadExams = async () => {
    try {
      const response = await studentApi.get("/exams/student/available");
      setExams(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
      }
      throw err;
    }
  };

  useEffect(() => {
    if (!token) return;
    loadExams().catch(() => {
      setStatus({ state: "error", message: "Unable to load exams." });
    });
  }, [token]);

  useEffect(() => {
    if (!activeExam || result) return;
    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [activeExam, timeLeft, result]);

  const handleStartExam = async (exam) => {
    setLoadingExamId(exam.id);
    setStatus({ state: "loading", message: "" });
    try {
      const response = await studentApi.post(`/exams/${exam.id}/start`);
      setActiveExam(response.data);
      setAnswers({});
      setResult(null);
      setTimeLeft(response.data.exam.duration_minutes * 60);
      setStatus({ state: "idle", message: "" });
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
      }
      setStatus({ state: "error", message: "Unable to start exam." });
    } finally {
      setLoadingExamId(null);
    }
  };

  const handleAnswerSelect = (questionId, optionId) => {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!activeExam || submitting || result) return;
    setSubmitting(true);
    try {
      const answerList = Object.entries(answers).map(([questionId, optionId]) => ({
        question_id: Number(questionId),
        option_id: Number(optionId)
      }));
      const response = await studentApi.post(`/exams/${activeExam.exam.id}/submit`, {
        attempt_id: activeExam.attempt_id,
        answers: answerList
      });
      setResult(response.data);
      setStatus({
        state: "success",
        message: autoSubmit ? "Time is up. Exam submitted." : "Exam submitted successfully."
      });
    } catch (err) {
      if (err.response?.status === 401) {
        setToken(null);
      }
      setStatus({ state: "error", message: "Unable to submit exam." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = () => {
    setActiveExam(null);
    setAnswers({});
    setResult(null);
    setTimeLeft(0);
    setStatus({ state: "idle", message: "" });
  };

  const examMeta = useMemo(() => {
    if (!activeExam) return null;
    const { exam } = activeExam;
    return {
      duration: exam.duration_minutes,
      negative: exam.negative_marking_enabled,
      totalMarks: exam.total_marks
    };
  }, [activeExam]);

  if (!token) {
    return (
      <div className="page">
        <section className="section">
          <div className="container narrow">
            <div className="student-card">
              <h2>Student Exams</h2>
              <p>Please login to access available exams.</p>
              <Link className="btn btn-primary" to="/student/login">
                Go to Login
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <div className="student-toolbar">
            <div>
              <h2>Online Exams</h2>
              <p>Take your MCQ exams within the allotted time.</p>
            </div>
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => {
                clearStudentToken();
                setToken(null);
                setActiveExam(null);
                setExams([]);
                setAnswers({});
                setResult(null);
                setTimeLeft(0);
                setStatus({ state: "idle", message: "" });
              }}
            >
              Logout
            </button>
          </div>
          {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
          {!activeExam && (
            <div className="exam-grid">
              {exams.map((exam) => (
                <div className="exam-card" key={exam.id}>
                  <h3>{exam.title}</h3>
                  <p>{exam.description || "No description provided."}</p>
                  <div className="exam-meta">
                    <span>{exam.duration_minutes} mins</span>
                    <span>{exam.total_marks ? `${exam.total_marks} marks` : "Marks: NA"}</span>
                    <span>{exam.negative_marking_enabled ? "Negative: On" : "Negative: Off"}</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleStartExam(exam)}
                    disabled={loadingExamId === exam.id}
                  >
                    {loadingExamId === exam.id ? "Starting..." : "Start Exam"}
                  </button>
                </div>
              ))}
              {!exams.length && <div className="empty-state">No exams available right now.</div>}
            </div>
          )}

          {activeExam && (
            <div className="exam-session">
              <div className="exam-session-head">
                <div>
                  <h3>{activeExam.exam.title}</h3>
                  <p className="helper-text">
                    Duration: {examMeta?.duration} mins •{" "}
                    {examMeta?.negative ? "Negative marking on" : "Negative marking off"}
                  </p>
                </div>
                <div className="exam-timer">
                  <span>Time Left</span>
                  <strong>{formatTime(timeLeft)}</strong>
                </div>
              </div>
              <div className="question-grid">
                {activeExam.questions.map((question, index) => (
                  <div className="question-card" key={question.id}>
                    <div className="question-title">
                      <span>Q{index + 1}.</span> {question.question_text}
                    </div>
                    <div className="question-options">
                      {question.options.map((option) => (
                        <label key={option.id} className="option-choice">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={answers[question.id] === option.id}
                            onChange={() => handleAnswerSelect(question.id, option.id)}
                          />
                          {option.option_text}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="exam-actions">
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={submitting || result}
                >
                  {submitting ? "Submitting..." : "Submit Exam"}
                </button>
                <button className="btn btn-ghost" type="button" onClick={handleExit}>
                  Exit
                </button>
              </div>
              {result && (
                <div className="exam-result">
                  <h4>Result</h4>
                  <p>
                    <strong>Total Score:</strong> {result.total_score}
                  </p>
                  <p>
                    <strong>Status:</strong> {result.status}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
