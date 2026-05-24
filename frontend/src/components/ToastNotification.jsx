import { useEffect } from "react";

export default function ToastNotification({ message, tone = "success", onClose }) {
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(onClose, 2200);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  return <div className={`toast ${tone}`}>{message}</div>;
}
