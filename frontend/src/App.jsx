import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import ThemeToggle from "./components/ThemeToggle";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import BillingCancelPage from "./pages/BillingCancelPage";
import BillingPage from "./pages/BillingPage";
import BillingSuccessPage from "./pages/BillingSuccessPage";
import BusinessesPage from "./pages/BusinessesPage";
import BusinessSetupPage from "./pages/BusinessSetupPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensePage from "./pages/ExpensePage";
import HistoryPage from "./pages/HistoryPage";
import IncomePage from "./pages/IncomePage";
import InvoicesPage from "./pages/InvoicesPage";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import ReportsPage from "./pages/ReportsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

function Shell({ children }) {
  const { user, businesses, selectBusiness, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`app-shell ${user?.plan === "pro" ? "theme-pro" : ""}`}>
      <aside className="sidebar">
        <div className="brand-wordmark">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="var(--text)">
            <path d="M8 34V6L22 22V6H30V34L16 18V34H8Z"/>
          </svg>
          Nova
        </div>
        {user && <span className="plan">Free — payment coming soon</span>}
        <select
          defaultValue={localStorage.getItem("selected_business_id") || ""}
          onChange={(e) => {
            selectBusiness(e.target.value);
            window.location.reload();
          }}
        >
          <option value="" disabled>Select business</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <nav>
          <Link to="/dashboard" className={isActive("/dashboard") && location.pathname === "/dashboard" ? "active" : ""}>Dashboard</Link>
          <Link to="/dashboard/transactions" className={isActive("/dashboard/transactions") ? "active" : ""}>Transactions</Link>
          <Link to="/dashboard/income" className={isActive("/dashboard/income") ? "active" : ""}>Income</Link>
          <Link to="/dashboard/expenses" className={isActive("/dashboard/expenses") ? "active" : ""}>Expenses</Link>
          <Link to="/dashboard/invoices" className={isActive("/dashboard/invoices") ? "active" : ""}>Invoices</Link>
          <Link to="/dashboard/businesses" className={isActive("/dashboard/businesses") ? "active" : ""}>Businesses</Link>
          <Link to="/dashboard/history" className={isActive("/dashboard/history") ? "active" : ""}>History</Link>
          <Link to="/dashboard/subscriptions" className={isActive("/dashboard/subscriptions") ? "active" : ""}>Subscriptions</Link>
          <Link to="/dashboard/reports" className={isActive("/dashboard/reports") ? "active" : ""}>Reports</Link>
        </nav>
        <ThemeToggle />
        {user && <button onClick={logout} className="btn-secondary" style={{ fontSize: 13, padding: "8px 12px" }}>Log out</button>}
        <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "center", padding: "12px 0 0", borderTop: "1px solid var(--border)", marginTop: 8 }}>
          &copy; Nova {new Date().getFullYear()}
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function RequireBusiness({ children }) {
  const { businesses } = useAuth();
  if (!businesses.length) return <Navigate to="/business/setup" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/demo" element={<ProtectedRoute><DashboardPage readOnly /></ProtectedRoute>} />
      <Route
        path="/business/setup"
        element={
          <ProtectedRoute>
            <BusinessSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <RequireBusiness>
              <Shell>
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                  <Route path="/businesses" element={<BusinessesPage />} />
                  <Route path="/income" element={<IncomePage />} />
                  <Route path="/expenses" element={<ExpensePage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/invoices" element={<InvoicesPage />} />
                  <Route path="/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/billing/success" element={<BillingSuccessPage />} />
                  <Route path="/billing/cancel" element={<BillingCancelPage />} />
                </Routes>
              </Shell>
            </RequireBusiness>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
