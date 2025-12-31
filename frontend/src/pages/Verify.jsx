import { useState } from "react";
import api from "../api/client.js";

const normalizeDob = (value) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dmyMatch = /^(\d{2})[/-](\d{2})[/-](\d{4})$/;
  if (isoMatch.test(trimmed)) return trimmed;
  const match = trimmed.match(dmyMatch);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
};

const formatDate = (value) => {
  if (!value) return "NA";
  const datePart = String(value).split("T")[0];
  const match = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return datePart;
};

export default function Verify() {
  const [form, setForm] = useState({ enrollment_no: "", dob: "" });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";
  const mediaBase = apiBase.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${mediaBase}${url}`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const dobValue = normalizeDob(form.dob);
    if (!form.enrollment_no.trim() || !dobValue) {
      setStatus("error");
      setMessage("Enter enrollment number and DOB in DD-MM-YYYY format.");
      return;
    }
    setStatus("loading");
    setMessage("");
    setResult(null);

    try {
      const response = await api.post("/certificates/verify/enrollment", {
        enrollment_no: form.enrollment_no.trim(),
        dob: dobValue
      });
      setResult(response.data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage("Certificate not found. Please check the details.");
    }
  };

  return (
    <div className="page">
      <section className="section">
        <div className="container narrow">
          <h2>Certificate Verification</h2>
          <p>Enter enrollment number and date of birth (DD-MM-YYYY).</p>
          <form className="verify-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="enrollment_no"
              placeholder="Enrollment Number"
              value={form.enrollment_no}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="dob"
              placeholder="DOB (DD-MM-YYYY)"
              value={form.dob}
              onChange={handleChange}
              required
            />
            <button className="btn btn-primary" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Verifying..." : "Verify Certificate"}
            </button>
          </form>
          <div className="verify-result">
            {status === "idle" && <p>Verification result will appear here.</p>}
            {status === "error" && <p className="status error">{message}</p>}
            {status === "success" && result && (
              <div className="verify-card">
                <div className="verify-photo">
                  {result.photo_url ? (
                    <img src={resolveMediaUrl(result.photo_url)} alt={result.student_name} />
                  ) : (
                    <div className="verify-placeholder">Photo</div>
                  )}
                </div>
                <div className="verify-details">
                  <div>
                    <strong>Student Name:</strong> {result.student_name}
                  </div>
                  <div>
                    <strong>Father Name:</strong> {result.father_name || "NA"}
                  </div>
                  <div>
                    <strong>Enrollment No:</strong> {result.enrollment_no}
                  </div>
                  <div>
                    <strong>DOB:</strong> {formatDate(result.dob)}
                  </div>
                  <div>
                    <strong>Course:</strong> {result.course_title || "NA"}
                  </div>
                  <div>
                    <strong>Duration:</strong> {result.course_duration || "NA"}
                  </div>
                  <div>
                    <strong>Grade:</strong> {result.grade || "NA"}
                  </div>
                  <div>
                    <strong>Percentage:</strong>{" "}
                    {result.percentage !== null && result.percentage !== undefined
                      ? `${result.percentage}%`
                      : "NA"}
                  </div>
                  <div>
                    <strong>Certificate Code:</strong> {result.certificate_code}
                  </div>
                  <div>
                    <strong>Issued On:</strong> {result.issued_on ? formatDate(result.issued_on) : "NA"}
                  </div>
                  <div>
                    <strong>Status:</strong> {result.status}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
