import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import CourseCard from "../components/CourseCard.jsx";
import fallbackCourses from "../data/courses.js";
import testimonials from "../data/testimonials.js";
import { resolveMediaUrl } from "../utils/media.js";

const heroImage = "/banners/banner1.jpeg";
const aboutImage = "/banners/banner2.jpeg";
const whyImage = '/banners/banner5.jpeg';

const featureItems = [
  "AC Repairing",
  "Refrigerator Repairing",
  "Washing Machine Repairing",
  "Mobile Hardware",
  "Mobile Software",
  "RO/Water Purifier",
  "Service Workflow",
  "Customer Handling"
];

const whyFeatures = [
  {
    title: "Hands-on Labs",
    description: "Daily practice with real appliances, tools, and supervised training."
  },
  {
    title: "Expert Trainers",
    description: "Industry experienced mentors for step-by-step guidance."
  },
  {
    title: "Career Support",
    description: "Placement guidance, interview prep, and certification verification."
  }
];

const fallbackTrainers = [
  {
    name: "Rajesh Kumar",
    designation: "Mechanical Trainer",
    expertise: "AC & Refrigerator Repair"
  },
  {
    name: "Neelam Singh",
    designation: "Mobile Instructor",
    expertise: "Hardware & Software"
  },
  {
    name: "Amit Verma",
    designation: "Electrical Trainer",
    expertise: "Wiring & Control Panels"
  }
];

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [trades, setTrades] = useState([]);
  const [trainers, setTrainers] = useState([]);
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
    let active = true;
    api
      .get("/faculty")
      .then((response) => {
        if (!active) return;
        setTrainers(response.data);
      })
      .catch(() => {
        if (!active) return;
        setTrainers(fallbackTrainers);
      });

    return () => {
      active = false;
    };
  }, []);

  const tradeMap = new Map(trades.map((trade) => [trade.id, trade.name]));

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
  const featuredTestimonials = testimonials.slice(0, 3);
  const featuredTrainers = trainers.slice(0, 3);

  return (
    <div className="page">
      <section className="mentor-hero">
        <div className="container mentor-hero-grid">
          <div className="mentor-hero-content">
            <span className="mentor-tag">Skill Based Technical Training</span>
            <h1>Build practical skills that lead to real careers.</h1>
            <p>
              Pragati Institute delivers hands-on technical training in Lucknow for AC, refrigeration,
              washing machine, mobile hardware & software, and RO repair.
            </p>
            <div className="mentor-hero-actions">
              <Link className="btn btn-primary" to="/contact">
                Get Started
              </Link>
              <Link className="btn btn-secondary" to="/courses">
                View Courses
              </Link>
            </div>
          </div>
          <div className="mentor-hero-media">
            <img src={heroImage} alt="Training lab at Pragati Institute" />
            <div className="mentor-hero-badge">
              <strong>5,000+</strong>
              <span>Students trained</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section mentor-about">
        <div className="container mentor-about-grid">
          <div className="mentor-about-media">
            <img src={aboutImage} alt="Workshop practice" />
          </div>
          <div className="mentor-about-content">
            <h2>About Pragati Institute</h2>
            <p>
              Pragati Institute is a leading technical training institute in Lucknow, providing
              professional skill-based courses in AC Repairing, Refrigerator Repairing, Washing
              Machine Repairing, Mobile Hardware & Software Repairing and RO/Water Purifier Repairing.
            </p>
            <ul className="mentor-list">
              <li>Practical lab sessions with real equipment and tools.</li>
              <li>Expert trainers with industry field experience.</li>
              <li>Certification and verification support after training.</li>
            </ul>
            <Link className="btn btn-secondary" to="/about">
              Read More
            </Link>
          </div>
        </div>
      </section>

      <section className="mentor-counts">
        <div className="container mentor-counts-grid">
          <div>
            <strong>5,000+</strong>
            <span>Students Trained</span>
          </div>
          <div>
            <strong>12+</strong>
            <span>Skill Programs</span>
          </div>
          <div>
            <strong>20+</strong>
            <span>Workshop Modules</span>
          </div>
          <div>
            <strong>95%</strong>
            <span>Completion Support</span>
          </div>
        </div>
      </section>

      <section className="section mentor-why">
        <div className="container mentor-why-grid">
          <div className="mentor-why-card">
            <img src={whyImage} alt="Practical training" />
            <div className="mentor-why-text">
              <h3>Why Choose Pragati</h3>
              <p>
                We focus on practical learning with real tools, certified assessments, and guided
                career support so students become job-ready quickly.
              </p>
              <Link className="btn btn-primary" to="/contact">
                Join Now
              </Link>
            </div>
          </div>
          <div className="mentor-why-features">
            {whyFeatures.map((feature) => (
              <div className="mentor-why-feature" key={feature.title}>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section mentor-features">
        <div className="container">
          <div className="section-head">
            <h2>Training Highlights</h2>
            <p>Focused modules that prepare students for real service work.</p>
          </div>
          <div className="mentor-feature-grid">
            {featureItems.map((item) => (
              <div className="mentor-feature-item" key={item}>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section mentor-courses">
        <div className="container">
          <div className="section-head split">
            <div>
              <h2>Popular Courses</h2>
              <p>Pick a program that matches your career path.</p>
            </div>
            <div className="section-actions">
              <Link className="btn btn-secondary" to="/courses">
                View All Courses
              </Link>
            </div>
          </div>
          {loading ? (
            <div className="status">Loading courses...</div>
          ) : (
            <>
              {error && <div className="status warning">{error}</div>}
              {visibleCourses.length ? (
                <div className="grid-3">
                  {visibleCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      tradeLabel={tradeMap.get(course.trade_id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="status">Courses will be published soon.</div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="section mentor-testimonials">
        <div className="container">
          <div className="section-head">
            <h2>Student Stories</h2>
            <p>Hear from students who completed their training with us.</p>
          </div>
          <div className="mentor-testimonial-grid">
            {featuredTestimonials.map((item) => (
              <article className="mentor-testimonial-card" key={item.name}>
                <p className="mentor-testimonial-quote">{item.message}</p>
                <div className="mentor-testimonial-footer">
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
          <div className="section-actions">
            <Link className="btn btn-secondary" to="/testimonials">
              View All Testimonials
            </Link>
          </div>
        </div>
      </section>

      <section className="section mentor-trainers">
        <div className="container">
          <div className="section-head split">
            <div>
              <h2>Our Trainers</h2>
              <p>Expert mentors guiding practical skill development.</p>
            </div>
            <div className="section-actions">
              <Link className="btn btn-secondary" to="/faculty">
                View All Trainers
              </Link>
            </div>
          </div>
          <div className="mentor-trainer-grid">
            {featuredTrainers.map((trainer) => (
              <article className="mentor-trainer-card" key={trainer.name}>
                <div className="mentor-trainer-media">
                  {trainer.photo_url ? (
                    <img src={resolveMediaUrl(trainer.photo_url)} alt={trainer.name} />
                  ) : (
                    <div className="mentor-trainer-avatar">
                      {trainer.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="mentor-trainer-body">
                  <h3>{trainer.name}</h3>
                  <span>{trainer.designation || "Trainer"}</span>
                  <p>{trainer.expertise || "Hands-on technical training."}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section mentor-cta">
        <div className="container mentor-cta-grid">
          <div>
            <h2>Quick Enquiry</h2>
            <p>Share your details and our team will help you with course selection and fees.</p>
            {submitState.message && (
              <div className={`status ${submitState.status}`}>{submitState.message}</div>
            )}
          </div>
          <form className="enquiry-form mentor-cta-form" onSubmit={handleSubmit}>
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


