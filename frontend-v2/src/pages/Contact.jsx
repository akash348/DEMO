import { useState } from "react";
import api from "../api/client.js";
import Toast from "../components/Toast.jsx";
import PageHeader from "../components/PageHeader.jsx";

const socialLinks = [
  {
    title: "Google Maps",
    value: "Open location",
    href: "https://maps.app.goo.gl/Aj7baqFNHj4yo4HJ6"
  },
  {
    title: "YouTube",
    value: "@pragatiinstituteLucknow",
    href: "https://www.youtube.com/@pragatiinstituteLucknow"
  },
  {
    title: "Instagram",
    value: "pragati.institute90",
    href: "https://instagram.com/pragati.institute90?utm_source=qr&igshid=MzNlNGNkZWQ4Mg%3D%3D"
  },
  {
    title: "Facebook",
    value: "Pragati Institute",
    href: "https://www.facebook.com/profile.php?id=100089250117961&mibextid=ZbWKwL"
  }
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });

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
        source: "contact"
      });
      setSubmitState({
        status: "success",
        message: "Thanks for reaching out. We will contact you shortly."
      });
      setForm({ name: "", phone: "", email: "", message: "" });
    } catch (err) {
      setSubmitState({
        status: "error",
        message: "Unable to submit enquiry right now. Please try again."
      });
    }
  };

  return (
    <div className="page">
      <Toast
        message={submitState.status === "loading" ? "" : submitState.message}
        type={submitState.status === "error" ? "error" : "success"}
        onClose={() => setSubmitState({ status: "idle", message: "" })}
      />
      <PageHeader
        title="Contact"
        description="Reach out to Pragati Institute for admissions, course details, or support."
      />

      <section className="section mentor-contact">
        <div className="container">
          <div className="mentor-contact-info-grid">
            <div className="mentor-contact-card">
              <h3>Location</h3>
              <p>
                22A Station Road, opposite Vikash Deep Building, beside Chitwapur Police Chauki,
                Hussainganj, Lucknow 226001
              </p>
            </div>
            <div className="mentor-contact-card">
              <h3>Email</h3>
              <p>info@pragatiinstitute.in</p>
            </div>
            <div className="mentor-contact-card">
              <h3>Call</h3>
              <p>+91-7068907681, +91-6392191208</p>
            </div>
            {socialLinks.map((link) => (
              <a
                key={link.title}
                className="mentor-contact-card mentor-contact-link-card"
                href={link.href}
                target="_blank"
                rel="noreferrer"
              >
                <h3>{link.title}</h3>
                <p>{link.value}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mentor-contact-map">
        <iframe
          title="Pragati Institute Location"
          src="https://www.google.com/maps?q=22A%20Station%20Road%20opposite%20Vikash%20Deep%20Building%20Chitwapur%20Police%20Chauki%20Hussainganj%20Lucknow%20226001&output=embed"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        ></iframe>
      </section>

      <section className="section mentor-contact-form">
        <div className="container mentor-contact-form-grid">
          <div>
            <h2>Send an Enquiry</h2>
            <p>Share your details and our team will respond shortly.</p>
          </div>
          <form className="enquiry-form mentor-contact-form-card" onSubmit={handleSubmit}>
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
              placeholder="Your enquiry"
              rows="4"
              value={form.message}
              onChange={handleChange}
            ></textarea>
            <button className="btn btn-primary" type="submit" disabled={submitState.status === "loading"}>
              {submitState.status === "loading" ? "Submitting..." : "Submit Enquiry"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
