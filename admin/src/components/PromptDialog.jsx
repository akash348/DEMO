export default function PromptDialog({
  open,
  title,
  message,
  value,
  label = "Value",
  placeholder,
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  onChange,
  onConfirm,
  onCancel,
  onGenerate
}) {
  if (!open) return null;

  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-card">
        <h4>{title}</h4>
        {message && <p>{message}</p>}
        <label className="dialog-label">
          <span>{label}</span>
          <input
            type="text"
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            autoComplete="new-password"
          />
        </label>
        <div className="dialog-actions">
          {onGenerate && (
            <button className="btn btn-ghost" type="button" onClick={onGenerate}>
              Auto Generate
            </button>
          )}
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
