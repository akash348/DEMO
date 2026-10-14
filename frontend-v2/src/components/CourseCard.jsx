import { Link } from "react-router-dom";

export default function CourseCard({ course, tradeLabel }) {
  const feeLabel = course.fee ? `Rs. ${course.fee}` : "Ask for fee";
  const durationLabel = course.duration || "Flexible duration";
  const tradeName = tradeLabel || course.trade || "General";
  const trainerName = course.trainer_name || course.trainer || "Pragati Team";

  const initials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const rawDescription = course.description || "Learn with practical projects and hands-on labs.";
  const shortDescription =
    rawDescription.length > 140 ? `${rawDescription.slice(0, 137)}...` : rawDescription;

  return (
    <article className="mentor-course-card">
      <div className="mentor-course-body">
        <div className="mentor-course-meta">
          <span className="mentor-course-category">{tradeName}</span>
          <span className="mentor-course-price">{feeLabel}</span>
        </div>
        <h3 className="mentor-course-title">
          <Link to={`/courses/${course.id}`}>{course.title}</Link>
        </h3>
        <p className="mentor-course-desc">{shortDescription}</p>
        <div className="mentor-course-footer">
          <div className="mentor-course-trainer">
            <div className="mentor-course-avatar">{initials(trainerName)}</div>
            <span>{trainerName}</span>
          </div>
          <div className="mentor-course-info">{durationLabel}</div>
        </div>
        <div className="mentor-course-actions">
          <Link className="btn btn-secondary" to={`/courses/${course.id}`}>
            View Details
          </Link>
        </div>
      </div>
    </article>
  );
}
