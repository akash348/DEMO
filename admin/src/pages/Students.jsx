import { useEffect, useState } from "react";
import api from "../api/client.js";

const initialForm = {
  enrollment_no: "",
  name: "",
  father_name: "",
  phone: "",
  email: "",
  address: "",
  course_id: "",
  dob: "",
  join_date: "",
  status: "active"
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewStudent, setViewStudent] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";
  const mediaBase = apiBase.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${mediaBase}${url}`;
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
    Promise.all([fetchStudents(), fetchCourses()]).catch(() => {
      setStatus({ state: "error", message: "Unable to load students." });
    });
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setPhotoFile(null);
    setFileInputKey((prev) => prev + 1);
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

  const handlePhotoChange = (event) => {
    const selected = event.target.files && event.target.files[0];
    setPhotoFile(selected || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const payload = {
      enrollment_no: form.enrollment_no || null,
      name: form.name,
      father_name: form.father_name || null,
      phone: form.phone,
      email: form.email || null,
      address: form.address || null,
      course_id: form.course_id ? Number(form.course_id) : null,
      dob: form.dob || null,
      join_date: form.join_date || null,
      status: form.status
    };
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, payload);
        if (photoFile) {
          const photoData = new FormData();
          photoData.append("photo", photoFile);
          await api.post(`/students/${editingId}/photo`, photoData);
        }
        setStatus({ state: "success", message: "Student updated successfully." });
      } else {
        if (!photoFile) {
          setStatus({ state: "error", message: "Student photo is required." });
          return;
        }
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            formData.append(key, value);
          }
        });
        formData.append("photo", photoFile);
        await api.post("/students/upload", formData);
        setStatus({ state: "success", message: "Student added successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchStudents();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update student." : "Unable to add student."
      });
    }
  };

  const handleEdit = (student) => {
    setFormOpen(true);
    setEditingId(student.id);
    setForm({
      enrollment_no: student.enrollment_no || "",
      name: student.name || "",
      father_name: student.father_name || "",
      phone: student.phone || "",
      email: student.email || "",
      address: student.address || "",
      course_id: student.course_id ? String(student.course_id) : "",
      dob: student.dob || "",
      join_date: student.join_date || "",
      status: student.status || "active"
    });
    setPhotoFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleSetLogin = async (studentId) => {
    const password = window.prompt("Set student login password:");
    if (!password) return;
    const formData = new FormData();
    formData.append("password", password);
    try {
      await api.post(`/students/${studentId}/set-password`, formData);
      setStatus({ state: "success", message: "Student login enabled." });
      await fetchStudents();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to set student login." });
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Delete this student record?")) return;
    try {
      await api.delete(`/students/${studentId}`);
      await fetchStudents();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to delete student." });
    }
  };

  const courseMap = new Map(courses.map((course) => [course.id, course.title]));

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Students</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Add Student"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewStudent && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Student Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewStudent(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Name</div>
              <div className="detail-value">{viewStudent.name}</div>
            </div>
            <div>
              <div className="detail-label">Enrollment No</div>
              <div className="detail-value">{viewStudent.enrollment_no || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Father Name</div>
              <div className="detail-value">{viewStudent.father_name || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Phone</div>
              <div className="detail-value">{viewStudent.phone}</div>
            </div>
            <div>
              <div className="detail-label">Email</div>
              <div className="detail-value">{viewStudent.email || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Course</div>
              <div className="detail-value">
                {courseMap.get(viewStudent.course_id) || "NA"}
              </div>
            </div>
            <div>
              <div className="detail-label">DOB</div>
              <div className="detail-value">{viewStudent.dob || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Join Date</div>
              <div className="detail-value">{viewStudent.join_date || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">{viewStudent.status}</div>
            </div>
            <div>
              <div className="detail-label">Photo</div>
              {viewStudent.photo_url ? (
                <img className="media-thumb" src={resolveMediaUrl(viewStudent.photo_url)} alt={viewStudent.name} />
              ) : (
                <div className="detail-value">NA</div>
              )}
            </div>
            <div>
              <div className="detail-label">Login</div>
              <div className="detail-value">{viewStudent.login_enabled ? "Enabled" : "Disabled"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              name="enrollment_no"
              placeholder="Enrollment No (auto)"
              value={form.enrollment_no}
              onChange={handleChange}
            />
            <input
              name="name"
              placeholder="Student Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="father_name"
              placeholder="Father Name"
              value={form.father_name}
              onChange={handleChange}
              required={!editingId}
            />
          </div>
          <div className="form-row">
            <input
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
              required
            />
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              required={!editingId}
            />
            <input
              key={fileInputKey}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              required={!editingId}
            />
          </div>
          <div className="form-row">
            <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
            <input
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <select name="course_id" value={form.course_id} onChange={handleChange}>
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input type="date" name="join_date" value={form.join_date} onChange={handleChange} />
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" type="submit">
              {editingId ? "Update Student" : "Save Student"}
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
            <th>Enrollment</th>
            <th>Name</th>
            <th>Course</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.enrollment_no || "NA"}</td>
              <td>{student.name}</td>
              <td>{courseMap.get(student.course_id) || "NA"}</td>
              <td>{student.phone}</td>
              <td>{student.status}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewStudent(student)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(student)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleSetLogin(student.id)}>
                    Set Login
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(student.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!students.length && (
            <tr>
              <td colSpan="6" className="empty-state">
                No students added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
