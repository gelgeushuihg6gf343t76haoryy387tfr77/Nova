import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import CsvImportModal from "../components/CsvImportModal";
import EditableBubbleList from "../components/EditableBubbleList";
import ToastNotification from "../components/ToastNotification";
import { appendCurrencySuffix, countryCurrencyMap, dollarsToCents, extractCurrencyCode } from "../utils/currency";
import { countryCodeMap, countryFlag } from "../utils/countries";

const LS_FIRST_EXPENSE = "nova_celebrate_first_expense";
const LS_ONBOARD_STEP = "nova_onboarding_step";
const LS_ONBOARD_COMPLETE = "nova_onboarding_complete";
const LS_ONBOARD_CSV = "nova_onboarding_csv_uploaded";

export default function ExpensePage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const defaultCountry = "Myanmar";
  const defaultCurrency = countryCurrencyMap[defaultCountry];
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    amount_cents: "",
    occurred_on: today,
    vendor: "",
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
        api.get("/expenses", { time_scope: "recent" }),
        api.get("/categories", { kind: "expense" }),
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
      vendor: "",
      category_id: "",
      country: defaultCountry,
      currency: defaultCurrency,
    });

  const create = async (e) => {
    e.preventDefault();
    const errs = {};
    const dollars = Number(form.amount_cents);
    if (!Number.isFinite(dollars) || dollars <= 0) {
      errs.amount_cents = "Enter a positive amount.";
    }
    if (!form.occurred_on) errs.occurred_on = "Choose when the expense happened.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      amount_cents: dollarsToCents(dollars),
      occurred_on: form.occurred_on || today,
      vendor: appendCurrencySuffix(form.vendor, form.currency),
      is_recurring: false,
      category_id: form.category_id || null,
    };
    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      ...payload,
      id: tempId,
      business_id: "",
      payment_method: null,
      notes: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    };
    setItems((prev) => [optimistic, ...prev]);
    resetForm();
    setFieldErrors({});
    setSubmitting(true);
    try {
      const created = await api.post("/expenses", payload);
      setItems((prev) => prev.filter((x) => x.id !== tempId));
      localStorage.setItem(LS_ONBOARD_STEP, "2");
      let msg = "Expense added.";
      if (!localStorage.getItem(LS_FIRST_EXPENSE)) {
        localStorage.setItem(LS_FIRST_EXPENSE, "1");
        msg = "First expense logged — open the dashboard to see profit vs income.";
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
    const normalized = { ...patch, amount_cents: dollarsToCents(patch.amount_cents) };
    if (patch.category_id === "" || patch.category_id === undefined) normalized.category_id = null;
    const previous = items;
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...normalized } : x)));
    try {
      const updated = await api.put(`/expenses/${id}`, normalized);
      setItems((prev) => prev.map((x) => (x.id === id ? updated : x)));
      setNotify({ message: "Expense updated", tone: "success" });
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
      await api.del(`/expenses/${id}`);
      setNotify({ message: "Expense deleted", tone: "success" });
    } catch (err) {
      setItems(previous);
      setNotify({ message: err.message, tone: "error" });
    }
  };

  const listFields = useMemo(
    () => [
      { name: "amount_cents", label: "Amount", type: "cents" },
      { name: "occurred_on", label: "Date", type: "date" },
      { name: "vendor", label: "Vendor" },
      { name: "category_id", label: "Category", type: "select", options: categoryOptions },
    ],
    [categoryOptions],
  );

  return (
    <div>
      <header className="page-header-row">
        <h2>Expenses</h2>
        <p className="page-subtitle">Quick add spending with only essentials first, then edit details inline later.</p>
      </header>

      <form className="quick-add-row" onSubmit={create} noValidate>
        <label>
          Amount
          <input
            type="number"
            step="any"
            min={0}
            value={form.amount_cents}
            onChange={(e) => {
              setForm((p) => ({ ...p, amount_cents: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, amount_cents: undefined }));
            }}
            placeholder={`e.g. 12.99 ${form.currency}`}
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
          Vendor
          <input
            value={form.vendor}
            onChange={(e) => setForm((p) => ({ ...p, vendor: e.target.value }))}
            placeholder="Store or service (optional)"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Add expense"}
        </button>
        <button type="button" className="btn-secondary" onClick={() => setImportOpen(true)}>
          Import CSV
        </button>
      </form>

      <EditableBubbleList
        items={items}
        loading={loading}
        emptyText="No expenses yet. Use the form above to track your spending or import a CSV file."
        fields={listFields}
        getTitle={(item) => item.vendor || "Expense"}
        getSubtitle={(item) =>
          [item.occurred_on, item.category_id ? catNameById[item.category_id] : null].filter(Boolean).join(" · ") ||
          item.occurred_on
        }
        getCopyText={(item) => `Expense ${item.amount_cents} on ${item.occurred_on}`}
        getAmount={(item) => item.amount_cents}
        getCurrencyCode={(item) => extractCurrencyCode(item.vendor)}
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
