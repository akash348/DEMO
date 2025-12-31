import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { getStudentToken, setStudentToken } from "../utils/studentAuth.js";

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

export default function StudentAuth() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ enrollment_no: "", dob: "", password: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const navigate = useNavigate();

  useEffect(() => {
    if (getStudentToken()) {
      navigate("/student/exams");
    }
  }, [navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setStatus({ state: "idle", message: "" });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      if (mode === "register") {
        const dobValue = normalizeDob(form.dob);
        if (!dobValue) {
          setStatus({ state: "error", message: "Enter DOB in DD-MM-YYYY format." });
          return;
        }
        const response = await api.post("/student-auth/register", {
          enrollment_no: form.enrollment_no.trim(),
          dob: dobValue,
          password: form.password
        });
        setStudentToken(response.data.access_token);
      } else {
        const response = await api.post("/student-auth/login", {
          enrollment_no: form.enrollment_no.trim(),
          password: form.password
        });
        setStudentToken(response.data.access_token);
      }
      setStatus({ state: "success", message: "Login successful." });
      navigate("/student/exams");
    } catch (err) {
      setStatus({
        state: "error",
        message:
          mode === "register"
            ? "Unable to enable login. Check enrollment and DOB."
            : "Invalid login credentials."
      });
    }
  };

  return (
    <div className="page">
      <section className="section">
        <div className="container narrow">
          <div className="student-card">
            <div className="student-head">
              <div>
                <h2>Student Portal</h2>
                <p>{mode === "login" ? "Login to take online exams." : "Set your password to enable login."}</p>
              </div>
              <div className="student-tabs">
                <button
                  className={mode === "login" ? "tab active" : "tab"}
                  type="button"
                  onClick={() => switchMode("login")}
                >
                  Login
                </button>
                <button
                  className={mode === "register" ? "tab active" : "tab"}
                  type="button"
                  onClick={() => switchMode("register")}
                >
                  Set Password
                </button>
              </div>
            </div>
            {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
            <form className="student-form" onSubmit={handleSubmit}>
              <input
                name="enrollment_no"
                placeholder="Enrollment Number"
                value={form.enrollment_no}
                onChange={handleChange}
                required
              />
              {mode === "register" && (
                <input
                  name="dob"
                  placeholder="DOB (DD-MM-YYYY)"
                  value={form.dob}
                  onChange={handleChange}
                  required
                />
              )}
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button className="btn btn-primary" type="submit" disabled={status.state === "loading"}>
                {status.state === "loading"
                  ? "Please wait..."
                  : mode === "login"
                  ? "Login"
                  : "Enable Login"}
              </button>
            </form>
            <p className="helper-text">
              {mode === "login"
                ? "If login is not enabled, use Set Password once."
                : "Use enrollment number and DOB provided by the institute."}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
