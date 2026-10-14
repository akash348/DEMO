import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import testimonials from "../data/testimonials.js";

const aboutImage = "/banners/banner2.jpeg";

export default function About() {
  return (
    <div className="page">
      <PageHeader
        title="About"
        description="Know more about Pragati Institute and our mission to build job-ready skills."
      />

      <section className="section mentor-about">
        <div className="container mentor-about-grid">
          <div className="mentor-about-media">
            <img src={aboutImage} alt="Pragati Institute training lab" />
          </div>
          <div className="mentor-about-content">
            <h2>About Pragati Institute</h2>
            <p>
              Pragati Institute is a leading technical training institute in Lucknow, providing
              professional skill-based courses in AC Repairing, Refrigerator Repairing, Washing
              Machine Repairing, Mobile Hardware & Software Repairing and RO/Water Purifier Repairing.
            </p>
            <p>
              Our mission is to make students self-reliant by providing practical training, expert
              guidance and industry-oriented skills. Thousands of students have already built
              successful careers through Pragati Institute.
            </p>
            <ul className="mentor-list">
              <li>Hands-on labs with real equipment and tools.</li>
              <li>Industry trainers with field experience.</li>
              <li>Certification and verification support.</li>
            </ul>
            <div className="mentor-about-actions">
              <Link className="btn btn-primary" to="/contact">
                Talk to Us
              </Link>
              <Link className="btn btn-secondary" to="/courses">
                View Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mentor-counts">
        <div className="container mentor-counts-grid">
          <div>
            <strong>10+</strong>
            <span>Years of Training</span>
          </div>
          <div>
            <strong>5,000+</strong>
            <span>Students Trained</span>
          </div>
          <div>
            <strong>25+</strong>
            <span>Active Courses</span>
          </div>
          <div>
            <strong>95%</strong>
            <span>Completion Support</span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-values-grid">
            <div className="about-value-card">
              <h4>Mission</h4>
              <p>Make students self-reliant through practical, industry-focused training.</p>
            </div>
            <div className="about-value-card">
              <h4>Vision</h4>
              <p>Be the most trusted training partner in Lucknow.</p>
            </div>
            <div className="about-value-card">
              <h4>Values</h4>
              <ul className="about-list">
                <li>Skill-first teaching</li>
                <li>Accountability & discipline</li>
                <li>Student success focus</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section mentor-testimonials">
        <div className="container">
          <div className="section-head">
            <h2>Testimonials</h2>
            <p>What our students say after completing their training.</p>
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
