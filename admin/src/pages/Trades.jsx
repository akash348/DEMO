import { useEffect, useState } from "react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const initialForm = {
  name: "",
  description: "",
  is_active: true
};

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewTrade, setViewTrade] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const fetchTrades = async () => {
    const response = await api.get("/trades", { params: { active_only: false } });
    setTrades(response.data);
  };

  useEffect(() => {
    fetchTrades().catch(() => {
      setStatus({ state: "error", message: "Unable to load trades." });
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
    try {
      if (editingId) {
        await api.put(`/trades/${editingId}`, {
          name: form.name,
          description: form.description || null,
          is_active: form.is_active
        });
        setStatus({ state: "success", message: "Trade updated successfully." });
      } else {
        await api.post("/trades", {
          name: form.name,
          description: form.description || null,
          is_active: form.is_active
        });
        setStatus({ state: "success", message: "Trade added successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchTrades();
    } catch (err) {
      setStatus({ state: "error", message: editingId ? "Unable to update trade." : "Unable to add trade." });
    }
  };

  const handleEdit = (trade) => {
    setFormOpen(true);
    setEditingId(trade.id);
    setForm({
      name: trade.name || "",
      description: trade.description || "",
      is_active: Boolean(trade.is_active)
    });
  };

  const handleDelete = async (tradeId) => {
    setConfirmState({
      open: true,
      title: "Delete trade?",
      message: "This action will permanently remove the trade.",
      onConfirm: async () => {
        try {
          await api.delete(`/trades/${tradeId}`);
          await fetchTrades();
        } catch (err) {
          setStatus({ state: "error", message: "Unable to delete trade." });
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Trades</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Add Trade"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewTrade && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Trade Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewTrade(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Name</div>
              <div className="detail-value">{viewTrade.name}</div>
            </div>
            <div>
              <div className="detail-label">Status</div>
              <div className="detail-value">{viewTrade.is_active ? "Active" : "Inactive"}</div>
            </div>
            <div>
              <div className="detail-label">Description</div>
              <div className="detail-value">{viewTrade.description || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              name="name"
              placeholder="Trade Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <select name="is_active" value={String(form.is_active)} onChange={handleChange}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <textarea
            name="description"
            placeholder="Description"
            rows="3"
            value={form.description}
            onChange={handleChange}
          ></textarea>
          <div className="form-actions">
            <button className="btn btn-secondary" type="submit">
              {editingId ? "Update Trade" : "Save Trade"}
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
            <th>Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id}>
              <td>{trade.name}</td>
              <td>{trade.is_active ? "Active" : "Inactive"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewTrade(trade)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(trade)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(trade.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!trades.length && (
            <tr>
              <td colSpan="3" className="empty-state">
                No trades added yet.
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
