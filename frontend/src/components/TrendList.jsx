export default function TrendList({ points }) {
  return (
    <section className="panel">
      <h2>Monthly Trend (Last 3)</h2>
      <ul className="list">
        {points.map((p) => (
          <li key={p.month}>
            <span>{p.month}</span>
            <span>Income ${(p.income_cents / 100).toLocaleString()}</span>
            <span>Expense ${(p.expense_cents / 100).toLocaleString()}</span>
            <span>Profit ${(p.profit_cents / 100).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
