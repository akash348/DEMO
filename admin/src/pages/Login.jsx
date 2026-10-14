import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { isAuthenticated, setToken } from "../utils/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ state: "idle", message: "" });

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    try {
      const response = await api.post("/auth/login", {
        email: form.email,
        password: form.password
      });
      setToken(response.data.access_token);
      const destination = location.state?.from?.pathname || "/admin/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      const message = !err.response
        ? "Unable to connect to the server. Please check that the API is running."
        : err.response.status === 401
          ? "Invalid email or password. Use the account registered on this server."
          : "Unable to sign in. Please try again.";
      setStatus({ state: "error", message });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Admin Login</h2>
        <p>Secure access for institute management.</p>
        {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <button className="btn btn-primary" type="submit" disabled={status.state === "loading"}>
            {status.state === "loading" ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
