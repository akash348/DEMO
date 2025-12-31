import { useState } from "react";
import api from "../api/client.js";

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
      <section className="section">
        <div className="container enquiry-grid">
          <div>
            <h2>Contact & Enquiry</h2>
            <p>Visit us at 22 A, Station Road, Hussainganj, Lucknow.</p>
            <div className="contact-card">
              <p>Phone: +91-00000-00000</p>
              <p>Email: info@pragatiinstitute.in</p>
              <p>Timing: 9:00 AM - 6:00 PM</p>
            </div>
            {submitState.message && (
              <div className={`status ${submitState.status}`}>{submitState.message}</div>
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
