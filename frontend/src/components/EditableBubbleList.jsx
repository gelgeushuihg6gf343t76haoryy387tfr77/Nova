import { useEffect, useState } from "react";

import BubbleCard from "./BubbleCard";
import ConfirmDialog from "./ConfirmDialog";
import LoadingSkeleton from "./LoadingSkeleton";

export default function EditableBubbleList({
  items,
  loading,
  emptyText,
  fields,
  getTitle,
  getSubtitle,
  getCopyText,
  getAmount,
  getCurrencyCode,
  onUpdate,
  onDelete,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pendingId, setPendingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (!editingId) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") {
        setEditingId(null);
        setEditForm({});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId]);

  if (loading) return <LoadingSkeleton count={4} />;
  if (!items.length) return <p className="empty-state">{emptyText}</p>;

  const startEdit = (item) => {
    setEditingId(item.id);
    const next = {};
    fields.forEach((f) => {
      const v = item[f.name];
      next[f.name] = v === null || v === undefined ? "" : String(v);
    });
    setEditForm(next);
  };

  const saveEdit = async (item) => {
    setPendingId(item.id);
    await onUpdate(item.id, editForm);
    setPendingId(null);
    setEditingId(null);
    setEditForm({});
  };

  const confirmDelete = (id) => setConfirmDeleteId(id);

  const itemForDelete = items.find((i) => i.id === confirmDeleteId);

  return (
    <>
      <div className="bubble-grid">
        {items.map((item) => {
          const editing = editingId === item.id;
          const optimistic = item._optimistic === true;
          return (
            <BubbleCard
              key={item.id}
              title={getTitle(item)}
              subtitle={getSubtitle(item)}
              amountCents={getAmount(item)}
              currencyCode={getCurrencyCode ? getCurrencyCode(item) : undefined}
              copyText={getCopyText(item)}
              pending={pendingId === item.id || optimistic}
              onEdit={optimistic ? undefined : () => startEdit(item)}
              onDelete={optimistic ? undefined : () => confirmDelete(item.id)}
            >
            {editing ? (
              <div className="inline-edit">
                {fields.map((f) => (
                  <label key={f.name}>
                    {f.label}
                    {f.type === "select" && f.options ? (
                      <select
                        value={editForm[f.name] ?? ""}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      >
                        {f.options.map((opt) => (
                          <option key={opt.value === "" ? "_empty" : opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={f.type || "text"}
                        value={editForm[f.name] ?? ""}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, [f.name]: e.target.value }))}
                      />
                    )}
                  </label>
                ))}
                <div className="inline-edit-actions">
                  <button className="btn-secondary" type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => saveEdit(item)}>
                    Save
                  </button>
                </div>
              </div>
            ) : null}
          </BubbleCard>
        );
      })}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete this item?"
        message="This action cannot be undone. The data will be permanently removed."
        onConfirm={() => {
          if (confirmDeleteId) onDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}
