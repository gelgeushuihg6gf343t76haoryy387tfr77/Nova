import { formatMoneyFromCents } from "../utils/currency";

export default function StatCard({ label, amountCents, tone, hint, currencyCode }) {
  return (
    <article className={`stat-card ${tone || ""}`}>
      <p>{label}</p>
      <h3>{formatMoneyFromCents(amountCents, currencyCode)}</h3>
      {hint ? <p className="stat-card-hint">{hint}</p> : null}
    </article>
  );
}
