export default function KpiCard({ label, amount, tone = "neutral" }) {
  return (
    <article className={`kpi kpi-${tone}`}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">${(amount / 100).toLocaleString()}</p>
    </article>
  );
}
