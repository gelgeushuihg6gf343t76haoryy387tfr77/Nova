import { useState } from "react";

export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button className="copy-btn" onClick={copy} type="button" title={copied ? "Copied!" : "Copy"}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
