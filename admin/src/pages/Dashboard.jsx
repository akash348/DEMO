import { useEffect, useState } from "react";
import api from "../api/client.js";

const activities = [
  "New enquiry follow-ups pending",
  "Review fee receipts and update records",
  "Issue certificates for completed batches",
  "Refresh gallery with latest events"
];

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState({ state: "loading", message: "" });

  useEffect(() => {
    let active = true;
    api
      .get("/dashboard/summary")
      .then((response) => {
        if (!active) return;
        setSummary(response.data);
        setStatus({ state: "success", message: "" });
      })
      .catch(() => {
        if (!active) return;
        setStatus({ state: "error", message: "Unable to load dashboard data." });
      });

    return () => {
      active = false;
    };
  }, []);

  const formatter = new Intl.NumberFormat("en-IN");
  const stats = summary
    ? [
        { label: "Total Students", value: formatter.format(summary.total_students) },
        { label: "Active Courses", value: formatter.format(summary.total_courses) },
        { label: "Pending Enquiries", value: formatter.format(summary.total_enquiries) },
        { label: "Total Fees", value: `Rs. ${formatter.format(summary.total_fees)}` },
        { label: "Total Expenses", value: `Rs. ${formatter.format(summary.total_expenses)}` },
        { label: "Certificates Issued", value: formatter.format(summary.total_certificates) }
      ]
    : [];

  return (
    <div className="dashboard">
      {status.state === "error" && <div className="status error">{status.message}</div>}
      <div className="stat-grid">
        {status.state === "loading" && <div className="status">Loading dashboard...</div>}
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <h3>Recent Activity</h3>
          <ul className="activity-list">
            {activities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h3>Next Steps</h3>
          <p>Complete this month admissions and verify pending certificates.</p>
          <button className="btn btn-secondary" type="button">
            Review Admissions
          </button>
        </div>
      </div>
    </div>
  );
}
