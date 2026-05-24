export default function LoadingSkeleton({ count = 3 }) {
  return (
    <div className="bubble-grid">
      {Array.from({ length: count }).map((_, idx) => (
        <div className="bubble-card skeleton" key={idx}>
          <div className="skeleton-line w-70" />
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-55" />
        </div>
      ))}
    </div>
  );
}
