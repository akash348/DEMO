import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import CourseCard from "../components/CourseCard.jsx";
import fallbackCourses from "../data/courses.js";

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/courses")
      .then((response) => {
        if (!active) return;
        setCourses(response.data);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setCourses(fallbackCourses);
        setError("Showing sample courses until the API is ready.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({ status: "loading", message: "" });
    try {
      await api.post("/enquiries", {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        message: form.message || null,
        source: "website"
      });
      setSubmitState({
        status: "success",
        message: "Enquiry submitted. Our team will contact you soon."
      });
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      setSubmitState({
        status: "error",
        message: "Unable to submit enquiry right now. Please try again."
      });
    }
  };

  const visibleCourses = courses.slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">Skill Based Technical Training</p>
            <h1>
              Build practical skills with industry-ready courses at Pragati Institute.
            </h1>
            <p className="lead">
              Focused training, expert mentors, and a clear path from enquiry to certification.
            </p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#enquiry">
                Start Enquiry
              </a>
              <Link className="btn btn-ghost" to="/courses">
                Explore Courses
              </Link>
            </div>
            <div className="hero-stats">
              <div>
                <strong>12+</strong>
                <span>Job-ready programs</span>
              </div>
              <div>
                <strong>5,000+</strong>
                <span>Students trained</span>
              </div>
              <div>
                <strong>95%</strong>
                <span>Completion support</span>
              </div>
            </div>
          </div>
          <div className="hero-card">
            <h3>Admission Window</h3>
            <p>New batches start every month. Reserve your seat today.</p>
            <ul>
              <li>Hands-on labs</li>
              <li>Certificate verification</li>
              <li>Placement guidance</li>
            </ul>
            <Link className="btn btn-secondary" to="/contact">
              Call for Details
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Popular Courses</h2>
            <p>Pick a program that matches your career path.</p>
          </div>
          {loading ? (
            <div className="status">Loading courses...</div>
          ) : (
            <>
              {error && <div className="status warning">{error}</div>}
              {visibleCourses.length ? (
                <div className="grid-3">
                  {visibleCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              ) : (
                <div className="status">Courses will be published soon.</div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section accent" id="enquiry">
        <div className="container enquiry-grid">
          <div>
            <h2>Quick Enquiry</h2>
            <p>
              Share your details and our team will help you with course selection and fees.
            </p>
            {submitState.message && (
              <div className={`status ${submitState.status}`}>
                {submitState.message}
              </div>
            )}
          </div>
          <form className="enquiry-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <textarea
              name="message"
              placeholder="Your requirement"
              rows="4"
              value={form.message}
              onChange={handleChange}
            ></textarea>
            <button className="btn btn-primary" type="submit" disabled={submitState.status === "loading"}>
              {submitState.status === "loading" ? "Sending..." : "Send Enquiry"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
