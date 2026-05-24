import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import ToastNotification from "../../components/ToastNotification";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);

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
      await register({
        ...form,
        email: form.email.trim().toLowerCase(),
      });
      navigate("/business/setup");
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-wordmark">Nova</div>
      <h2>Create account</h2>
      <p className="auth-subtitle">Start tracking your business finances</p>
      <form onSubmit={submit} className="form-grid">
        <label>
          Name
          <input
            value={form.full_name}
            onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
            placeholder="Your name"
            disabled={submitting}
          />
        </label>
        <label>
          Username
          <input
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Choose a username (optional, used for login)"
            disabled={submitting}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
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
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="At least 6 characters"
              required
              disabled={submitting}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((p) => !p)} tabIndex={-1}>
              {showPw ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 4 }}>
        Already have one? <Link to="/login">Sign in</Link>
      </p>
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
