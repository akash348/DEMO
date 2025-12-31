import { useEffect, useState } from "react";
import api from "../api/client.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const initialForm = {
  title: "",
  amount: "",
  category: "",
  paid_on: "",
  notes: ""
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [editingId, setEditingId] = useState(null);
  const [viewExpense, setViewExpense] = useState(null);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const fetchExpenses = async () => {
    const response = await api.get("/expenses");
    setExpenses(response.data);
  };

  useEffect(() => {
    fetchExpenses().catch(() => {
      setStatus({ state: "error", message: "Unable to load expenses." });
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
      title: form.title,
      amount: Number(form.amount),
      category: form.category || null,
      paid_on: form.paid_on || null,
      notes: form.notes || null
    };
    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, payload);
        setStatus({ state: "success", message: "Expense updated successfully." });
      } else {
        await api.post("/expenses", payload);
        setStatus({ state: "success", message: "Expense added successfully." });
      }
      resetForm();
      setFormOpen(false);
      await fetchExpenses();
    } catch (err) {
      setStatus({
        state: "error",
        message: editingId ? "Unable to update expense." : "Unable to add expense."
      });
    }
  };

  const handleEdit = (expense) => {
    setFormOpen(true);
    setEditingId(expense.id);
    setForm({
      title: expense.title || "",
      amount: expense.amount ? String(expense.amount) : "",
      category: expense.category || "",
      paid_on: expense.paid_on || "",
      notes: expense.notes || ""
    });
  };

  const handleDelete = async (expenseId) => {
    setConfirmState({
      open: true,
      title: "Delete expense record?",
      message: "This action will permanently remove the expense record.",
      onConfirm: async () => {
        try {
          await api.delete(`/expenses/${expenseId}`);
          await fetchExpenses();
        } catch (err) {
          setStatus({ state: "error", message: "Unable to delete expense." });
        }
      }
    });
  };

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Expenses</h3>
        <button className="btn btn-primary" type="button" onClick={handleFormToggle}>
          {formOpen ? (editingId ? "Cancel Edit" : "Close Form") : "Add Expense"}
        </button>
      </div>
      {status.message && <div className={`status ${status.state}`}>{status.message}</div>}
      {viewExpense && (
        <div className="detail-card">
          <div className="detail-head">
            <h4>Expense Details</h4>
            <button className="btn btn-ghost" type="button" onClick={() => setViewExpense(null)}>
              Close
            </button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Title</div>
              <div className="detail-value">{viewExpense.title}</div>
            </div>
            <div>
              <div className="detail-label">Amount</div>
              <div className="detail-value">Rs. {viewExpense.amount}</div>
            </div>
            <div>
              <div className="detail-label">Category</div>
              <div className="detail-value">{viewExpense.category || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Paid On</div>
              <div className="detail-value">{viewExpense.paid_on || "NA"}</div>
            </div>
            <div>
              <div className="detail-label">Notes</div>
              <div className="detail-value">{viewExpense.notes || "NA"}</div>
            </div>
          </div>
        </div>
      )}
      {formOpen && (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              name="title"
              placeholder="Expense Title"
              value={form.title}
              onChange={handleChange}
              required
            />
            <input
              name="amount"
              type="number"
              min="0"
              placeholder="Amount"
              value={form.amount}
              onChange={handleChange}
              required
            />
            <input
              name="category"
              placeholder="Category"
              value={form.category}
              onChange={handleChange}
            />
          </div>
          <div className="form-row">
            <input type="date" name="paid_on" value={form.paid_on} onChange={handleChange} />
            <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
          </div>
          <div className="form-actions">
            <button className="btn btn-secondary" type="submit">
              {editingId ? "Update Expense" : "Save Expense"}
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
            <th>Title</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Paid On</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td>{expense.title}</td>
              <td>Rs. {expense.amount}</td>
              <td>{expense.category || "NA"}</td>
              <td>{expense.paid_on || "NA"}</td>
              <td>
                <div className="table-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => setViewExpense(expense)}>
                    View
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleEdit(expense)}>
                    Edit
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={() => handleDelete(expense.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!expenses.length && (
            <tr>
              <td colSpan="5" className="empty-state">
                No expense records yet.
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
