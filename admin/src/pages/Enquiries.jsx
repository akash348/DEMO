import { useEffect, useState } from "react";
import api from "../api/client.js";

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [viewEnquiry, setViewEnquiry] = useState(null);

  const fetchEnquiries = async () => {
    const response = await api.get("/enquiries");
    setEnquiries(response.data);
  };

  useEffect(() => {
    fetchEnquiries().catch(() => {
      setStatus({ state: "error", message: "Unable to load enquiries." });
    });
  }, []);

  const handleDelete = async (enquiryId) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      await api.delete(`/enquiries/${enquiryId}`);
      await fetchEnquiries();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to delete enquiry." });
    }
  };

  const handleConvert = async (enquiry) => {
    try {
      await api.post("/students", {
        name: enquiry.name,
        phone: enquiry.phone,
        email: enquiry.email || null,
        address: null,
        course_id: null,
        join_date: null,
        status: "active"
      });
      await api.delete(`/enquiries/${enquiry.id}`);
      await fetchEnquiries();
      setStatus({ state: "success", message: "Enquiry converted to student." });
    } catch (err) {
      setStatus({ state: "error", message: "Unable to convert enquiry." });
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Enquiries</h3>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewEnquiry && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Enquiry Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewEnquiry(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Name</div>
              <div className="detail-value">{viewEnquiry.name}</div>
            </div>
            <div>
              <div className="detail-label">Phone</div>
              <div className="detail-value">{viewEnquiry.phone}</div>
            </div>
            <div>
              <div className="detail-label">Email</div>
              <div className="detail-value">{viewEnquiry.email || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Source</div>
              <div className="detail-value">{viewEnquiry.source || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Message</div>
              <div className="detail-value">{viewEnquiry.message || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Email</th>
            <th>Message</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {enquiries.map((enquiry) => (
            <tr key={enquiry.id}>
              <td>{enquiry.name}</td>
              <td>{enquiry.phone}</td>
              <td>{enquiry.email || "NA"}</td>
              <td>{enquiry.message || "NA"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewEnquiry(enquiry)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleConvert(enquiry)}>
                    Convert
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(enquiry.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!enquiries.length && (
            <tr>
              <td colSpan="5" className="empty-state">
                No enquiries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
