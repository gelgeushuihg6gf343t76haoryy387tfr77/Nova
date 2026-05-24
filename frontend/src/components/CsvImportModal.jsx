import { useState } from "react";

import { api } from "../api/client";

export default function CsvImportModal({ open, onClose, onImported, title = "Import transactions (CSV)" }) {
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await api.postMultipart("/transactions/import/csv", fd);
      onImported?.(result, undefined);
      onClose?.();
    } catch (err) {
      onImported?.(null, err.message || "Import failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !busy && onClose?.()}>
      <div className="modal-panel" role="dialog" aria-modal="true" onClick={(ev) => ev.stopPropagation()}>
        <h4>{title}</h4>
        <p className="modal-help">
          Required columns: <strong>amount</strong> (dollars, e.g. 24.99), <strong>type</strong> (income or expense),{" "}
          <strong>description</strong>. Optional: <strong>date</strong> (YYYY-MM-DD); rows without a date use today.
        </p>
        <label className="file-upload-label">
          <span>{busy ? "Uploading…" : "Choose CSV file"}</span>
          <input type="file" accept=".csv,text/csv" onChange={onPick} disabled={busy} />
        </label>
        <button type="button" className="btn-secondary" onClick={() => onClose?.()} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
