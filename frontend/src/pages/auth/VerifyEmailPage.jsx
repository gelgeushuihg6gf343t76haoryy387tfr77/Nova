import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { api } from "../../api/client";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.success) {
          setStatus("success");
          setMessage("Email verified! You can now sign in.");
        } else {
          setStatus("error");
          setMessage(res.message || "Invalid or expired verification link.");
        }
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Something went wrong.");
      });
  }, [searchParams]);

  return (
    <div className="auth-card">
      <div className="auth-wordmark">Nova</div>
      {status === "verifying" && (
        <>
          <h2>Verifying…</h2>
          <p className="auth-subtitle">Please wait while we verify your email.</p>
        </>
      )}
      {status === "success" && (
        <>
          <h2>Email verified</h2>
          <p className="auth-subtitle">{message}</p>
          <Link to="/login" className="auth-submit" style={{ textDecoration: "none" }}>
            Sign in
          </Link>
        </>
      )}
      {status === "error" && (
        <>
          <h2>Verification failed</h2>
          <p className="auth-subtitle">{message}</p>
          <Link to="/login" className="auth-submit" style={{ textDecoration: "none" }}>
            Go to sign in
          </Link>
        </>
      )}
    </div>
  );
}
