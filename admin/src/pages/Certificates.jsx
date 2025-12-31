import { useEffect, useState } from "react";
import api from "../api/client.js";

const initialForm = {
  student_id: "",
  course_id: "",
  issued_on: "",
  certificate_code: "",
  qr_url: "",
  grade: "",
  percentage: "",
  status: "valid"
};

const gradeOptions = ["A+", "A", "B+", "B", "C", "D", "E", "F", "Pass", "Fail"];

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewCert, setViewCert] = useState(null);

  const fetchCertificates = async () => {
    const response = await api.get("/certificates");
    setCertificates(response.data);
  };

  const fetchStudents = async () => {
    const response = await api.get("/students");
    setStudents(response.data);
  };

  const fetchCourses = async () => {
    const response = await api.get("/courses", { params: { active_only: false } });
    setCourses(response.data);
  };

  useEffect(() => {
    Promise.all([fetchCertificates(), fetchStudents(), fetchCourses()]).catch(() => {
      setStatus({ state: "error", message: "Unable to load certificates." });
    });
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleFormToggle = () => {
    if (formOpen) {
      resetForm();
      setFormOpen(false);
      return;
    }
    setFormOpen(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const generateCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    setForm((prev) => ({ ...prev, certificate_code: `PRG-${year}-${random}` }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    try {
      if (editingId) {
        await api.put(`/certificates/${editingId}`, {
          issued_on: form.issued_on || null,
          qr_url: form.qr_url || null,
          grade: form.grade || null,
          percentage: form.percentage ? Number(form.percentage) : null,
          status: form.status
        });
        setStatus({ state: "success", message: "Certificate updated successfully." });
      } else {
        await api.post("/certificates", {
          student_id: Number(form.student_id),
          course_id: Number(form.course_id),
          issued_on: form.issued_on || null,
          certificate_code: form.certificate_code,
          qr_url: form.qr_url || null,
          grade: form.grade || null,
          percentage: form.percentage ? Number(form.percentage) : null,
          status: form.status
        });
        setStatus({ state: "success", message: "Certificate created successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchCertificates();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update certificate." : "Unable to create certificate."
      });
    }
  };

  const handleEdit = (cert) => {
    setFormOpen(true);
    setEditingId(cert.id);
    setForm({
      student_id: cert.student_id ? String(cert.student_id) : "",
      course_id: cert.course_id ? String(cert.course_id) : "",
      issued_on: cert.issued_on || "",
      certificate_code: cert.certificate_code || "",
      qr_url: cert.qr_url || "",
      grade: cert.grade || "",
      percentage: cert.percentage !== null && cert.percentage !== undefined ? String(cert.percentage) : "",
      status: cert.status || "valid"
    });
  };

  const handleDelete = async (certId) => {
    if (!window.confirm("Delete this certificate?")) return;
    try {
      await api.delete(`/certificates/${certId}`);
      await fetchCertificates();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to delete certificate." });
    }
  };

  const studentMap = new Map(students.map((student) => [student.id, student.name]));
  const courseMap = new Map(courses.map((course) => [course.id, course.title]));

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Certificates</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Generate Certificate"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewCert && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Certificate Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewCert(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Student</div>
              <div className="detail-value">{studentMap.get(viewCert.student_id) || viewCert.student_id}</div>
            </div>
            <div>
              <div className="detail-label">Course</div>
              <div className="detail-value">{courseMap.get(viewCert.course_id) || viewCert.course_id}</div>
            </div>
            <div>
              <div className="detail-label">Code</div>
              <div className="detail-value">{viewCert.certificate_code}</div>
            </div>
            <div>
              <div className="detail-label">Issued On</div>
              <div className="detail-value">{viewCert.issued_on || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">{viewCert.status}</div>
            </div>
            <div>
              <div className="detail-label">Grade</div>
              <div className="detail-value">{viewCert.grade || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Percentage</div>
              <div className="detail-value">
                {viewCert.percentage !== null && viewCert.percentage !== undefined
                  ? `${viewCert.percentage}%`
                  : "NA"}
              </div>
            </div>
            <div>
              <div className="detail-label">QR URL</div>
              <div className="detail-value">{viewCert.qr_url || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <select
              name="student_id"
              value={form.student_id}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            >
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <select
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input type="date" name="issued_on" value={form.issued_on} onChange={handleChange} />
          </div>
          <div className="form-row">
            <input
              name="certificate_code"
              placeholder="Certificate Code"
              value={form.certificate_code}
              onChange={handleChange}
              required
              disabled={Boolean(editingId)}
            />
            {!editingId && (
              <button className="btn btn-ghost" type="button" onClick={generateCode}>
                Generate Code
              </button>
            )}
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="valid">Valid</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div className="form-row">
            <input
              name="grade"
              list="grade-options"
              placeholder="Grade (optional)"
              value={form.grade}
              onChange={handleChange}
            />
            <datalist id="grade-options">
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade} />
              ))}
            </datalist>
            <input
              name="percentage"
              placeholder="Percentage (optional)"
              value={form.percentage}
              onChange={handleChange}
              type="number"
              min="0"
              max="100"
              step="0.01"
            />
          </div>
          <input
            name="qr_url"
            placeholder="QR URL (optional)"
            value={form.qr_url}
            onChange={handleChange}
          />
          <div className="form-actions">
            <button className="btn btn-secondary" type="submit">
              {editingId ? "Update Certificate" : "Save Certificate"}
            </button>
            {editingId && (
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  resetForm();
                  setFormOpen(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Course</th>
            <th>Code</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((cert) => (
            <tr key={cert.id}>
              <td>{studentMap.get(cert.student_id) || cert.student_id}</td>
              <td>{courseMap.get(cert.course_id) || cert.course_id}</td>
              <td>{cert.certificate_code}</td>
              <td>{cert.status}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewCert(cert)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(cert)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(cert.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!certificates.length && (
            <tr>
              <td colSpan="5" className="empty-state">
                No certificates created yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
