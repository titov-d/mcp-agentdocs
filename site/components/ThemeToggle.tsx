"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("agentdocs-theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-soft px-2.5 py-1 font-mono text-[11.5px] text-fg-soft transition hover:border-accent hover:text-fg"
    >
      <span
        aria-hidden
        className={
          dark
            ? "inline-block h-2.5 w-2.5 rounded-full bg-accent"
            : "inline-block h-2.5 w-2.5 rounded-full border-[1.5px] border-fg-mute"
        }
      />
      {dark === null ? "theme" : dark ? "dark" : "light"}
    </button>
  );
}
