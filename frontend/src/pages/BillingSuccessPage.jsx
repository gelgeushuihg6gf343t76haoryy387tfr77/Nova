import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";

export default function BillingSuccessPage() {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState("Syncing your plan...");

  useEffect(() => {
    refreshUser()
      .then((user) => setStatus(`Plan updated: ${user.plan}`))
      .catch(() => setStatus("Payment succeeded. Plan sync pending webhook confirmation."));
  }, [refreshUser]);

  return <div><h2>Checkout successful</h2><p>{status}</p></div>;
}
