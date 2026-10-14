import { Link } from "react-router-dom";

const usefulLinks = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Courses", to: "/courses" },
  { label: "Contact", to: "/contact" }
];

const serviceLinks = [
  { label: "Admission", to: "/admission" },
  { label: "Trainers", to: "/faculty" },
  { label: "Student Panel", to: "/student" },
  { label: "Verify Certificate", to: "/verify" }
];

const socialLinks = [
  {
    label: "Google Maps",
    href: "https://maps.app.goo.gl/Aj7baqFNHj4yo4HJ6"
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@pragatiinstituteLucknow"
  },
  {
    label: "Instagram",
    href: "https://instagram.com/pragati.institute90?utm_source=qr&igshid=MzNlNGNkZWQ4Mg%3D%3D"
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=100089250117961&mibextid=ZbWKwL"
  }
];


function FooterSocialIcon({ name }) {
  if (name === "Google Maps") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5Z" /></svg>;
  }
  if (name === "Facebook") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V10H7.7v3h2.7v8h3.1Z" /></svg>;
  }
  if (name === "Instagram") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9Zm9.7 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z" clipRule="evenodd" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.3 7.1a2.8 2.8 0 0 0-2-2C17.6 4.6 12 4.6 12 4.6s-5.6 0-7.3.5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.2 12a29 29 0 0 0 .5 4.9 2.8 2.8 0 0 0 2 2c1.7.5 7.3.5 7.3.5s5.6 0 7.3-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-4.9 29 29 0 0 0-.5-4.9ZM10 15.2V8.8l5.5 3.2-5.5 3.2Z" /></svg>;
}
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <img className="footer-logo" src="/logo.png" alt="Pragati Institute logo" />
          <div>
            <div className="footer-title">Pragati Institute</div>
            <p className="footer-note">Skill based technical training in Lucknow.</p>
          </div>
          <p className="footer-address">
            22A Station Road, opposite Vikash Deep Building, beside Chitwapur Police Chauki,
            Hussainganj, Lucknow 226001
          </p>
        </div>
        <div className="footer-contact">
          <div className="footer-title">Contact</div>
          <a href="tel:+917068907681" className="footer-link">
            +91 7068907681
          </a>
          <a href="tel:+916392191208" className="footer-link">
            +91 6392191208
          </a>
          <a href="mailto:info@pragatiinstitute.in" className="footer-link">
            info@pragatiinstitute.in
          </a>
        </div>
        <div className="footer-links">
          <div className="footer-title">Useful Links</div>
          <ul className="footer-list">
            {usefulLinks.map((link) => (
              <li key={link.to}>
                <Link className="footer-link" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="footer-links">
          <div className="footer-title">Our Services</div>
          <ul className="footer-list">
            {serviceLinks.map((link) => (
              <li key={link.to}>
                <Link className="footer-link" to={link.to}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
      <div className="container footer-registration">
        <span>Managed by Chitransh Welfare Society</span>
        <span>Society Reg. No.: R-736</span>
        <span>NGO Darpan ID: UP/2017/0175536</span>
        <span>Udyam Reg. No.: UDYAM-UP-50-0067056</span>
      </div>
      <div className="container footer-social-row" aria-label="Social links">
        {socialLinks.map((link) => (
          <a key={link.label} href={link.href} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
            <FooterSocialIcon name={link.label} />
          </a>
        ))}
      </div>
      <div className="footer-bottom">Copyright 2026 Pragati Institute. All rights reserved.</div>
    </footer>
  );
}
