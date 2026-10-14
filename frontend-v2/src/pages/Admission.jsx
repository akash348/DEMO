import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client.js";
import fallbackCourses from "../data/courses.js";
import CustomSelect from "../components/CustomSelect.jsx";
import PageHeader from "../components/PageHeader.jsx";

export default function Admission() {
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("courseId") || "";
  const [courses, setCourses] = useState([]);
  const [trades, setTrades] = useState([]);
  const [selectedId, setSelectedId] = useState(courseIdParam);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitState, setSubmitState] = useState({ state: "idle", message: "" });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    branch: "",
    email: "",
    guardian: "",
    qualification: "",
    address: "",
    preferredBatch: "",
    notes: ""
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/courses", { params: { active_only: true } })
      .then((response) => {
        if (!active) return;
        setCourses(response.data);
      })
      .catch(() => {
        if (!active) return;
        setCourses(fallbackCourses);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/trades", { params: { active_only: true } })
      .then((response) => {
        if (!active) return;
        setTrades(response.data);
      })
      .catch(() => {
        if (!active) return;
        setTrades([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!courses.length) return;
    if (!selectedId) {
      setCourse(null);
      return;
    }
    const match = courses.find((item) => String(item.id) === String(selectedId));
    if (match) {
      setCourse(match);
      return;
    }
    const fallback = fallbackCourses.find((item) => String(item.id) === String(selectedId));
    setCourse(fallback || null);
  }, [courses, selectedId]);

  const tradeMap = useMemo(() => new Map(trades.map((trade) => [trade.id, trade.name])), [trades]);
  const tradeLabel = course?.trade || tradeMap.get(course?.trade_id) || "General";
  const feeLabel = course?.fee ? `Rs. ${course.fee}` : "Contact for fee";
  const durationLabel = course?.duration || "Flexible duration";
  const courseOptions = [
    { value: "", label: "Select a course" },
    ...courses.map((item) => ({ value: String(item.id), label: item.title }))
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!course) {
      setSubmitState({ state: "error", message: "Please select a course to apply." });
      return;
    }
    setSubmitState({ state: "loading", message: "" });
    try {
      await api.post("/admissions", {
        course_id: course.id,
        trade_id: course.trade_id || null,
        course_title: course.title || null,
        course_fee: course.fee ?? null,
        course_duration: course.duration ?? null,
        trade_name: tradeLabel || null,
        branch_name: form.branch || null,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        guardian_name: form.guardian || null,
        qualification: form.qualification || null,
        address: form.address || null,
        preferred_batch: form.preferredBatch || null,
        notes: form.notes || null
      });
      setSubmitState({
        state: "success",
        message:
          "Admission request submitted. Admin approval is pending and login details will be shared after approval."
      });
      setForm({
        name: "",
        phone: "",
        branch: "",
        email: "",
        guardian: "",
        qualification: "",
        address: "",
        preferredBatch: "",
        notes: ""
      });
    } catch (err) {
      setSubmitState({
        state: "error",
        message: "Unable to submit the form right now. Please try again."
      });
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Admission"
        description="Apply online by selecting a course and sharing your details."
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Online Admission Registration</h2>
            <p>Select a course, verify details, and submit your admission request.</p>
          </div>
          <div className="panel-grid admission-grid">
            <div className="panel-card admission-card">
              <h3>Course Selection</h3>
              <p className="helper-text">
                Pick a course to see its details. If you came from a course page, it will be pre-selected.
              </p>
              <div className="form-group admission-select">
                <label htmlFor="courseSelect">Choose Course</label>
                <CustomSelect
                  id="courseSelect"
                  value={selectedId}
                  options={courseOptions}
                  placeholder="Select a course"
                  onChange={setSelectedId}
                />
              </div>
              {loading && <div className="status">Loading courses...</div>}
              {course ? (
                <div className="course-detail-card">
                  <div className="course-detail-meta">
                    <span className="detail-pill">{tradeLabel} Trade</span>
                  </div>
                  <h4>{course.title}</h4>
                  <p className="helper-text">
                    {course.description ||
                      "Hands-on training with guided projects and placement support."}
                  </p>
                  <div className="detail-grid">
                    <div>
                      <h4>Duration</h4>
                      <p>{durationLabel}</p>
                    </div>
                    <div>
                      <h4>Fees</h4>
                      <p>{feeLabel}</p>
                    </div>
                  </div>
                  <Link className="btn btn-ghost" to={`/courses/${course.id}`}>
                    View Full Details
                  </Link>
                </div>
              ) : (
                <div className="status warning">Select a course to view details.</div>
              )}
            </div>

            <div className="panel-card admission-card">
              <h3>Applicant Details</h3>
              {submitState.message && (
                <div className={`status ${submitState.state}`}>{submitState.message}</div>
              )}
              <form className="admission-form" onSubmit={handleSubmit}>
                <div className="form-grid detail-readonly">
                  <div className="form-group">
                    <label htmlFor="selectedCourse">Selected Course</label>
                    <input
                      id="selectedCourse"
                      value={course?.title || ""}
                      placeholder="Select a course"
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="selectedTrade">Trade</label>
                    <input
                      id="selectedTrade"
                      value={course ? tradeLabel : ""}
                      placeholder="Trade"
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="selectedDuration">Duration</label>
                    <input
                      id="selectedDuration"
                      value={course ? durationLabel : ""}
                      placeholder="Duration"
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="selectedFee">Fees</label>
                    <input
                      id="selectedFee"
                      value={course ? feeLabel : ""}
                      placeholder="Fee"
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                </div>
                <div className="form-divider" />
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      id="name"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="branch">Branch</label>
                    <input
                      id="branch"
                      name="branch"
                      placeholder="Branch (e.g., Lucknow)"
                      value={form.branch}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="guardian">Guardian Name</label>
                    <input
                      id="guardian"
                      name="guardian"
                      value={form.guardian}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="qualification">Highest Qualification</label>
                    <input
                      id="qualification"
                      name="qualification"
                      value={form.qualification}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="preferredBatch">Preferred Batch</label>
                    <input
                      id="preferredBatch"
                      name="preferredBatch"
                      value={form.preferredBatch}
                      onChange={handleChange}
                      placeholder="Morning / Evening"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    value={form.address}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows="3"
                    value={form.notes}
                    onChange={handleChange}
                  ></textarea>
                </div>
                <button className="btn btn-primary" type="submit" disabled={submitState.state === "loading"}>
                  {submitState.state === "loading" ? "Submitting..." : "Submit Admission"}
                </button>
              </form>
              <p className="helper-text">
                We will confirm your seat after verifying documents and fee details.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
