import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  const feeLabel = course.fee ? `Rs. ${course.fee}` : "Ask for fee";
  const durationLabel = course.duration || "Flexible duration";

  return (
    <article className="course-card">
      <div className="course-meta">{durationLabel}</div>
      <h3 className="course-title">{course.title}</h3>
      <p className="course-desc">
        {course.description || "Learn with practical projects and hands-on labs."}
      </p>
      <div className="course-footer">
        <div className="course-fee">
          <span className="course-fee-label">Fee</span>
          <strong>{feeLabel}</strong>
        </div>
        <Link className="btn btn-ghost course-action" to={`/courses/${course.id}`}>
          View Details
        </Link>
      </div>
    </article>
  );
}
