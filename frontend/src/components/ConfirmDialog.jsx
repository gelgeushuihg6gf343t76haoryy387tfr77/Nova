export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-panel confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="btn-secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-danger" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
