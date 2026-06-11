"use client";

import { useState } from "react";

export interface QA {
  q: string;
  a: string;
}

export function Faq({ items }: { items: QA[] }) {
  const [open, setOpen] = useState(0);

  return (
    <div className="border-t border-border">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className="border-b border-border">
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-5 bg-transparent px-1 py-5 text-left font-serif text-fg"
            >
              <span className="text-[clamp(17px,2.1vw,20px)] font-medium leading-snug">{item.q}</span>
              <span className="inline-flex h-6 w-6 flex-none items-center justify-center rounded-md border border-border font-mono text-lg text-accent">
                {isOpen ? "–" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="max-w-[64ch] px-1 pb-6 pr-12 text-[16.5px] leading-relaxed text-fg-soft">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
