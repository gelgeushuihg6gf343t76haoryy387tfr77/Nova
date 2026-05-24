import { useEffect, useState } from "react";

import { api } from "../api/client";
import EditableBubbleList from "../components/EditableBubbleList";
import ToastNotification from "../components/ToastNotification";

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ vendor: "", amount_cents: "", billing_cycle: "monthly", start_date: "", next_billing_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setItems(await api.get("/subscriptions"));
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, amount_cents: Number(form.amount_cents) };
      const created = await api.post("/subscriptions", payload);
      setItems((prev) => [created, ...prev]);
      setForm({ vendor: "", amount_cents: "", billing_cycle: "monthly", start_date: "", next_billing_date: "" });
      setNotify({ message: "Subscription created", tone: "success" });
    } catch (err) {
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
      const updated = await api.put(`/subscriptions/${id}`, normalized);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setNotify({ message: "Subscription updated", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const deleteItem = async (id) => {
    const previous = items;
    setItems((prev) => prev.filter((x) => x.id !== id));
    try {
      await api.del(`/subscriptions/${id}`);
      setNotify({ message: "Subscription deleted", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  return (
    <div>
      <header className="page-header-row">
        <h2>Subscriptions</h2>
        <p className="page-subtitle">Track recurring bills like rent, SaaS tools, and utilities.</p>
      </header>
      <form className="quick-add-row" onSubmit={create}>
        <label className="quick-add-grow">
          Vendor
          <input value={form.vendor} onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))} placeholder="e.g. Netflix" required />
        </label>
        <label>
          Amount (¢)
          <input type="number" min={1} value={form.amount_cents} onChange={(e) => setForm((p) => ({ ...p, amount_cents: e.target.value }))} placeholder="e.g. 1999" required />
        </label>
        <label>
          Cycle
          <select value={form.billing_cycle} onChange={(e) => setForm((p) => ({ ...p, billing_cycle: e.target.value }))} required>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label>
          Start
          <input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} required />
        </label>
        <label>
          Next Billing
          <input type="date" value={form.next_billing_date} onChange={(e) => setForm((p) => ({ ...p, next_billing_date: e.target.value }))} required />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? "Adding…" : "Add Subscription"}</button>
      </form>
      <EditableBubbleList
        items={items}
        loading={loading}
        emptyText="No subscriptions yet. Add rent, SaaS tools, or any recurring bills to track upcoming charges."
        fields={[
          { name: "vendor", label: "Vendor" },
          { name: "amount_cents", label: "Amount (cents)", type: "number" },
          { name: "billing_cycle", label: "Cycle" },
          { name: "start_date", label: "Start", type: "date" },
          { name: "next_billing_date", label: "Next Billing", type: "date" },
        ]}
        getTitle={(item) => item.vendor}
        getSubtitle={(item) => `Next ${item.next_billing_date}`}
        getCopyText={(item) => `${item.vendor}, ${item.amount_cents}, ${item.next_billing_date}`}
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
