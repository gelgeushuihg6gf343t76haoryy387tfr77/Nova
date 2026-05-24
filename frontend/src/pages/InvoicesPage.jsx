import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import EditableBubbleList from "../components/EditableBubbleList";
import ToastNotification from "../components/ToastNotification";

function addDays(isoDay, days) {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function InvoicesPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultDue = useMemo(() => addDays(today, 14), [today]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    invoice_number: "",
    client_name: "",
    amount_cents: "",
    issued_on: today,
    due_on: defaultDue,
    status: "sent",
  });
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const LS_FIRST_INV = "nova_celebrate_first_invoice";

  const load = useCallback(async (silent = false) => {
    try {
      setLoading(true);
      setItems(await api.get("/invoices"));
    } catch (err) {
      if (!silent) setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e) => {
    e.preventDefault();
    const errs = {};
    const amount = Number(form.amount_cents);
    if (!form.invoice_number.trim()) errs.invoice_number = "Invoice number is required.";
    if (!form.client_name.trim()) errs.client_name = "Client name is required.";
    if (!Number.isFinite(amount) || amount <= 0) errs.amount_cents = "Enter amount in cents (positive whole number).";
    if (!form.issued_on) errs.issued_on = "Choose an issue date.";
    if (!form.due_on) errs.due_on = "Choose a due date.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      invoice_number: form.invoice_number.trim(),
      client_name: form.client_name.trim(),
      amount_cents: amount,
      issued_on: form.issued_on,
      due_on: form.due_on,
      status: form.status,
    };
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      ...payload,
      id: tempId,
      business_id: "",
      paid_on: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setItems((prev) => [optimistic, ...prev]);
    setForm({
      invoice_number: "",
      client_name: "",
      amount_cents: "",
      issued_on: today,
      due_on: addDays(today, 14),
      status: "sent",
    });
    setFieldErrors({});
    setSubmitting(true);
    try {
      const created = await api.post("/invoices", payload);
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      let msg = "Invoice created.";
      if (!localStorage.getItem(LS_FIRST_INV)) {
        localStorage.setItem(LS_FIRST_INV, "1");
        msg = "First invoice created — track when it’s paid from this list.";
      }
      if (created?.warning) {
        msg = `${msg} ${created.warning}`;
      }
      await load(true);
      setNotify({ message: msg, tone: "success" });
    } catch (err) {
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id, patch) => {
    const normalized = { ...patch, amount_cents: Number(patch.amount_cents) };
    const previous = items;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...normalized } : x)));
    try {
      const updated = await api.put(`/invoices/${id}`, normalized);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setNotify({ message: "Invoice updated", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const deleteItem = async (id) => {
    const previous = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await api.del(`/invoices/${id}`);
      setNotify({ message: "Invoice deleted", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  return (
    <div>
      <header className="page-header-row">
        <h2>Invoices</h2>
        <p className="page-subtitle">Keep it simple: client, invoice number, amount, and due date.</p>
      </header>

      <form className="quick-add-row quick-add-row-wrap" onSubmit={create} noValidate>
        <label>
          Invoice #
          <input
            value={form.invoice_number}
            onChange={(e) => {
              setForm((p) => ({ ...p, invoice_number: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, invoice_number: undefined }));
            }}
            placeholder="INV-001"
          />
          {fieldErrors.invoice_number ? <span className="field-error">{fieldErrors.invoice_number}</span> : null}
        </label>
        <label className="quick-add-grow">
          Client
          <input
            value={form.client_name}
            onChange={(e) => {
              setForm((p) => ({ ...p, client_name: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, client_name: undefined }));
            }}
            placeholder="Client name"
          />
          {fieldErrors.client_name ? <span className="field-error">{fieldErrors.client_name}</span> : null}
        </label>
        <label>
          Amount (¢)
          <input
            type="number"
            min={1}
            value={form.amount_cents}
            onChange={(e) => {
              setForm((p) => ({ ...p, amount_cents: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, amount_cents: undefined }));
            }}
          />
          {fieldErrors.amount_cents ? <span className="field-error">{fieldErrors.amount_cents}</span> : null}
        </label>
        <label>
          Due
          <input
            type="date"
            value={form.due_on}
            onChange={(e) => {
              setForm((p) => ({ ...p, due_on: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, due_on: undefined }));
            }}
          />
          {fieldErrors.due_on ? <span className="field-error">{fieldErrors.due_on}</span> : null}
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add invoice"}
        </button>
      </form>

      <EditableBubbleList
        items={items}
        loading={loading}
        emptyText="No invoices yet. Create one above to start tracking what your clients owe you."
        fields={[
          { name: "invoice_number", label: "Invoice #" },
          { name: "client_name", label: "Client" },
          { name: "amount_cents", label: "Amount (cents)", type: "number" },
          { name: "issued_on", label: "Issued", type: "date" },
          { name: "due_on", label: "Due", type: "date" },
          { name: "status", label: "Status" },
        ]}
        getTitle={(item) => `${item.invoice_number} - ${item.client_name}`}
        getSubtitle={(item) => `Status: ${item.status}`}
        getCopyText={(item) => `Invoice ${item.invoice_number}, ${item.amount_cents}, ${item.status}`}
        getAmount={(item) => item.amount_cents}
        onUpdate={updateItem}
        onDelete={deleteItem}
      />

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
