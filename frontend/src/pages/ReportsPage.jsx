import { useEffect, useState } from "react";

import { api } from "../api/client";
import BubbleCard from "../components/BubbleCard";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ToastNotification from "../components/ToastNotification";

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notify, setNotify] = useState(null);
  const [exporting, setExporting] = useState(false);

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

  const handleExport = async () => {
    setExporting(true);
    setNotify(null);
    try {
      const data = await api.get("/reports/export");
      downloadCSV(data.csv, `nova-report-${new Date().toISOString().slice(0, 10)}.csv`);
      setNotify({ message: "Report exported.", tone: "success" });
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingSkeleton count={5} />;

  if (!report) {
    return (
      <div>
        <h2>Reports</h2>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Reports</h2>
        {report.monthly.length > 0 && (
          <button onClick={handleExport} disabled={exporting} style={{ padding: "8px 16px" }}>
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        )}
      </div>
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
