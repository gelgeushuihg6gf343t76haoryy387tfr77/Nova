import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client";
import ConfirmDialog from "../components/ConfirmDialog";
import ToastNotification from "../components/ToastNotification";
import { dollarsToCents, extractCurrencyCode, formatMoneyFromCents } from "../utils/currency";

function toTimestamp(value) {
  const date = value ? new Date(value) : null;
  const time = date?.getTime?.();
  return Number.isFinite(time) ? time : 0;
}

function normalizeIncome(item) {
  return {
    ...item,
    type: "income",
    description: item.source || "Income",
    occurred_on: item.occurred_on || item.created_at || "",
    currencyCode: extractCurrencyCode(item.source),
  };
}

function normalizeExpense(item) {
  return {
    ...item,
    type: "expense",
    description: item.vendor || "Expense",
    occurred_on: item.occurred_on || item.created_at || "",
    currencyCode: extractCurrencyCode(item.vendor),
  };
}

export default function TransactionsPage() {
  const [incomeRows, setIncomeRows] = useState([]);
  const [expenseRows, setExpenseRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editingTx, setEditingTx] = useState(null);
  const [editForm, setEditForm] = useState({ description: "", amount_cents: "", occurred_on: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteTx, setConfirmDeleteTx] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [income, expenses] = await Promise.all([api.get("/income"), api.get("/expenses")]);
        setIncomeRows(Array.isArray(income) ? income : []);
        setExpenseRows(Array.isArray(expenses) ? expenses : []);
      } catch (err) {
        setNotify({ message: err.message, tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const transactions = useMemo(() => {
    const merged = [...incomeRows.map(normalizeIncome), ...expenseRows.map(normalizeExpense)];
    const newestFirst = merged.sort(
      (a, b) => toTimestamp(b.created_at || b.occurred_on) - toTimestamp(a.created_at || a.occurred_on),
    );
    const oldestFirst = [...newestFirst].reverse();
    let running = 0;
    const withBalance = oldestFirst.map((tx) => {
      const amount = Number(tx.amount_cents || 0);
      running += tx.type === "income" ? amount : -amount;
      return { ...tx, runningBalanceCents: running };
    });
    return withBalance.reverse();
  }, [incomeRows, expenseRows]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (typeFilter !== "all" && tx.type !== typeFilter) return false;
      if (fromDate && tx.occurred_on && tx.occurred_on < fromDate) return false;
      if (toDate && tx.occurred_on && tx.occurred_on > toDate) return false;
      return true;
    });
  }, [transactions, typeFilter, fromDate, toDate]);

  const openEdit = (tx) => {
    setEditingTx(tx);
    setEditForm({
      description: tx.description || "",
      amount_cents: String((tx.amount_cents || 0) / 100),
      occurred_on: tx.occurred_on || "",
    });
  };

  const closeEdit = () => {
    setEditingTx(null);
    setEditForm({ description: "", amount_cents: "", occurred_on: "" });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    const dollars = Number(editForm.amount_cents);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setNotify({ message: "Please enter a valid positive amount.", tone: "error" });
      return;
    }
    setSavingEdit(true);
    try {
      const payload = {
        amount_cents: dollarsToCents(dollars),
        occurred_on: editForm.occurred_on,
        ...(editingTx.type === "income" ? { source: editForm.description } : { vendor: editForm.description }),
      };
      const endpoint = editingTx.type === "income" ? `/income/${editingTx.id}` : `/expenses/${editingTx.id}`;
      const updated = await api.put(endpoint, payload);
      if (editingTx.type === "income") {
        setIncomeRows((prev) => prev.map((item) => (item.id === editingTx.id ? updated : item)));
      } else {
        setExpenseRows((prev) => prev.map((item) => (item.id === editingTx.id ? updated : item)));
      }
      setNotify({ message: "Transaction updated.", tone: "success" });
      closeEdit();
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteTx = async (tx) => {
    try {
      const endpoint = tx.type === "income" ? `/income/${tx.id}` : `/expenses/${tx.id}`;
      await api.del(endpoint);
      if (tx.type === "income") setIncomeRows((prev) => prev.filter((item) => item.id !== tx.id));
      if (tx.type === "expense") setExpenseRows((prev) => prev.filter((item) => item.id !== tx.id));
      setNotify({ message: "Transaction deleted.", tone: "success" });
      if (editingTx?.id === tx.id && editingTx.type === tx.type) closeEdit();
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    }
  };

  return (
    <div className="transactions-page">
      <header className="page-header-row">
        <h2>All Transactions</h2>
        <p>View income and expenses together, sorted by newest first.</p>
      </header>

      <section className="transactions-filters">
        <div className="segmented transactions-type-filter">
          <button type="button" className={typeFilter === "all" ? "active" : ""} onClick={() => setTypeFilter("all")}>
            All
          </button>
          <button type="button" className={typeFilter === "income" ? "active" : ""} onClick={() => setTypeFilter("income")}>
            Income
          </button>
          <button type="button" className={typeFilter === "expense" ? "active" : ""} onClick={() => setTypeFilter("expense")}>
            Expense
          </button>
        </div>
        <label>
          From
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          To
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>
      </section>

      <section className="transactions-list">
        {loading ? <p className="empty-state" style={{ textAlign: "center", padding: 32 }}>Loading transactions…</p> : null}
        {!loading && !filteredTransactions.length ? (
          <div className="transactions-empty">
            <h3>No transactions yet</h3>
            <p>Start tracking your money — add your first income or expense to see your running balance.</p>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <Link to="/income">
                <button type="button">Add Income</button>
              </Link>
              <Link to="/expenses">
                <button type="button" className="btn-secondary">Add Expense</button>
              </Link>
            </div>
          </div>
        ) : null}
        {!loading &&
          filteredTransactions.map((tx) => (
            <article
              key={`${tx.type}-${tx.id}`}
              className="transaction-row"
              role="button"
              tabIndex={0}
              onClick={() => openEdit(tx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openEdit(tx);
                }
              }}
            >
              <div>
                <span className={`type-badge ${tx.type}`}>{tx.type === "income" ? "Income" : "Expense"}</span>
              </div>
              <div className="transaction-description">{tx.description}</div>
              <div className="transaction-meta">
                <strong className={tx.type === "income" ? "amount-income" : "amount-expense"}>
                  {formatMoneyFromCents(tx.amount_cents, tx.currencyCode)}
                </strong>
                <small>Balance: {formatMoneyFromCents(tx.runningBalanceCents, tx.currencyCode)}</small>
                <small>{tx.occurred_on || "N/A"}</small>
                <button
                  type="button"
                  className="tx-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDeleteTx(tx);
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
      </section>

      {editingTx ? (
        <div className="modal-backdrop" onClick={closeEdit}>
          <form className="modal-panel" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <h3>Edit transaction</h3>
            <label>
              Description
              <input
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>
            <label>
              Amount
              <input
                type="number"
                step="any"
                min={0}
                value={editForm.amount_cents}
                onChange={(e) => setEditForm((prev) => ({ ...prev, amount_cents: e.target.value }))}
                required
              />
            </label>
            <label>
              Date
              <input
                type="date"
                value={editForm.occurred_on}
                onChange={(e) => setEditForm((prev) => ({ ...prev, occurred_on: e.target.value }))}
                required
              />
            </label>
            <div className="inline-edit-actions">
              <button type="submit" disabled={savingEdit}>
                {savingEdit ? "Saving…" : "Save"}
              </button>
              <button type="button" className="btn-secondary" onClick={closeEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirmDeleteTx}
        title="Delete this transaction?"
        message={`This will permanently remove the ${confirmDeleteTx?.type || ""} transaction. This cannot be undone.`}
        onConfirm={() => {
          if (confirmDeleteTx) deleteTx(confirmDeleteTx);
          setConfirmDeleteTx(null);
        }}
        onCancel={() => setConfirmDeleteTx(null)}
      />

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
