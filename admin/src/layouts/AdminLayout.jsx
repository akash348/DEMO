import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import TopBar from "../components/TopBar.jsx";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-content">
        <TopBar />
        <div className="admin-page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
