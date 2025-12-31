import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client.js";
import fallbackCourses from "../data/courses.js";

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    const numericId = Number(id);

    if (Number.isNaN(numericId)) {
      const fallback = fallbackCourses.find((item) => String(item.id) === id);
      setCourse(fallback || null);
      setStatus(fallback ? "ready" : "error");
      return;
    }

    api
      .get(`/courses/${numericId}`)
      .then((response) => {
        if (!active) return;
        setCourse(response.data);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        const fallback = fallbackCourses.find((item) => item.id === numericId);
        setCourse(fallback || null);
        setStatus(fallback ? "ready" : "error");
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="status">Loading course...</div>
          </div>
        </section>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <h2>Course not found</h2>
            <Link className="btn btn-ghost" to="/courses">
              Back to Courses
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <div className="container narrow">
          <p className="eyebrow">Course Details</p>
          <h2>{course.title}</h2>
          <p className="lead">
            {course.description || "Hands-on training with guided projects and placement support."}
          </p>
          <div className="detail-grid">
            <div>
              <h4>Duration</h4>
              <p>{course.duration || "Flexible duration"}</p>
            </div>
            <div>
              <h4>Fees</h4>
              <p>{course.fee ? `Rs. ${course.fee}` : "Contact for fee details"}</p>
            </div>
            <div>
              <h4>Outcome</h4>
              <p>Hands-on projects and certification support.</p>
            </div>
          </div>
          <a className="btn btn-primary" href="/contact">
            Apply for this Course
          </a>
        </div>
      </section>
    </div>
  );
}
