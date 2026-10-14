import { useEffect, useState } from "react";
import api from "../api/client.js";
import PageHeader from "../components/PageHeader.jsx";
import { resolveMediaUrl } from "../utils/media.js";

const fallbackFaculty = [
  {
    name: "Rajesh Kumar",
    designation: "Mechanical Trainer",
    experience: "10+ years",
    expertise: "CNC, AutoCAD, Workshop Safety"
  },
  {
    name: "Neelam Singh",
    designation: "Computer Instructor",
    experience: "8+ years",
    expertise: "Office Tools, Data Entry, Tally"
  },
  {
    name: "Amit Verma",
    designation: "Electrical Trainer",
    experience: "12+ years",
    expertise: "Industrial Wiring, Control Panels"
  },
  {
    name: "Priya Gupta",
    designation: "Soft Skills Coach",
    experience: "6+ years",
    expertise: "Interview Prep, Communication"
  }
];

export default function Faculty() {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [status, setStatus] = useState({ state: "loading", message: "" });

  const initials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  useEffect(() => {
    let active = true;
    setStatus({ state: "loading", message: "" });
    api
      .get("/faculty")
      .then((response) => {
        if (!active) return;
        setFacultyMembers(response.data);
        setStatus({ state: "success", message: "" });
      })
      .catch(() => {
        if (!active) return;
        setFacultyMembers(fallbackFaculty);
        setStatus({
          state: "warning",
          message: "Showing default faculty profiles until admin updates the list."
        });
      });

    return () => {
      active = false;
    };
  }, []);

  const hasFaculty = facultyMembers.length > 0;

  return (
    <div className="page">
      <PageHeader
        title="Trainers"
        description="Meet the expert trainers guiding every batch at Pragati Institute."
      />
      <section className="section mentor-trainers">
        <div className="container">
          <div className="section-head">
            <h2>Our Trainers</h2>
            <p>Experienced trainers and structured programs that build job-ready skills.</p>
          </div>
          {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
          <div className="mentor-trainer-grid">
            {facultyMembers.map((member) => (
              <article className="mentor-trainer-card" key={member.name}>
                <div className="mentor-trainer-media">
                  {member.photo_url ? (
                    <img src={resolveMediaUrl(member.photo_url)} alt={member.name} />
                  ) : (
                    <div className="mentor-trainer-avatar">{initials(member.name)}</div>
                  )}
                </div>
                <div className="mentor-trainer-body">
                  <h3>{member.name}</h3>
                  <span>{member.designation || "Trainer"}</span>
                  <p>{member.expertise || "Hands-on technical training and mentoring."}</p>
                  <div className="mentor-trainer-meta">
                    <span>Experience: {member.experience || "NA"}</span>
                    {member.qualification && <span>{member.qualification}</span>}
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!hasFaculty && status.state === "success" && (
            <div className="empty-state">Faculty list will be shared soon.</div>
          )}
        </div>
      </section>

    </div>
  );
}
