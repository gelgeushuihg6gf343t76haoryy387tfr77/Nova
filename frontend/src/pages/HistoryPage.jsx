import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import EditableBubbleList from "../components/EditableBubbleList";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ToastNotification from "../components/ToastNotification";
import { extractCurrencyCode } from "../utils/currency";

function startOfDayIso(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00.000Z`).toISOString();
}

/** Exclusive upper bound: includes all of `dateStr` in UTC when paired with created_before &lt; this. */
function exclusiveEndIso(dateStr) {
  if (!dateStr) return null;
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString();
}

export default function HistoryPage() {
  const [kind, setKind] = useState("income");
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notify, setNotify] = useState(null);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);

  const categoryOptions = useMemo(
    () => [{ value: "", label: "None" }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  );

  const catNameById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { time_scope: "history" };
      if (from) params.created_after = startOfDayIso(from);
      if (to) params.created_before = exclusiveEndIso(to);
      const path = kind === "income" ? "/income" : "/expenses";
      const catKind = kind === "income" ? "income" : "expense";
      const [rows, cats] = await Promise.all([api.get(path, params), api.get("/categories", { kind: catKind })]);
      setItems(rows);
      setCategories(cats);
      setNotify(null);
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, [kind, from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const updateItem = async (id, patch) => {
    const normalized = { ...patch, amount_cents: Number(patch.amount_cents) };
    if (patch.category_id === "" || patch.category_id === undefined) normalized.category_id = null;
    const previous = items;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...normalized } : x)));
    try {
      const path = kind === "income" ? `/income/${id}` : `/expenses/${id}`;
      const updated = await api.put(path, normalized);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setNotify({ message: "Updated", tone: "success" });
      load();
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const deleteItem = async (id) => {
    const previous = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      const path = kind === "income" ? `/income/${id}` : `/expenses/${id}`;
      await api.del(path);
      setNotify({ message: "Deleted", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const clearAllHistory = async () => {
    if (confirmText !== "CONFIRM") return;
    setClearing(true);
    try {
      const result = await api.del("/transactions/all");
      setItems([]);
      setNotify({ message: result?.message || "All history cleared.", tone: "success" });
      setClearModalOpen(false);
      setConfirmText("");
      load();
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setClearing(false);
    }
  };

  const incomeFields = useMemo(
    () => [
      { name: "amount_cents", label: "Amount (cents)", type: "number" },
      { name: "occurred_on", label: "Date", type: "date" },
      { name: "source", label: "Source" },
      { name: "category_id", label: "Category", type: "select", options: categoryOptions },
    ],
    [categoryOptions],
  );

  const expenseFields = useMemo(
    () => [
      { name: "amount_cents", label: "Amount (cents)", type: "number" },
      { name: "occurred_on", label: "Date", type: "date" },
      { name: "vendor", label: "Vendor" },
      { name: "category_id", label: "Category", type: "select", options: categoryOptions },
    ],
    [categoryOptions],
  );

  return (
    <div className="page-history">
      <header className="page-header-row">
        <h2>History</h2>
        <p className="page-subtitle">
          Older than 30 days (by when the record was added). Filter by created date, then edit categories inline —
          Escape cancels edit.
        </p>
      </header>

      <div className="history-toolbar">
        <div className="segmented">
          <button type="button" className={kind === "income" ? "active" : ""} onClick={() => setKind("income")}>
            Income
          </button>
          <button type="button" className={kind === "expense" ? "active" : ""} onClick={() => setKind("expense")}>
            Expenses
          </button>
        </div>
        <label>
          Created from
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Created to
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="button" onClick={() => load()}>
          Apply
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <EditableBubbleList
          items={items}
          loading={false}
          emptyText={
            kind === "income"
              ? "Nothing in this range. Try widening dates, or check Recent on the Income page for newer entries."
              : "Nothing in this range. Adjust filters or add current expenses on the Expenses page."
          }
          fields={kind === "income" ? incomeFields : expenseFields}
          getTitle={(item) => (kind === "income" ? item.source || "Income" : item.vendor || "Expense")}
          getSubtitle={(item) => {
            const bits = [
              item.occurred_on,
              item.category_id ? catNameById[item.category_id] : null,
              item.created_at ? `added ${item.created_at.slice(0, 10)}` : null,
            ].filter(Boolean);
            return bits.join(" · ");
          }}
          getCopyText={(item) =>
            kind === "income"
              ? `Income ${item.amount_cents} on ${item.occurred_on}`
              : `Expense ${item.amount_cents} on ${item.occurred_on}`
          }
          getAmount={(item) => item.amount_cents}
          getCurrencyCode={(item) => extractCurrencyCode(kind === "income" ? item.source : item.vendor)}
          onUpdate={updateItem}
          onDelete={deleteItem}
        />
      )}

      <div className="history-danger-zone">
        <button type="button" className="btn-danger" onClick={() => setClearModalOpen(true)}>
          Clear History
        </button>
      </div>

      {clearModalOpen ? (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true">
            <h4>Clear all history?</h4>
            <p className="modal-help">Are you sure you want to clear all history for this business?</p>
            <label>
              Type CONFIRM to continue
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CONFIRM"
                disabled={clearing}
              />
            </label>
            <div className="inline-edit-actions">
              <button type="button" className="btn-secondary" onClick={() => { setClearModalOpen(false); setConfirmText(""); }} disabled={clearing}>
                Cancel
              </button>
              <button type="button" className="btn-danger" onClick={clearAllHistory} disabled={confirmText !== "CONFIRM" || clearing}>
                {clearing ? "Clearing..." : "Delete all"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
