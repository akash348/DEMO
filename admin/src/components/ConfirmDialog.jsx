export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-card">
        <h4>{title}</h4>
        {message && <p>{message}</p>}
        <div className="dialog-actions">
          <button className="btn btn-ghost" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-primary" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
