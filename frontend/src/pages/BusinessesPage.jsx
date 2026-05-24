import { useMemo, useState } from "react";

import ToastNotification from "../components/ToastNotification";
import { useAuth } from "../context/AuthContext";
import { formatCurrencyLabel } from "../utils/currency";
import { allCountries, countryFlag } from "../utils/countries";

export default function BusinessesPage() {
  const { businesses, createBusiness, reloadBusinesses } = useAuth();
  const defaultCountry = allCountries[0];
  const [form, setForm] = useState({
    name: "",
    country: defaultCountry.label,
    country_code: defaultCountry.code,
    currency_code: defaultCountry.currency,
  });
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);

  const selectedCountry = useMemo(
    () => allCountries.find((c) => c.label === form.country) || defaultCountry,
    [form.country]
  );

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNotify({ message: "Business name is required.", tone: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await createBusiness({
        name: form.name.trim(),
        country_code: form.country_code,
        currency_code: form.currency_code,
      });
      await reloadBusinesses();
      setForm({
        name: "",
        country: selectedCountry.label,
        country_code: selectedCountry.code,
        currency_code: selectedCountry.currency,
      });
      setNotify({ message: "Business added.", tone: "success" });
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <header className="page-header-row">
        <h2>Businesses</h2>
        <p className="page-subtitle">Add and manage your businesses with auto country-currency mapping.</p>
      </header>

      <form className="quick-add-row" onSubmit={submit}>
        <label className="quick-add-grow">
          Business name
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Nova Retail"
          />
        </label>
        <label>
           Country
          <select
            value={form.country}
            onChange={(e) => {
              const country = allCountries.find((c) => c.label === e.target.value) || defaultCountry;
              setForm((p) => ({
                ...p,
                country: country.label,
                country_code: country.code,
                currency_code: country.currency,
              }));
            }}
          >
            {allCountries.map((country) => (
              <option key={country.code} value={country.label}>
                {countryFlag(country.code)} {country.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Currency
          <input
            value={form.currency_code}
            readOnly
            maxLength={3}
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Adding…" : "Add Business"}
        </button>
      </form>

      <div className="bubble-grid">
        {businesses.map((b) => (
          <article className="bubble-card" key={b.id}>
            <h4>{b.name}</h4>
            <p>
              {countryFlag(b.country_code)} {(allCountries.find((country) => country.code === b.country_code)?.label || b.country_code)} → {formatCurrencyLabel(b.currency_code)}
            </p>
          </article>
        ))}
      </div>

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
