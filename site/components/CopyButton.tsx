"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
  variant = "ghost",
}: {
  text: string;
  label?: string;
  variant?: "solid" | "ghost";
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => {},
    );
  }

  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer transition";
  const styles =
    variant === "solid"
      ? "bg-accent text-accent-fg px-4 py-2.5 min-w-[78px] hover:brightness-110"
      : "border border-border text-fg-soft px-3 py-1.5 min-w-[74px] hover:border-accent hover:text-accent";

  return (
    <button onClick={copy} aria-label={`Copy ${label}`} className={`${base} ${styles}`}>
      {copied ? "Copied ✓" : label}
    </button>
  );
}
