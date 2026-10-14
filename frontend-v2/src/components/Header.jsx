import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

const primaryLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/courses", label: "Courses" },
  { to: "/faculty", label: "Trainers" },
  { to: "/student", label: "Student Login" },
  { to: "/contact", label: "Contact" }
];

const moreLinks = [
  { to: "/admission", label: "Admission" },
  { to: "/notes", label: "Notes" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/gallery", label: "Gallery" },
  { to: "/verify", label: "Verify" },
  { to: "/student/login", label: "Student Portal" }
];

const socialLinks = [
  {
    href: "https://www.facebook.com/profile.php?id=100089250117961&mibextid=ZbWKwL",
    label: "Facebook",
    icon: "facebook"
  },
  {
    href: "https://instagram.com/pragati.institute90?utm_source=qr&igshid=MzNlNGNkZWQ4Mg%3D%3D",
    label: "Instagram",
    icon: "instagram"
  },
  {
    href: "https://www.youtube.com/@pragatiinstituteLucknow",
    label: "YouTube",
    icon: "youtube"
  }
];


function SocialIcon({ name }) {
  if (name === "facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H7.7v3h2.7v8h3.1Z" /></svg>;
  }
  if (name === "instagram") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9Zm9.75 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" clipRule="evenodd" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.3 7.1a2.8 2.8 0 0 0-2-2C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.3.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.2 12a29 29 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.7.5 7.3.5 7.3.5s5.6 0 7.3-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.9 29 29 0 0 0-.5-4.9ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" /></svg>;
}
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", menuOpen);
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setServicesOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <header className="site-header">
      <div className="mentor-topbar">
        <div className="container mentor-topbar-inner">
          <div className="mentor-topbar-info">
            <a href="tel:+917068907681">Call: +91 7068907681</a>
            <a href="tel:+916392191208">More Info: +91 6392191208</a>
            <a href="mailto:info@pragatiinstitute.in">Email: info@pragatiinstitute.in</a>
          </div>
          <div className="mentor-topbar-social">
            <span className="social-label">Follow</span>
            {socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
                <SocialIcon name={link.icon} />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="container header-inner">
        <Link className="brand" to="/">
          <img className="brand-logo" src="/logo.png" alt="Pragati Institute logo" />
          <div>
            <div className="brand-title">Pragati Institute</div>
            <div className="brand-subtitle">Skill Based Technical Training</div>
            <div className="brand-certification">ISO 9001:2015 Certified | Code: PI-ISO-9001</div>
          </div>
        </Link>
        <button
          className={menuOpen ? "menu-toggle open" : "menu-toggle"}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-nav"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          onClick={() =>
            setMenuOpen((prev) => {
              const next = !prev;
              if (!next) {
                setServicesOpen(false);
              }
              return next;
            })
          }
        >
          <span className="menu-bar" />
          <span className="menu-bar" />
          <span className="menu-bar" />
        </button>
        <div className={menuOpen ? "nav-panel open" : "nav-panel"}>
          <nav className="nav-links" id="primary-nav">
            {primaryLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
                onClick={() => {
                  setMenuOpen(false);
                  setServicesOpen(false);
                }}
              >
                {link.label}
              </NavLink>
            ))}
            <div className={servicesOpen ? "nav-dropdown open" : "nav-dropdown"}>
              <button
                className="nav-link dropdown-toggle"
                type="button"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((prev) => !prev)}
              >
                More
                <span className="dropdown-caret" aria-hidden="true" />
              </button>
              <div className="dropdown-menu" role="menu">
                {moreLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    role="menuitem"
                    className={({ isActive }) =>
                      isActive ? "dropdown-link active" : "dropdown-link"
                    }
                    onClick={() => {
                      setMenuOpen(false);
                      setServicesOpen(false);
                    }}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
          <NavLink
            className="btn btn-primary header-cta"
            to="/contact"
            onClick={() => {
              setMenuOpen(false);
              setServicesOpen(false);
            }}
          >
            Get Started
          </NavLink>
        </div>
      </div>
      <button
        className={menuOpen ? "nav-backdrop open" : "nav-backdrop"}
        type="button"
        aria-label="Close navigation"
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => {
          setMenuOpen(false);
          setServicesOpen(false);
        }}
      />
    </header>
  );
}
