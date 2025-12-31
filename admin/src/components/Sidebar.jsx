import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/trades", label: "Trades" },
  { to: "/admin/students", label: "Students" },
  { to: "/admin/courses", label: "Courses" },
  { to: "/admin/fees", label: "Fees" },
  { to: "/admin/expenses", label: "Expenses" },
  { to: "/admin/exams", label: "Exams" },
  { to: "/admin/certificates", label: "Certificates" },
  { to: "/admin/gallery", label: "Gallery" },
  { to: "/admin/enquiries", label: "Enquiries" }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="badge">PI</span>
        <div>
          <strong>Pragati Admin</strong>
          <p>Institute Control</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
