import { useState } from "react";

import { api } from "../api/client";
import ToastNotification from "../components/ToastNotification";

export default function BillingPage() {
  const [loadingId, setLoadingId] = useState("");
  const [notify, setNotify] = useState(null);

  const upgrade = async (plan) => {
    setLoadingId(plan);
    setNotify(null);
    try {
      const data = await api.post("/billing/checkout/lemonsqueezy", { plan });
      window.location.href = data.checkout_url;
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoadingId("");
    }
  };

  return (
    <div>
      <h2>Upgrade Plan</h2>
      <p className="page-subtitle">Secure checkout via Lemon Squeezy. You’ll return here when payment completes.</p>
      <div className="bubble-grid">
        <article className="bubble-card">
          <h4>Starter</h4>
          <p>$10/month</p>
          <button type="button" disabled={!!loadingId} onClick={() => upgrade("starter")}>
            {loadingId === "starter" ? "Redirecting…" : "Upgrade to Starter"}
          </button>
        </article>
        <article className="bubble-card">
          <h4>Pro</h4>
          <p>$20/month</p>
          <button type="button" disabled={!!loadingId} onClick={() => upgrade("pro")}>
            {loadingId === "pro" ? "Redirecting…" : "Upgrade to Pro"}
          </button>
        </article>
      </div>
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
