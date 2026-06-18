import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";

import ThemeToggle from "./components/ThemeToggle";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import BusinessesPage from "./pages/BusinessesPage";
import BusinessSetupPage from "./pages/BusinessSetupPage";
import DashboardPage from "./pages/DashboardPage";
import ExpensePage from "./pages/ExpensePage";
import HistoryPage from "./pages/HistoryPage";
import IncomePage from "./pages/IncomePage";
import InvoicesPage from "./pages/InvoicesPage";
import LandingPage from "./pages/LandingPage";
import ReportsPage from "./pages/ReportsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import TransactionsPage from "./pages/TransactionsPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import VerifyEmailPage from "./pages/auth/VerifyEmailPage";

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20M17 7l-5-5-5 5" />
      <path d="M4 20h16" opacity="0.4" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V2M17 17l-5 5-5-5" />
      <path d="M4 4h16" opacity="0.4" />
    </svg>
  );
}

function InvoicesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

function BusinessesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function SubscriptionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}

function ReportsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4v16h16" />
      <path d="M4 20l4.5-5.5 4 4L20 7" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: <DashboardIcon />, exact: true },
  { path: "/dashboard/transactions", label: "Transactions", icon: <TransactionsIcon /> },
  { path: "/dashboard/income", label: "Income", icon: <IncomeIcon /> },
  { path: "/dashboard/expenses", label: "Expenses", icon: <ExpensesIcon /> },
  { path: "/dashboard/invoices", label: "Invoices", icon: <InvoicesIcon /> },
  { path: "/dashboard/businesses", label: "Businesses", icon: <BusinessesIcon /> },
  { path: "/dashboard/history", label: "History", icon: <HistoryIcon /> },
  { path: "/dashboard/subscriptions", label: "Subscriptions", icon: <SubscriptionsIcon /> },
  { path: "/dashboard/reports", label: "Reports", icon: <ReportsIcon /> },
];

function Shell({ children }) {
  const { user, businesses, selectBusiness, logout } = useAuth();
  const location = useLocation();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className={`app-shell ${user?.plan === "pro" ? "theme-pro" : ""}`}>
      <aside className="sidebar">
        <div className="brand-wordmark">
          <img src="/logo.png" alt="Nova" />
          Nova
        </div>

        {businesses.length > 0 ? (
          <div className="sidebar-select-wrap">
            <select
              value={localStorage.getItem("selected_business_id") || businesses[0]?.id || ""}
              onChange={(e) => {
                selectBusiness(e.target.value);
                window.location.reload();
              }}
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown />
          </div>
        ) : (
          <Link to="/business/setup" className="sidebar-create-business">
            + Create business
          </Link>
        )}

        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item) ? "active" : ""}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle />
          <button onClick={logout} className="sidebar-logout">
            <LogoutIcon />
            Log out
          </button>
          <div className="sidebar-footer-brand">
            &copy; Nova {new Date().getFullYear()}
          </div>
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

function NotFound() {
  return (
    <div className="auth-card" style={{ textAlign: "center" }}>
      <div className="auth-wordmark">Nova</div>
      <h2>Page not found</h2>
      <p className="auth-subtitle">This page doesn't exist or has been removed.</p>
      <Link to="/" className="auth-submit" style={{ textDecoration: "none", marginTop: 16 }}>Go home</Link>
    </div>
  );
}

function AppLoader() {
  return (
    <div className="app-loader">
      <div className="app-loader-spinner" />
      <p>Loading Nova...</p>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <AppLoader />;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Shell>
            </RequireBusiness>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
