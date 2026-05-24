import { useMemo, useState } from "react";

import ToastNotification from "../components/ToastNotification";
import { useAuth } from "../context/AuthContext";
import { allCountries, countryFlag } from "../utils/countries";
import { currencySymbolMap } from "../utils/currency";

const countryOptions = allCountries.map((c) => ({
  label: `${countryFlag(c.code)} ${c.label} — ${c.currency} (${currencySymbolMap[c.currency] || c.currency})`,
  countryCode: c.code,
  currencyCode: c.currency,
}));

export default function BusinessSetupPage() {
  const { createBusiness } = useAuth();
  const [form, setForm] = useState({ name: "", countryIdx: 0 });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);

  const selected = countryOptions[form.countryIdx];

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Give your business a short name.";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    setNotify(null);
    try {
      await createBusiness({ name: form.name.trim(), country_code: selected.countryCode, currency_code: selected.currencyCode });
      setNotify({ message: "Business created — you're ready to add income.", tone: "success" });
      window.setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <h2>Create your business</h2>
      <p className="auth-subtitle">
        This is the legal or brand name you track money under. You can add more businesses later.
      </p>
      <form className="form-grid" onSubmit={submit} noValidate>
        <label>
          Business name
          <input
            value={form.name}
            onChange={(e) => {
              setForm((p) => ({ ...p, name: e.target.value }));
              setFieldErrors((fe) => ({ ...fe, name: undefined }));
            }}
            placeholder="Your business name"
          />
          {fieldErrors.name ? <span className="field-error">{fieldErrors.name}</span> : null}
        </label>
        <label>
          Country & currency
          <select
            value={form.countryIdx}
            onChange={(e) => setForm((p) => ({ ...p, countryIdx: Number(e.target.value) }))}
          >
            {countryOptions.map((opt, i) => (
              <option key={opt.countryCode} value={i}>{opt.label}</option>
            ))}
          </select>
          <small>Base currency: {selected.currencyCode} ({currencySymbolMap[selected.currencyCode] || selected.currencyCode})</small>
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create Business"}
        </button>
      </form>
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
