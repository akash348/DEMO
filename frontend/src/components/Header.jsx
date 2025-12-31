import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/gallery", label: "Gallery" },
  { to: "/verify", label: "Verify" },
  { to: "/student", label: "Student" },
  { to: "/contact", label: "Contact" }
];

export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <div className="brand">
          <span className="brand-mark">PI</span>
          <div>
            <div className="brand-title">Pragati Institute</div>
            <div className="brand-subtitle">Skill Based Technical Training</div>
          </div>
        </div>
        <nav className="nav-links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <a className="btn btn-primary" href="#enquiry">
          Enquiry Now
        </a>
      </div>
    </header>
  );
}
