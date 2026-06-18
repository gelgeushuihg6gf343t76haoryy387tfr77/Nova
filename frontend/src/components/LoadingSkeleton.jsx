export default function LoadingSkeleton({ count = 3, variant = "card" }) {
  if (variant === "stat") {
    return (
      <div className="stats-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div className="stat-card skeleton" key={idx} style={{ border: "1px solid var(--border)" }}>
            <div className="skeleton-line w-55" style={{ height: 10, marginBottom: 8 }} />
            <div className="skeleton-line w-70" style={{ height: 32, marginBottom: 4 }} />
            <div className="skeleton-line w-40" style={{ height: 10 }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bubble-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="bubble-card skeleton" key={idx} style={{ border: "1px solid var(--border)" }}>
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-55" />
        </div>
      ))}
    </div>
  );
}
