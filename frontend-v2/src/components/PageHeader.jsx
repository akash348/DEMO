import { Link } from "react-router-dom";

export default function PageHeader({ title, description, crumbLabel }) {
  const crumb = crumbLabel || title;

  return (
    <section className="mentor-page-hero">
      <div className="container">
        <div className="mentor-page-head">
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="mentor-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>{crumb}</span>
        </div>
      </div>
    </section>
  );
}
