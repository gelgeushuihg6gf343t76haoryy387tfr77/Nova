import { formatMoneyFromCents } from "../utils/currency";

function ArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

function Minus() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

export default function KpiCard({ label, amountCents, trend, tone = "neutral" }) {
  const trendDir = trend?.direction;
  const trendPct = trend?.percentage;

  return (
    <article className={`mini-stat tone-${tone}`}>
      <p>{label}</p>
      <strong>{formatMoneyFromCents(amountCents || 0)}</strong>
      {trendDir ? (
        <span className={`trend-badge ${trendDir}`} style={{ marginTop: 4, display: "inline-flex" }}>
          {trendDir === "up" ? <ArrowUp /> : trendDir === "down" ? <ArrowDown /> : <Minus />}
          {trendPct ? `${trendPct}%` : trendDir}
        </span>
      ) : null}
    </article>
  );
}
