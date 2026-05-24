import { useEffect, useState } from "react";

import { api } from "../api/client";
import BubbleCard from "../components/BubbleCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ToastNotification from "../components/ToastNotification";

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get("/reports/monthly")
      .then((data) => {
        setReport(data);
        setNotify(null);
      })
      .catch((e) => setNotify({ message: e.message, tone: "error" }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton count={5} />;

  if (!report) {
    return (
      <div>
        <h2>Pro Reports</h2>
        <p className="error">Unable to load reports.</p>
        <ToastNotification
          message={notify?.message || ""}
          tone={notify?.tone || "success"}
          onClose={() => setNotify(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <h2>Pro Reports</h2>
      <h3>Monthly Performance</h3>
      {!report.monthly.length ? (
        <p className="empty-state">No report data yet. Add income and expenses to see trends.</p>
      ) : (
        <div className="bubble-grid">
          {report.monthly.map((m) => (
            <BubbleCard
              key={m.month}
              title={m.month}
              subtitle={`Income ${m.income_cents} / Expense ${m.expense_cents}`}
              amountCents={m.profit_cents}
              copyText={`${m.month} profit ${m.profit_cents}`}
            />
          ))}
        </div>
      )}
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
