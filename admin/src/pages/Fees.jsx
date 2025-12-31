import { useEffect, useState } from "react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const initialForm = {
  student_id: "",
  amount: "",
  mode: "",
  paid_on: "",
  receipt_no: ""
};

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewFee, setViewFee] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const fetchFees = async () => {
    const response = await api.get("/fees");
    setFees(response.data);
  };

  const fetchStudents = async () => {
    const response = await api.get("/students");
    setStudents(response.data);
  };

  useEffect(() => {
    Promise.all([fetchFees(), fetchStudents()]).catch(() => {
      setStatus({ state: "error", message: "Unable to load fees." });
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ state: "loading", message: "" });
    const payload = {
      student_id: Number(form.student_id),
      amount: Number(form.amount),
      mode: form.mode || null,
      paid_on: form.paid_on || null,
      receipt_no: form.receipt_no || null
    };
    try {
      if (editingId) {
        await api.put(`/fees/${editingId}`, payload);
        setStatus({ state: "success", message: "Fee payment updated." });
      } else {
        await api.post("/fees", payload);
        setStatus({ state: "success", message: "Fee payment recorded." });
      }
      resetForm();
      setFormOpen(false);
      await fetchFees();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update fee." : "Unable to record fee."
      });
    }
  };

  const handleEdit = (fee) => {
    setFormOpen(true);
    setEditingId(fee.id);
    setForm({
      student_id: fee.student_id ? String(fee.student_id) : "",
      amount: fee.amount ? String(fee.amount) : "",
      mode: fee.mode || "",
      paid_on: fee.paid_on || "",
      receipt_no: fee.receipt_no || ""
    });
  };

  const handleDelete = async (feeId) => {
    setConfirmState({
      open: true,
      title: "Delete fee record?",
      message: "This action will permanently remove the fee record.",
      onConfirm: async () => {
        try {
          await api.delete(`/fees/${feeId}`);
          await fetchFees();
        } catch (err) {
          setStatus({ state: "error", message: "Unable to delete fee record." });
        }
      }
    });
  };

  const studentMap = new Map(students.map((student) => [student.id, student.name]));

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Fees</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Record Payment"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewFee && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Fee Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewFee(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Student</div>
              <div className="detail-value">{studentMap.get(viewFee.student_id) || viewFee.student_id}</div>
            </div>
            <div>
              <div className="detail-label">Amount</div>
              <div className="detail-value">Rs. {viewFee.amount}</div>
            </div>
            <div>
              <div className="detail-label">Mode</div>
              <div className="detail-value">{viewFee.mode || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Paid On</div>
              <div className="detail-value">{viewFee.paid_on || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Receipt</div>
              <div className="detail-value">{viewFee.receipt_no || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <select name="student_id" value={form.student_id} onChange={handleChange} required>
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <input
              name="amount"
              type="number"
              min="0"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              required
            />
            <select name="mode" value={form.mode} onChange={handleChange}>
              <option value="">Payment Mode</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
          <div className="form-row">
            <input type="date" name="paid_on" value={form.paid_on} onChange={handleChange} />
            <input
              name="receipt_no"
              placeholder="Receipt Number"
              value={form.receipt_no}
              onChange={handleChange}
            />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" type="submit">
              {editingId ? "Update Payment" : "Save Payment"}
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
            <th>Amount</th>
            <th>Mode</th>
            <th>Paid On</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {fees.map((fee) => (
            <tr key={fee.id}>
              <td>{studentMap.get(fee.student_id) || fee.student_id}</td>
              <td>Rs. {fee.amount}</td>
              <td>{fee.mode || "NA"}</td>
              <td>{fee.paid_on || "NA"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewFee(fee)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(fee)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(fee.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!fees.length && (
            <tr>
              <td colSpan="5" className="empty-state">
                No fee records yet.
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
