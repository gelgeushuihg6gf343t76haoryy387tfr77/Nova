import { useEffect, useMemo, useState } from "react";

import { api } from "../api/client";
import BubbleCard from "../components/BubbleCard";
import KpiCard from "../components/KpiCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import StatCard from "../components/StatCard";
import ToastNotification from "../components/ToastNotification";
import { useAuth } from "../context/AuthContext";
import { extractCurrencyCode, formatMoneyFromCents } from "../utils/currency";

const LS_ONBOARD_COMPLETE = "nova_onboarding_complete";
const LS_ONBOARD_STEP = "nova_onboarding_step";
const LS_ONBOARD_CSV = "nova_onboarding_csv_uploaded";
const LS_ONBOARD_DASH = "nova_onboarding_dashboard_seen";

function SparklineUp() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="var(--success)" strokeWidth="1.5">
      <path d="M0 22L10 14L20 18L30 6L40 12L50 2L60 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparklineDown() {
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" stroke="var(--danger)" strokeWidth="1.5">
      <path d="M0 2L10 10L20 6L30 18L40 12L50 22L60 20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DashboardPage({ readOnly = false }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const result = await api.get("/dashboard/summary");
      setData(result);
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (readOnly) return;
    localStorage.setItem(LS_ONBOARD_DASH, "1");
    const nextStep = Math.max(Number(localStorage.getItem(LS_ONBOARD_STEP) || "0"), 4);
    localStorage.setItem(LS_ONBOARD_STEP, String(nextStep));
    localStorage.setItem(LS_ONBOARD_COMPLETE, "1");
  }, [readOnly]);

  const checklist = useMemo(() => {
    if (!data) return [];
    const hasIncome = data.recent_income.length > 0;
    const hasExpense = data.recent_expenses.length > 0;
    const hasCsvImport = localStorage.getItem(LS_ONBOARD_CSV) === "1";
    const hasDashView = localStorage.getItem(LS_ONBOARD_DASH) === "1";
    return [
      { label: "Add your first income", done: hasIncome },
      { label: "Record your first expense", done: hasExpense },
      { label: "Import transactions via CSV", done: hasCsvImport },
      { label: "Explore the dashboard", done: hasDashView },
    ];
  }, [data]);

  const totalSteps = checklist.length;
  const progress = useMemo(() => Math.round((checklist.filter((c) => c.done).length / totalSteps) * 100), [checklist]);

  const trendFor = (key) => {
    if (!data?.trends?.[key]) return null;
    const t = data.trends[key];
    return { direction: t.direction, percentage: t.percentage, label: t.label };
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <LoadingSkeleton count={3} variant="stat" />
        <div style={{ height: 24 }} />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-page">
        <div className="empty-state-friendly">
          <div className="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5">
              <path d="M12 2v20M17 7l-5-5-5 5" />
              <path d="M4 20h16" opacity="0.3" />
            </svg>
          </div>
          <h3>Welcome to Nova</h3>
          <p>Your dashboard will light up once you add your first income or expense.</p>
          <div className="empty-state-cta">
            <a href="/dashboard/income" className="auth-submit" style={{ width: "auto", padding: "10px 20px", display: "inline-block" }}>Add income</a>
            <a href="/dashboard/expenses" className="btn-secondary" style={{ padding: "10px 20px", fontSize: 15, textDecoration: "none", display: "inline-block" }}>Add expense</a>
          </div>
        </div>
        <ToastNotification message={notify?.message || ""} tone={notify?.tone || "success"} onClose={() => setNotify(null)} />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {readOnly && <p className="dashboard-readonly">Read-only demo mode is active.</p>}

      <header className="dashboard-hero">
        <div className="dashboard-title-row">
          <h2>Overview</h2>
          <span className="plan-pill">Free</span>
        </div>
        <p className="dashboard-hero-sub">Rolling 30-day performance</p>
      </header>

      <section className="stats-grid">
        <StatCard
          label="Income"
          amountCents={data.summary.month_income_cents}
          tone="income"
          trend={trendFor("income")}
          hint="Last 30 days"
        />
        <StatCard
          label="Expenses"
          amountCents={data.summary.month_expense_cents}
          tone="expense"
          trend={trendFor("expense")}
          hint="Last 30 days"
        />
        <StatCard
          label="Profit"
          amountCents={data.summary.month_profit_cents}
          tone="profit"
          trend={trendFor("profit")}
          hint="Income minus expenses"
        />
      </section>

      <section className="dashboard-columns">
        <article className="dashboard-month-overview">
          <h3>This month</h3>
          <div className="month-overview-grid">
            <div>
              <p>Total income</p>
              <strong>{formatMoneyFromCents(data.summary.month_income_cents)}</strong>
              {trendFor("income") && (
                <span className={`trend-badge ${trendFor("income").direction}`}>
                  {trendFor("income").direction === "up" ? "↑" : "↓"} {trendFor("income").percentage}%
                </span>
              )}
            </div>
            <div>
              <p>Total expenses</p>
              <strong>{formatMoneyFromCents(data.summary.month_expense_cents)}</strong>
              {trendFor("expense") && (
                <span className={`trend-badge ${trendFor("expense").direction === "up" ? "down" : "up"}`}>
                  {trendFor("expense").direction === "up" ? "↓" : "↑"} {trendFor("expense").percentage}%
                </span>
              )}
            </div>
            <div>
              <p>Profit</p>
              <strong>{formatMoneyFromCents(data.summary.month_profit_cents)}</strong>
              {trendFor("profit") && (
                <span className={`trend-badge ${trendFor("profit").direction}`}>
                  {trendFor("profit").direction === "up" ? "↑" : "↓"} {trendFor("profit").percentage}%
                </span>
              )}
            </div>
          </div>
        </article>
        <article className="dashboard-insights">
          <h3>Top expense categories</h3>
          {!data.top_expense_categories.length ? (
            <p className="empty-state" style={{ marginTop: 8 }}>Add categories to your expenses to see top spending here.</p>
          ) : (
            <div className="bubble-grid" style={{ marginBottom: 0, marginTop: 8 }}>
              {data.top_expense_categories.map((item) => (
                <BubbleCard
                  key={item.category}
                  title={item.category}
                  subtitle="30-day total"
                  amountCents={item.total_cents}
                  copyText={`${item.category}: ${item.total_cents}`}
                />
              ))}
            </div>
          )}
        </article>
      </section>

      {data.insights ? (
        <section className="dashboard-insights">
          <h3>Quick insights</h3>
          <ul className="insights-list">
            {data.insights.prev_week_expense_cents === 0 && data.insights.week_expense_cents === 0 ? (
              <li>Log expenses to see week-over-week spending trends.</li>
            ) : data.insights.week_expense_cents > data.insights.prev_week_expense_cents ? (
              <li>
                You spent more in the last 7 days than in the previous 7 days (
                <strong className="accent-gold">{formatMoneyFromCents(data.insights.week_expense_cents)}</strong>{" "}
                vs{" "}
                <strong>{formatMoneyFromCents(data.insights.prev_week_expense_cents)}</strong>).
                {data.insights.week_expense_cents > data.insights.prev_week_expense_cents ? (
                  <span className="trend-badge down" style={{ marginLeft: 8, marginTop: 0 }}>↑ spending</span>
                ) : null}
              </li>
            ) : (
              <li>
                Last 7 days spending is down vs the prior 7 days — keep it up or review categories for detail.
                <span className="trend-badge up" style={{ marginLeft: 8, marginTop: 0 }}>↓ spending</span>
              </li>
            )}
            {data.insights.top_expense_category_name ? (
              <li>
                Top expense category (30 days):{" "}
                <strong className="accent-gold">{data.insights.top_expense_category_name}</strong> at{" "}
                {formatMoneyFromCents(data.insights.top_expense_category_cents)}.
              </li>
            ) : (
              <li>Add categorized expenses to surface a top category here.</li>
            )}
          </ul>
        </section>
      ) : null}

      <section className="dashboard-secondary-stats">
        <KpiCard
          label="Unpaid invoices"
          amountCents={data.summary.unpaid_invoice_cents}
          trend={data.summary.unpaid_invoice_count > 0 ? { direction: "flat", label: `${data.summary.unpaid_invoice_count} open` } : null}
        />
        <KpiCard
          label="Subscriptions"
          amountCents={data.summary.upcoming_subscription_cents}
          trend={data.summary.upcoming_subscription_cents > 0 ? { direction: "flat", label: "Expected billing" } : null}
        />
      </section>

      <section className="dashboard-section">
        <h3>Recent activity</h3>
        {!data.recent_activity?.length ? (
          <p className="empty-state" style={{ marginTop: 8 }}>No income or expense activity in the last 30 days.</p>
        ) : (
          <div className="bubble-grid">
            {data.recent_activity.map((item) => (
              <BubbleCard
                key={`${item.type}-${item.id}`}
                title={item.title}
                subtitle={`${item.type} · ${item.occurred_on}`}
                amountCents={item.amount_cents}
                copyText={`${item.title} ${item.amount_cents} on ${item.occurred_on}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-columns">
        <div>
          <h3>Recent income</h3>
          {!data.recent_income.length ? (
            <p className="empty-state" style={{ marginTop: 8 }}>No income recorded yet — head to Income to add some.</p>
          ) : (
            <div className="bubble-grid">
              {data.recent_income.map((item) => (
                <BubbleCard
                  key={item.id}
                  title={item.source || "Income"}
                  subtitle={item.occurred_on}
                  amountCents={item.amount_cents}
                  currencyCode={extractCurrencyCode(item.source)}
                  copyText={`Income ${item.amount_cents} on ${item.occurred_on}`}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Recent expenses</h3>
          {!data.recent_expenses.length ? (
            <p className="empty-state" style={{ marginTop: 8 }}>No expenses yet — add them on the Expenses page.</p>
          ) : (
            <div className="bubble-grid">
              {data.recent_expenses.map((item) => (
                <BubbleCard
                  key={item.id}
                  title={item.vendor || "Expense"}
                  subtitle={item.occurred_on}
                  amountCents={item.amount_cents}
                  currencyCode={extractCurrencyCode(item.vendor)}
                  copyText={`Expense ${item.amount_cents} on ${item.occurred_on}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bottom-grid">
        <div>
          <h3>Subscriptions</h3>
          {!data.recent_subscriptions.length ? (
            <p className="empty-state" style={{ marginTop: 8 }}>Track recurring bills — add a subscription to see upcoming charges.</p>
          ) : (
            <div className="bubble-grid">
              {data.recent_subscriptions.map((item) => (
                <BubbleCard
                  key={item.id}
                  title={item.vendor}
                  subtitle={`Next billing: ${item.next_billing_date}`}
                  amountCents={item.amount_cents}
                  copyText={`${item.vendor} ${item.amount_cents} next ${item.next_billing_date}`}
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Invoices</h3>
          {!data.recent_invoices.length ? (
            <p className="empty-state" style={{ marginTop: 8 }}>Create invoices to track what clients owe you.</p>
          ) : (
            <div className="bubble-grid">
              {data.recent_invoices.map((item) => (
                <BubbleCard
                  key={item.id}
                  title={`${item.invoice_number} — ${item.client_name}`}
                  subtitle={`Status: ${item.status}`}
                  amountCents={item.amount_cents}
                  copyText={`Invoice ${item.invoice_number} ${item.amount_cents} ${item.status}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="growth-hooks" style={{ gridTemplateColumns: "minmax(300px, 500px)" }}>
        <article className="bubble-card hook-card">
          <h4>Getting started</h4>
          <p>Progress: {progress}% ({checklist.filter((c) => c.done).length}/{totalSteps})</p>
          <ul className="checklist">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? "done" : ""}>
                {item.label}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <div className="dashboard-footer-actions">
        <button type="button" className="btn-secondary" onClick={() => { load(); setNotify({ message: "Dashboard refreshed", tone: "success" }); }}>
          Refresh
        </button>
      </div>

      <ToastNotification message={notify?.message || ""} tone={notify?.tone || "success"} onClose={() => setNotify(null)} />
    </div>
  );
}
