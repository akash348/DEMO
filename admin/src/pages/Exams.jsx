import { useEffect, useMemo, useState } from "react";
import api from "../api/client.js";

const initialExamForm = {
  title: "",
  description: "",
  duration_minutes: "",
  total_marks: "",
  pass_marks: "",
  negative_marking_enabled: false,
  negative_mark_value: "",
  is_active: true,
  start_at: "",
  end_at: ""
};

const initialQuestionForm = {
  question_text: "",
  marks: "1",
  negative_marks: ""
};

const defaultOptions = [
  { option_text: "", is_correct: true },
  { option_text: "", is_correct: false },
  { option_text: "", is_correct: false },
  { option_text: "", is_correct: false }
];

export default function Exams() {
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialExamForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [questionStatus, setQuestionStatus] = useState({ state: "idle", message: "" });
  const [questionForm, setQuestionForm] = useState(initialQuestionForm);
  const [options, setOptions] = useState(defaultOptions);

  const fetchExams = async () => {
    const response = await api.get("/exams");
    setExams(response.data);
  };

  const fetchQuestions = async (examId) => {
    const response = await api.get(`/exams/${examId}/questions`);
    setQuestions(response.data);
  };

  useEffect(() => {
    fetchExams().catch(() => {
      setStatus({ state: "error", message: "Unable to load exams." });
    });
  }, []);

  useEffect(() => {
    if (!selectedExam) {
      setQuestions([]);
      return;
    }
    fetchQuestions(selectedExam.id).catch(() => {
      setQuestionStatus({ state: "error", message: "Unable to load questions." });
    });
  }, [selectedExam]);

  const resetForm = () => {
    setForm(initialExamForm);
    setEditingId(null);
  };

  const resetQuestionForm = () => {
    setQuestionForm(initialQuestionForm);
    setOptions(defaultOptions);
  };

  const handleFormToggle = () => {
    if (formOpen) {
      resetForm();
      setFormOpen(false);
      return;
    }
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "negative_marking_enabled" || name === "is_active") {
      setForm((prev) => ({ ...prev, [name]: value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExamSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const payload = {
      title: form.title,
      description: form.description || null,
      duration_minutes: Number(form.duration_minutes),
      total_marks: form.total_marks ? Number(form.total_marks) : null,
      pass_marks: form.pass_marks ? Number(form.pass_marks) : null,
      negative_marking_enabled: form.negative_marking_enabled,
      negative_mark_value:
        form.negative_marking_enabled && form.negative_mark_value
          ? Number(form.negative_mark_value)
          : null,
      is_active: form.is_active,
      start_at: form.start_at || null,
      end_at: form.end_at || null
    };

    try {
      if (editingId) {
        await api.put(`/exams/${editingId}`, payload);
        setStatus({ state: "success", message: "Exam updated successfully." });
      } else {
        await api.post("/exams", payload);
        setStatus({ state: "success", message: "Exam created successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchExams();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update exam." : "Unable to create exam."
      });
    }
  };

  const handleEdit = (exam) => {
    setFormOpen(true);
    setEditingId(exam.id);
    setForm({
      title: exam.title || "",
      description: exam.description || "",
      duration_minutes: exam.duration_minutes ? String(exam.duration_minutes) : "",
      total_marks: exam.total_marks !== null && exam.total_marks !== undefined ? String(exam.total_marks) : "",
      pass_marks: exam.pass_marks !== null && exam.pass_marks !== undefined ? String(exam.pass_marks) : "",
      negative_marking_enabled: Boolean(exam.negative_marking_enabled),
      negative_mark_value:
        exam.negative_mark_value !== null && exam.negative_mark_value !== undefined
          ? String(exam.negative_mark_value)
          : "",
      is_active: Boolean(exam.is_active),
      start_at: exam.start_at ? exam.start_at.replace("Z", "").slice(0, 16) : "",
      end_at: exam.end_at ? exam.end_at.replace("Z", "").slice(0, 16) : ""
    });
  };

  const handleDelete = async (examId) => {
    if (!window.confirm("Delete this exam?")) return;
    try {
      await api.delete(`/exams/${examId}`);
      if (selectedExam?.id === examId) {
        setSelectedExam(null);
      }
      await fetchExams();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to delete exam." });
    }
  };

  const handleQuestionChange = (event) => {
    const { name, value } = event.target;
    setQuestionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (index, field, value) => {
    setOptions((prev) => {
      const next = [...prev];
      if (field === "is_correct") {
        next.forEach((opt, idx) => {
          next[idx] = { ...opt, is_correct: idx === index };
        });
        return next;
      }
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddOption = () => {
    setOptions((prev) => [...prev, { option_text: "", is_correct: false }]);
  };

  const handleRemoveOption = (index) => {
    setOptions((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length && !next.some((opt) => opt.is_correct)) {
        next[0] = { ...next[0], is_correct: true };
      }
      return next;
    });
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedExam) return;
    setQuestionStatus({ state: "loading", message: "" });

    const cleanedOptions = options
      .map((opt) => ({ ...opt, option_text: opt.option_text.trim() }))
      .filter((opt) => opt.option_text);

    if (cleanedOptions.length < 2) {
      setQuestionStatus({ state: "error", message: "Add at least two options." });
      return;
    }

    if (!cleanedOptions.some((opt) => opt.is_correct)) {
      setQuestionStatus({ state: "error", message: "Mark one option as correct." });
      return;
    }

    try {
      await api.post(`/exams/${selectedExam.id}/questions`, {
        question_text: questionForm.question_text,
        marks: questionForm.marks ? Number(questionForm.marks) : 1,
        negative_marks: questionForm.negative_marks ? Number(questionForm.negative_marks) : null,
        options: cleanedOptions
      });
      resetQuestionForm();
      await fetchQuestions(selectedExam.id);
      setQuestionStatus({ state: "success", message: "Question added successfully." });
    } catch (err) {
      setQuestionStatus({ state: "error", message: "Unable to add question." });
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/exams/questions/${questionId}`);
      if (selectedExam) {
        await fetchQuestions(selectedExam.id);
      }
    } catch (err) {
      setQuestionStatus({ state: "error", message: "Unable to delete question." });
    }
  };

  const activeExamLabel = useMemo(() => {
    if (!selectedExam) return "Select an exam to add questions.";
    return `Managing questions for ${selectedExam.title}`;
  }, [selectedExam]);

  return (
    <div className="admin-page">
      <div className="panel">
        <div className="panel-head">
          <h3>Online Exams</h3>
          <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
            {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Create Exam"}
          </button>
        </div>
        {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
        {formOpen && (
          <form className="form-grid" onSubmit={handleExamSubmit}>
            <div className="form-row">
              <input
                name="title"
                placeholder="Exam Title"
                value={form.title}
                onChange={handleChange}
                required
              />
              <input
                name="duration_minutes"
                placeholder="Duration (minutes)"
                value={form.duration_minutes}
                onChange={handleChange}
                type="number"
                min="1"
                required
              />
              <select
                name="negative_marking_enabled"
                value={String(form.negative_marking_enabled)}
                onChange={handleChange}
              >
                <option value="false">Negative Marking: Off</option>
                <option value="true">Negative Marking: On</option>
              </select>
            </div>
            <div className="form-row">
              <input
                name="total_marks"
                placeholder="Total Marks (optional)"
                value={form.total_marks}
                onChange={handleChange}
                type="number"
                min="0"
              />
              <input
                name="pass_marks"
                placeholder="Pass Marks (optional)"
                value={form.pass_marks}
                onChange={handleChange}
                type="number"
                min="0"
              />
              <input
                name="negative_mark_value"
                placeholder="Negative Mark Value (optional)"
                value={form.negative_mark_value}
                onChange={handleChange}
                type="number"
                min="0"
                disabled={!form.negative_marking_enabled}
              />
            </div>
            <div className="form-row">
              <input
                type="datetime-local"
                name="start_at"
                value={form.start_at}
                onChange={handleChange}
              />
              <input
                type="datetime-local"
                name="end_at"
                value={form.end_at}
                onChange={handleChange}
              />
              <select name="is_active" value={String(form.is_active)} onChange={handleChange}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <textarea
              name="description"
              placeholder="Exam instructions or description"
              rows="3"
              value={form.description}
              onChange={handleChange}
            ></textarea>
            <div className="form-actions">
              <button className="btn btn-secondary" type="submit">
                {editingId ? "Update Exam" : "Save Exam"}
              </button>
              {editingId && (
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    resetForm();
                    setFormOpen(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Negative Marking</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam) => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
                <td>{exam.duration_minutes} min</td>
                <td>{exam.is_active ? "Active" : "Inactive"}</td>
                <td>{exam.negative_marking_enabled ? "Enabled" : "Off"}</td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-ghost" type="button" onClick={() => setSelectedExam(exam)}>
                      Questions
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => handleEdit(exam)}>
                      Edit
                    </button>
                    <button className="btn btn-ghost" type="button" onClick={() => handleDelete(exam.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!exams.length && (
              <tr>
                <td colSpan="5" className="empty-state">
                  No exams created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div>
            <h3>Exam Questions</h3>
            <p className="helper-text">{activeExamLabel}</p>
          </div>
        </div>
        {questionStatus.message && (
          <div className={`status ${questionStatus.state}`}>{questionStatus.message}</div>
        )}
        {selectedExam && (
          <>
            <form className="form-grid" onSubmit={handleQuestionSubmit}>
              <div className="form-row">
                <input
                  name="question_text"
                  placeholder="Question"
                  value={questionForm.question_text}
                  onChange={handleQuestionChange}
                  required
                />
              </div>
              <div className="form-row">
                <input
                  name="marks"
                  placeholder="Marks"
                  value={questionForm.marks}
                  onChange={handleQuestionChange}
                  type="number"
                  min="0"
                />
                <input
                  name="negative_marks"
                  placeholder="Negative Marks (optional)"
                  value={questionForm.negative_marks}
                  onChange={handleQuestionChange}
                  type="number"
                  min="0"
                />
              </div>
              <div className="question-options">
                {options.map((option, index) => (
                  <div key={`option-${index}`} className="option-row">
                    <input
                      value={option.option_text}
                      placeholder={`Option ${index + 1}`}
                      onChange={(event) => handleOptionChange(index, "option_text", event.target.value)}
                      required={index < 2}
                    />
                    <label className="option-flag">
                      <input
                        type="radio"
                        name="correct_option"
                        checked={option.is_correct}
                        onChange={() => handleOptionChange(index, "is_correct", true)}
                      />
                      Correct
                    </label>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      disabled={options.length <= 2}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button className="btn btn-secondary" type="button" onClick={handleAddOption}>
                  Add Option
                </button>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit">
                  Add Question
                </button>
                <button className="btn btn-ghost" type="button" onClick={resetQuestionForm}>
                  Reset
                </button>
              </div>
            </form>
            <div className="question-list">
              {questions.map((question) => (
                <div className="question-card" key={question.id}>
                  <div className="question-head">
                    <strong>{question.question_text}</strong>
                    <span className="pill">{question.marks} marks</span>
                  </div>
                  {question.negative_marks !== null && question.negative_marks !== undefined && (
                    <p className="helper-text">Negative: {question.negative_marks}</p>
                  )}
                  <div className="question-options-list">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={option.is_correct ? "option-item correct" : "option-item"}
                      >
                        {option.option_text}
                      </div>
                    ))}
                  </div>
                  <div className="form-actions">
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      Delete Question
                    </button>
                  </div>
                </div>
              ))}
              {!questions.length && (
                <div className="empty-state">No questions added yet.</div>
              )}
            </div>
          </>
        )}
        {!selectedExam && <div className="empty-state">Choose an exam to manage questions.</div>}
      </div>
    </div>
  );
}
