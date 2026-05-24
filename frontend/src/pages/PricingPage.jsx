import { useState } from "react";

import { api } from "../api/client";
import ToastNotification from "../components/ToastNotification";
import { useAuth } from "../context/AuthContext";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    features: ["1 business", "Basic dashboard", "Up to 30 records", "Community support"],
    cta: "Current plan",
  },
  {
    key: "starter",
    name: "Starter",
    price: "$10",
    period: "/month",
    features: ["Unlimited tracking", "Invoice + subscription workflows", "Multi-tenant operations", "Email support"],
    cta: "Upgrade to Starter",
  },
  {
    key: "pro",
    name: "Pro",
    price: "$20",
    period: "/month",
    features: ["Everything in Starter", "Reports and export", "Priority support", "Advanced insights"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [notify, setNotify] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState("");

  const upgrade = async (plan) => {
    setNotify(null);
    setLoadingPlan(plan);
    try {
      const data = await api.post("/billing/checkout/lemonsqueezy", { plan });
      window.location.href = data.checkout_url;
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
      setLoadingPlan("");
    }
  };

  return (
    <div className="pricing-page">
      <header className="pricing-header">
        <h2>Simple pricing for growing businesses</h2>
        <p>Start free. Upgrade only when your finance workflow needs more power.</p>
      </header>

      <section className="pricing-grid">
        {plans.map((plan) => {
          const current = user?.plan === plan.key;
          return (
            <article key={plan.key} className={`pricing-card ${plan.highlight ? "highlight" : ""}`}>
              <h3>{plan.name}</h3>
              <p className="price-line">
                <span>{plan.price}</span>
                <small>{plan.period}</small>
              </p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>

              {plan.key === "free" || current ? (
                <button type="button" disabled>
                  {current ? "Current plan" : plan.cta}
                </button>
              ) : (
                <button type="button" onClick={() => upgrade(plan.key)} disabled={loadingPlan === plan.key}>
                  {loadingPlan === plan.key ? "Redirecting..." : plan.cta}
                </button>
              )}
            </article>
          );
        })}
      </section>

      <section className="feature-compare">
        <h3>Feature comparison</h3>
        <div className="compare-grid">
          <div>Feature</div>
          <div>Free</div>
          <div>Starter</div>
          <div>Pro</div>

          <div>Monthly tracking records</div>
          <div>30</div>
          <div>Unlimited</div>
          <div>Unlimited</div>

          <div>Financial dashboard</div>
          <div>Basic</div>
          <div>Full</div>
          <div>Full + insights</div>

          <div>Reports and exports</div>
          <div>No</div>
          <div>No</div>
          <div>Yes</div>

          <div>Support</div>
          <div>Community</div>
          <div>Email</div>
          <div>Priority</div>
        </div>
      </section>

      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
