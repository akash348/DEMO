import { useEffect, useState } from "react";
import api from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { resolveMediaUrl } from "../utils/media.js";

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

const verificationSite = "www.pragati-institute.co.in";

const buildQrUrl = (certificateCode) => {
  const target = `https://${verificationSite}/verify?certificate=${encodeURIComponent(certificateCode || "")}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(target)}`;
};

export default function Verify() {
  const [form, setForm] = useState({ enrollment_no: "", dob: "" });
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const verifyByCertificateCode = async (certificateCode) => {
    const code = certificateCode.trim();
    if (!code) return;
    setStatus("loading");
    setMessage("");
    setResult(null);

    try {
      const response = await api.get(`/certificates/verify/${encodeURIComponent(code)}`);
      setResult(response.data);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage("Certificate not found. Please check the certificate code.");
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const certificateCode = params.get("certificate") || params.get("code");
    if (certificateCode) {
      verifyByCertificateCode(certificateCode);
    }
  }, []);
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
      <PageHeader
        title="Verify Certificate"
        description="Verify certificates by scan, certificate code, enrollment number and date of birth."
      />
      <section className="section">
        <div className="container verify-layout">
          <div className="verify-entry">
            <h2>Certificate Verification</h2>
            <p>Scan QR code or enter enrollment number and date of birth (DD-MM-YYYY).</p>
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
          </div>
          <div className="verify-result">
            {status === "idle" && <p>Scan the certificate QR code or enter details to verify.</p>}
            {status === "error" && <p className="status error">{message}</p>}
            {status === "success" && result && (
              <div className="verified-certificate">
                <div className="verification-success" role="status">
                  <strong>Certificate Verified</strong>
                  <span>{result.status || "valid"}</span>
                </div>
                <article className="public-certificate" aria-label="Verified certificate preview">
                  <div className="public-certificate-inner">
                    <header className="certificate-head">
                      <img className="certificate-logo" src="/logo.png" alt="Pragati Institute logo" />
                      <div className="certificate-heading">
                        <h3>PRAGATI INSTITUTE</h3>
                        <p className="certificate-iso">* ISO Certified Institute *</p>
                        <p className="certificate-iso-detail">AN ISO 9001:2015 CERTIFIED ORGANIZATION</p>
                        <h4>CERTIFICATE</h4>
                        <p className="certificate-completion">OF COMPLETION</p>
                      </div>
                      <div className="certificate-photo">
                        {result.photo_url ? (
                          <img src={resolveMediaUrl(result.photo_url)} alt={result.student_name} />
                        ) : (
                          <span>PHOTO</span>
                        )}
                      </div>
                    </header>
                    <div className="certificate-body">
                      <aside className="certificate-side-info">
                        <div className="certificate-field">
                          <span>ENROLLMENT NO.</span>
                          <strong>{result.enrollment_no}</strong>
                        </div>
                        <div className="certificate-field">
                          <span>DATE OF BIRTH</span>
                          <strong>{formatDate(result.dob)}</strong>
                        </div>
                      </aside>
                      <div className="certificate-content">
                        <p>This is to certify that</p>
                        <h5>{result.student_name}</h5>
                        <p>has successfully completed the training in</p>
                        <h6>{result.course_title || "NA"}</h6>
                        <p>at Pragati Institute, Lucknow.</p>
                        <strong className="certificate-duration">
                          Course Duration: {result.course_duration || "NA"}
                        </strong>
                        <p className="certificate-dates">
                          <span>From: {formatDate(result.from_date)}</span>
                          <span>To: {formatDate(result.to_date)}</span>
                        </p>
                        <p className="certificate-wish">
                          We wish him/her every success in future career and professional life.
                        </p>
                      </div>
                      <aside className="certificate-qr">
                        <span>SCAN TO VERIFY</span>
                        <img src={buildQrUrl(result.certificate_code)} alt="Verification QR code" />
                        <strong>{result.certificate_code}</strong>
                      </aside>
                    </div>
                    <div className="certificate-online-note">
                      This certificate can be verified online on our website
                      <strong>{verificationSite}</strong>
                      using Enrollment Number and Date of Birth.
                    </div>
                    <div className="certificate-signatures">
                      <div>
                        <span></span>
                        <strong>DATE OF ISSUE: {formatDate(result.issued_on)}</strong>
                      </div>
                      <div>
                        <span></span>
                        <strong>AUTHORIZED SIGNATORY</strong>
                        <small>PRAGATI INSTITUTE</small>
                      </div>
                    </div>
                    <footer className="certificate-footer">
                      <strong>ADD: 22A, STATION ROAD, HUSSAINGANJ, LUCKNOW, UTTAR PRADESH - 226001</strong>
                      <span>CONTACT: 7068907681</span>
                    </footer>
                  </div>
                </article>
                <p className="certificate-authorization">
                  <strong>Fully certified and authorized by Pragati Institute, Lucknow.</strong>
                  This certificate has been validated through the official online verification system.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
