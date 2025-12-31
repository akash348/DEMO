import { useEffect, useState } from "react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const initialForm = {
  trade_id: "",
  title: "",
  description: "",
  duration: "",
  fee: "",
  is_active: true
};

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [trades, setTrades] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewCourse, setViewCourse] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const fetchCourses = async () => {
    const response = await api.get("/courses", { params: { active_only: false } });
    setCourses(response.data);
  };

  const fetchTrades = async () => {
    const response = await api.get("/trades", { params: { active_only: false } });
    setTrades(response.data);
  };

  useEffect(() => {
    Promise.all([fetchCourses(), fetchTrades()]).catch(() => {
      setStatus({ state: "error", message: "Unable to load courses." });
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
    if (name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const payload = {
      trade_id: form.trade_id ? Number(form.trade_id) : null,
      title: form.title,
      description: form.description || null,
      duration: form.duration || null,
      fee: form.fee ? Number(form.fee) : null,
      is_active: form.is_active
    };
    try {
      if (editingId) {
        await api.put(`/courses/${editingId}`, payload);
        setStatus({ state: "success", message: "Course updated successfully." });
      } else {
        await api.post("/courses", payload);
        setStatus({ state: "success", message: "Course added successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchCourses();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update course." : "Unable to add course."
      });
    }
  };

  const handleEdit = (course) => {
    setFormOpen(true);
    setEditingId(course.id);
    setForm({
      trade_id: course.trade_id ? String(course.trade_id) : "",
      title: course.title || "",
      description: course.description || "",
      duration: course.duration || "",
      fee: course.fee ? String(course.fee) : "",
      is_active: Boolean(course.is_active)
    });
  };

  const handleDelete = async (courseId) => {
    setConfirmState({
      open: true,
      title: "Delete course?",
      message: "This action will permanently remove the course.",
      onConfirm: async () => {
        try {
          await api.delete(`/courses/${courseId}`);
          await fetchCourses();
        } catch (err) {
          setStatus({ state: "error", message: "Unable to delete course." });
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Courses</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Add Course"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewCourse && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Course Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewCourse(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Title</div>
              <div className="detail-value">{viewCourse.title}</div>
            </div>
            <div>
              <div className="detail-label">Trade</div>
              <div className="detail-value">
                {trades.find((trade) => trade.id === viewCourse.trade_id)?.name || "NA"}
              </div>
            </div>
            <div>
              <div className="detail-label">Duration</div>
              <div className="detail-value">{viewCourse.duration || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Fee</div>
              <div className="detail-value">
                {viewCourse.fee ? `Rs. ${viewCourse.fee}` : "NA"}
              </div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">{viewCourse.is_active ? "Active" : "Inactive"}</div>
            </div>
            <div>
              <div className="detail-label">Description</div>
              <div className="detail-value">{viewCourse.description || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <select name="trade_id" value={form.trade_id} onChange={handleChange}>
              <option value="">Select Trade</option>
              {trades.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
            <input
              name="title"
              placeholder="Course Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              name="duration"
              placeholder="Duration (e.g., 6 Months)"
              value={form.duration}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <input
              name="fee"
              placeholder="Fee"
              value={form.fee}
              onChange={handleChange}
              type="number"
              min="0"
            />
          </div>
          <textarea
            name="description"
            placeholder="Course Description"
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
          <div className="form-row">
            <select name="is_active" value={String(form.is_active)} onChange={handleChange}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <div className="form-actions">
              <button className="btn btn-secondary" type="submit">
                {editingId ? "Update Course" : "Save Course"}
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
          </div>
        </form>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Trade</th>
            <th>Title</th>
            <th>Duration</th>
            <th>Fee</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id}>
              <td>{trades.find((trade) => trade.id === course.trade_id)?.name || "NA"}</td>
              <td>{course.title}</td>
              <td>{course.duration || "NA"}</td>
              <td>{course.fee ? `Rs. ${course.fee}` : "NA"}</td>
              <td>{course.is_active ? "Active" : "Inactive"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewCourse(course)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(course)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(course.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!courses.length && (
            <tr>
              <td colSpan="6" className="empty-state">
                No courses available yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={async () => {
          if (confirmState.onConfirm) {
            await confirmState.onConfirm();
          }
          setConfirmState((prev) => ({ ...prev, open: false }));
        }}
      />
    </div>
  );
}
