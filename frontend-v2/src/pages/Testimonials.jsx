import testimonials from "../data/testimonials.js";
import PageHeader from "../components/PageHeader.jsx";

export default function Testimonials() {
  return (
    <div className="page">
      <PageHeader
        title="Testimonials"
        description="Stories from learners who completed their training at Pragati Institute."
      />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2>Student Testimonials</h2>
            <p>Stories from learners who completed their training at Pragati Institute.</p>
          </div>
          <div className="mentor-testimonial-grid">
            {testimonials.map((item) => (
              <article className="mentor-testimonial-card" key={item.name}>
                <p className="mentor-testimonial-quote">{item.message}</p>
                <div className="mentor-testimonial-footer">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
