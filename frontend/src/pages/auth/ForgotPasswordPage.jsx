import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/client";
import ToastNotification from "../../components/ToastNotification";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notify, setNotify] = useState(null);
  const [mode, setMode] = useState("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotify(null);
    try {
      const res = await api.post("/auth/send-reset-code", { email: email.trim().toLowerCase() });
      setMode("code");
      setNotify({ message: res.message || "If this email exists, a reset code was sent.", tone: "success" });
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setNotify(null);
    try {
      const res = await api.post("/auth/reset-with-code", {
        code: code.trim(),
        email: email.trim().toLowerCase(),
        password: newPassword,
      });
      if (res.success) {
        setResetDone(true);
        setNotify({ message: "Password has been reset. You can now log in.", tone: "success" });
      } else {
        setNotify({ message: res.message || "Invalid or expired reset code.", tone: "error" });
      }
    } catch (err) {
      setNotify({ message: err.message, tone: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (resetDone) {
    return (
      <div className="auth-card">
        <div className="auth-wordmark">Nova</div>
        <h2>Password reset</h2>
        <p className="auth-subtitle">
          Your password has been reset. You can now log in with your new password.
        </p>
        <Link to="/login" className="auth-submit" style={{ textDecoration: "none" }}>
          Sign in
        </Link>
      </div>
    );
  }

  if (mode === "code") {
    return (
      <div className="auth-card">
        <div className="auth-wordmark">Nova</div>
        <h2>Enter reset code</h2>
        <p className="auth-subtitle">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below, then set a new password.
        </p>
        <form onSubmit={submitCode} className="form-grid">
          <label>
            Verification code
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              maxLength={6}
              required
              disabled={submitting}
            />
          </label>
          <label>
            New password
            <div className="pw-wrap">
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                required
                disabled={submitting}
              />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)} tabIndex={-1}>
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
          </label>
          <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
            {submitting ? "Resetting…" : "Reset password"}
          </button>
        </form>
        <p>
          Back to <Link to="/login">Sign in</Link>
        </p>
        <ToastNotification
          message={notify?.message || ""}
          tone={notify?.tone || "success"}
          onClose={() => setNotify(null)}
        />
      </div>
    );
  }

  return (
    <div className="auth-card">
      <div className="auth-wordmark">Nova</div>
      <h2>Forgot password</h2>
      <p className="auth-subtitle">Enter your email and we'll send a reset code.</p>
      <form onSubmit={sendCode} className="form-grid">
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
        <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 4 }}>
          {submitting ? "Sending…" : "Send reset code"}
        </button>
      </form>
      <p>
        Back to <Link to="/login">Sign in</Link>
      </p>
      <ToastNotification
        message={notify?.message || ""}
        tone={notify?.tone || "success"}
        onClose={() => setNotify(null)}
      />
    </div>
  );
}
