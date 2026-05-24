import { useEffect, useState } from "react";

const STORAGE_KEY = "nova_theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
      style={{ marginTop: "auto" }}
    >
      {theme === "dark" ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
