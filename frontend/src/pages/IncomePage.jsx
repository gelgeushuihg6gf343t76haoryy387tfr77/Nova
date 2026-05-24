import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import CsvImportModal from "../components/CsvImportModal";
import EditableBubbleList from "../components/EditableBubbleList";
import ToastNotification from "../components/ToastNotification";
import { appendCurrencySuffix, countryCurrencyMap, extractCurrencyCode, formatCurrencyLabel } from "../utils/currency";
import { countryCodeMap, countryFlag } from "../utils/countries";

const LS_FIRST_INCOME = "nova_celebrate_first_income";
const LS_ONBOARD_STEP = "nova_onboarding_step";
const LS_ONBOARD_COMPLETE = "nova_onboarding_complete";
const LS_ONBOARD_CSV = "nova_onboarding_csv_uploaded";

export default function IncomePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultCountry = "Myanmar";
  const defaultCurrency = countryCurrencyMap[defaultCountry];
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount_cents: "",
    occurred_on: today,
    source: "",
    category_id: "",
    country: defaultCountry,
    currency: defaultCurrency,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [notify, setNotify] = useState(null);

  const categoryOptions = useMemo(
    () => [{ value: "", label: "Auto / none" }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
    [categories],
  );

  const catNameById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name])), [categories]);

  const load = useCallback(async (silent = false) => {
    try {
      setLoading(true);
      const [rows, cats] = await Promise.all([
        api.get("/income", { time_scope: "recent" }),
        api.get("/categories", { kind: "income" }),
      ]);
      setItems(rows);
      setCategories(cats);
    } catch (err) {
      if (!silent) setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () =>
    setForm({
      amount_cents: "",
      occurred_on: today,
      source: "",
      category_id: "",
      country: defaultCountry,
      currency: defaultCurrency,
    });

  const create = async (e) => {
    e.preventDefault();
    const errs = {};
    const amount = Number(form.amount_cents);
    if (!Number.isFinite(amount) || amount <= 0) {
      errs.amount_cents = "Use a positive amount in cents (whole number).";
    }
    if (!form.occurred_on) errs.occurred_on = "Choose the date you were paid.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      amount_cents: amount,
      occurred_on: form.occurred_on || today,
      source: appendCurrencySuffix(form.source, form.currency),
      category_id: form.category_id || null,
    };
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      ...payload,
      id: tempId,
      business_id: "",
      notes: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setItems((prev) => [optimistic, ...prev]);
    resetForm();
    setFieldErrors({});
    setSubmitting(true);
    try {
      console.log("Sending income payload:", payload);
      const created = await api.post("/income", payload);
      console.log("Income created:", created);
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      localStorage.setItem(LS_ONBOARD_STEP, "1");
      let msg = "Income added.";
      if (!localStorage.getItem(LS_FIRST_INCOME)) {
        localStorage.setItem(LS_FIRST_INCOME, "1");
        msg = "Nice — your first income is in. Add an expense next to see profit on the dashboard.";
      }
      if (created?.warning) {
        msg = `${msg} ${created.warning}`;
      }
      await load(true);
      setNotify({ message: msg, tone: "success" });
    } catch (err) {
      console.error("Income creation error:", err);
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const updateItem = async (id, patch) => {
    const normalized = { ...patch, amount_cents: Number(patch.amount_cents) };
    if (patch.category_id === "" || patch.category_id === undefined) normalized.category_id = null;
    const previous = items;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...normalized } : x)));
    try {
      const updated = await api.put(`/income/${id}`, normalized);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setNotify({ message: "Income updated", tone: "success" });
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
      await api.del(`/income/${id}`);
      setNotify({ message: "Income deleted", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const listFields = useMemo(
    () => [
      { name: "amount_cents", label: "Amount (cents)", type: "number" },
      { name: "occurred_on", label: "Date", type: "date" },
      { name: "source", label: "Source" },
      { name: "category_id", label: "Category", type: "select", options: categoryOptions },
    ],
    [categoryOptions],
  );

  return (
    <div>
      <header className="page-header-row">
        <h2>Income</h2>
        <p className="page-subtitle">Quick add income in seconds. Keep only amount + date to stay focused.</p>
      </header>

      <form className="quick-add-row" onSubmit={create} noValidate>
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
            placeholder={`e.g. 5000 for ${form.currency} 50`}
            aria-invalid={!!fieldErrors.amount_cents}
          />
          <small>Currency: {formatCurrencyLabel(form.currency)}</small>
          {fieldErrors.amount_cents ? <span className="field-error">{fieldErrors.amount_cents}</span> : null}
        </label>
        <label>
          Country
          <select
            value={form.country}
            onChange={(e) => {
              const country = e.target.value;
              setForm((p) => ({ ...p, country, currency: countryCurrencyMap[country] || p.currency }));
            }}
          >
            {Object.keys(countryCurrencyMap).map((country) => (
              <option key={country} value={country}>
                {countryFlag(countryCodeMap[country])} {country}
              </option>
            ))}
          </select>
        </label>
        <label>
          Currency
          <input
            value={form.currency}
            readOnly
            maxLength={3}
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={form.occurred_on}
            onChange={(e) => {
              setForm((p) => ({ ...p, occurred_on: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, occurred_on: undefined }));
            }}
            required
            aria-invalid={!!fieldErrors.occurred_on}
          />
          {fieldErrors.occurred_on ? <span className="field-error">{fieldErrors.occurred_on}</span> : null}
        </label>
        <label className="quick-add-grow">
          Source
          <input
            value={form.source}
            onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
            placeholder="Client or label (optional)"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add income"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
          Import CSV
        </button>
      </form>

      <EditableBubbleList
        items={items}
        loading={loading}
        emptyText="No income recorded yet. Add some above or import a CSV — your dashboard will update automatically."
        fields={listFields}
        getTitle={(item) => item.source || "Income"}
        getSubtitle={(item) =>
          [item.occurred_on, item.category_id ? catNameById[item.category_id] : null].filter(Boolean).join(" · ") ||
          item.occurred_on
        }
        getCopyText={(item) => `Income ${item.amount_cents} on ${item.occurred_on}`}
        getAmount={(item) => item.amount_cents}
        getCurrencyCode={(item) => extractCurrencyCode(item.source)}
        onUpdate={updateItem}
        onDelete={deleteItem}
      />

      <CsvImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(result, err) => {
          if (err) {
            setNotify({ message: err, tone: "error" });
            return;
          }
          setNotify({
            message: `Imported ${result.created_count} row(s), skipped ${result.failed_count}.${result.warning ? ` ${result.warning}` : ""}`,
            tone: "success",
          });
          localStorage.setItem(LS_ONBOARD_CSV, "1");
          const nextStep = Math.max(Number(localStorage.getItem(LS_ONBOARD_STEP) || "0"), 3);
          localStorage.setItem(LS_ONBOARD_STEP, String(nextStep));
          localStorage.setItem(LS_ONBOARD_COMPLETE, "0");
          load(true);
        }}
      />

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
