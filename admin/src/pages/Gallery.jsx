import { useEffect, useState } from "react";
import api from "../api/client.js";

const initialForm = {
  media_type: "auto",
  title: "",
  is_active: true
};

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";
  const mediaBase = apiBase.replace(/\/api\/v1\/?$/, "");

  const resolveMediaUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${mediaBase}${url}`;
  };

  const fetchGallery = async () => {
    const response = await api.get("/gallery", { params: { active_only: false } });
    setItems(response.data);
  };

  useEffect(() => {
    fetchGallery().catch(() => {
      setStatus({ state: "error", message: "Unable to load gallery items." });
    });
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setFile(null);
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
    if (name === "is_active") {
      setForm((prev) => ({ ...prev, is_active: value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const selected = event.target.files && event.target.files[0];
    setFile(selected || null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    if (!file && !editingId) {
      setStatus({ state: "error", message: "Please select a photo or video file." });
      return;
    }
    try {
      if (editingId) {
        const payload = {
          title: form.title || null,
          is_active: form.is_active
        };
        if (form.media_type && form.media_type !== "auto") {
          payload.media_type = form.media_type;
        }
        await api.put(`/gallery/${editingId}`, payload);
        setStatus({ state: "success", message: "Gallery item updated." });
      } else {
        const payload = new FormData();
        payload.append("file", file);
        if (form.title) payload.append("title", form.title);
        if (form.media_type && form.media_type !== "auto") {
          payload.append("media_type", form.media_type);
        }
        payload.append("is_active", String(form.is_active));

        await api.post("/gallery/upload", payload);
        setStatus({ state: "success", message: "Gallery item added." });
      }
      resetForm();
      setFormOpen(false);
      await fetchGallery();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update gallery item." : "Unable to add gallery item."
      });
    }
  };

  const handleEdit = (item) => {
    setFormOpen(true);
    setEditingId(item.id);
    setForm({
      media_type: item.media_type || "auto",
      title: item.title || "",
      is_active: Boolean(item.is_active)
    });
    setFile(null);
    setFileInputKey((prev) => prev + 1);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Delete this gallery item?")) return;
    try {
      await api.delete(`/gallery/${itemId}`);
      await fetchGallery();
    } catch (err) {
      setStatus({ state: "error", message: "Unable to delete gallery item." });
    }
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Gallery</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Add Media"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewItem && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Media Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewItem(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Preview</div>
              {viewItem.url ? (
                viewItem.media_type === "video" ? (
                  <video className="media-thumb" src={resolveMediaUrl(viewItem.url)} controls />
                ) : (
                  <img className="media-thumb" src={resolveMediaUrl(viewItem.url)} alt={viewItem.title || "Media"} />
                )
              ) : (
                <div className="detail-value">NA</div>
              )}
            </div>
            <div>
              <div className="detail-label">Title</div>
              <div className="detail-value">{viewItem.title || "Untitled"}</div>
            </div>
            <div>
              <div className="detail-label">Type</div>
              <div className="detail-value">{viewItem.media_type}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">{viewItem.is_active ? "Active" : "Inactive"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <select name="media_type" value={form.media_type} onChange={handleChange}>
              <option value="auto">Auto Detect</option>
              <option value="photo">Photo/Image</option>
              <option value="video">Video</option>
            </select>
            <input
              name="title"
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
            />
            <input
              key={fileInputKey}
              name="file"
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              required={!editingId}
              disabled={Boolean(editingId)}
            />
          </div>
          {editingId && (
            <div className="helper-text">
              To replace the media file, upload a new item instead of editing.
            </div>
          )}
          <div className="form-row">
            <select name="is_active" value={String(form.is_active)} onChange={handleChange}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <div className="form-actions">
              <button className="btn btn-secondary" type="submit">
                {editingId ? "Update Media" : "Save Media"}
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
            <th>Preview</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                {item.url ? (
                  item.media_type === "video" ? (
                    <video className="media-thumb" src={resolveMediaUrl(item.url)} controls />
                  ) : (
                    <img className="media-thumb" src={resolveMediaUrl(item.url)} alt={item.title || "Media"} />
                  )
                ) : (
                  "NA"
                )}
              </td>
              <td>{item.title || "Untitled"}</td>
              <td>{item.media_type}</td>
              <td>{item.is_active ? "Active" : "Inactive"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewItem(item)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(item)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(item.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!items.length && (
            <tr>
              <td colSpan="5" className="empty-state">
                No gallery items added yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
