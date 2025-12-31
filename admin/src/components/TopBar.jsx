import { useNavigate } from "react-router-dom";
import { clearToken } from "../utils/auth.js";

export default function TopBar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="topbar">
      <div>
        <h2>Welcome back, Admin</h2>
        <p>Track students, fees, and certificates from one place.</p>
      </div>
      <div className="topbar-actions">
        <button className="btn btn-ghost" type="button" onClick={() => navigate("/admin/students")}>
          New Admission
        </button>
        <button className="btn btn-secondary" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
