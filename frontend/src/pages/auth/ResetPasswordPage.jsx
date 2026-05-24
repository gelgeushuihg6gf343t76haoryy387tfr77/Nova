import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../../api/client";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();
      setMessage(null);
      setError(null);

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }

      setSubmitting(true);
      try {
        const res = await api.post("/auth/reset-password", { token, password });
        if (res.success) {
          setDone(true);
          setMessage("Password reset successfully!");
        } else {
          setError(res.message || "Reset failed. The link may have expired.");
        }
      } catch (err) {
        setError(err.message || "Something went wrong.");
      } finally {
        setSubmitting(false);
      }
    },
    [token, password, confirm],
  );

  if (!token) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-wordmark">Nova</div>
        <h2>Invalid Link</h2>
        <p className="auth-subtitle">This password reset link is missing or invalid.</p>
        <Link to="/login" className="auth-submit" style={{ textDecoration: "none", marginTop: 16 }}>
          Back to Login
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-wordmark">Nova</div>
        <span className="success-icon">✓</span>
        <h2>{message}</h2>
        <p className="auth-subtitle">You can now log in with your new password.</p>
        <Link to="/login" className="auth-submit" style={{ textDecoration: "none", marginTop: 16 }}>
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-wordmark">Nova</div>
      <h2>Reset Password</h2>
      <p className="auth-subtitle">Enter your new password.</p>

      <form onSubmit={submit} noValidate className="form-grid">
        <label>
          New password
          <div className="pw-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
              minLength={6}
            />
            <button
              type="button"
              className="pw-toggle"
              onClick={() => setShowPassword((p) => !p)}
              tabIndex={-1}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label>
          Confirm password
          <input
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
            autoComplete="new-password"
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
          {submitting ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
