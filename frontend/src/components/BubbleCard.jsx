import { useMemo } from "react";

import CopyButton from "./CopyButton";
import { formatMoneyFromCents } from "../utils/currency";

export default function BubbleCard({
  title,
  subtitle,
  amountCents,
  copyText,
  onEdit,
  onDelete,
  children,
  pending = false,
  currencyCode,
}) {
  const amountLabel = useMemo(() => {
    if (typeof amountCents !== "number") return null;
    return formatMoneyFromCents(amountCents, currencyCode);
  }, [amountCents, currencyCode]);

  return (
    <article className={`bubble-card ${pending ? "pending" : ""}`}>
      <div className="bubble-top">
        <div className="bubble-title-wrap">
          <h4>{title}</h4>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="bubble-actions-right">
          <CopyButton text={copyText} />
        </div>
      </div>

      {amountLabel && <strong>{amountLabel}</strong>}

      {children ? <div className="bubble-content">{children}</div> : null}

      {(onEdit || onDelete) && (
        <div className="bubble-footer-actions">
          {onEdit && (
            <button className="btn-secondary" onClick={onEdit} type="button">
              Edit
            </button>
          )}
          {onDelete && (
            <button className="btn-danger" onClick={onDelete} type="button">
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
