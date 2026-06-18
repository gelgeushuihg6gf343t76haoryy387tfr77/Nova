import { useEffect, useRef, useState } from "react";
import { formatMoneyFromCents } from "../utils/currency";

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

function Minus() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}

function AnimatedNumber({ value, format = (v) => v }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const start = 0;
    const duration = 800;
    const startTime = performance.now();

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (value - start) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{format(display)}</>;
}

const iconMap = {
  income: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 7l-5-5-5 5" />
    </svg>
  ),
  expense: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V2M17 17l-5 5-5-5" />
    </svg>
  ),
  profit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 7l-5-5-5 5" />
    </svg>
  ),
};

export default function StatCard({ label, amountCents, trend, hint, tone = "neutral", currencyCode, loading }) {
  const icon = iconMap[tone] || null;

  if (loading) {
    return (
      <article className="stat-card skeleton">
        <div className="skeleton-line w-55" style={{ height: 10, marginBottom: 8 }} />
        <div className="skeleton-line w-70" style={{ height: 32, marginBottom: 4 }} />
        <div className="skeleton-line w-40" style={{ height: 10 }} />
      </article>
    );
  }

  const trendDir = trend?.direction;
  const trendPct = trend?.percentage;
  const trendLabel = trend?.label;

  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-card-header">
        <p>{label}</p>
        {icon && <span className="stat-card-icon">{icon}</span>}
      </div>
      <h3>
        <AnimatedNumber value={amountCents || 0} format={(v) => formatMoneyFromCents(v, currencyCode)} />
      </h3>
      <div className="stat-card-footer">
        {hint ? <span className="stat-card-hint">{hint}</span> : null}
        {trendDir ? (
          <span className={`trend-badge ${trendDir}`}>
            {trendDir === "up" ? <ArrowUp /> : trendDir === "down" ? <ArrowDown /> : <Minus />}
            {trendPct ? `${trendPct}%` : trendLabel || trendDir}
          </span>
        ) : null}
      </div>
    </article>
  );
}
