import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ToastNotification from "../../components/ToastNotification";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setNotify(null);
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      const message = err.message === "Invalid credentials"
        ? "Wrong password, please try again."
        : err.message;
      setNotify({ message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-wordmark">Nova</div>
      <h2>Welcome back</h2>
      <p className="auth-subtitle">Sign in to your business account</p>
      <form onSubmit={submit} className="form-grid">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            required
            disabled={submitting}
          />
        </label>
        <label>
          Password
          <span className="pw-wrap">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={submitting}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((p) => !p)} tabIndex={-1}>
              {showPw ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p>
        <Link to="/forgot-password">Forgot password?</Link>
      </p>
      <p style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
        New here? <Link to="/register">Create account</Link>
      </p>
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
