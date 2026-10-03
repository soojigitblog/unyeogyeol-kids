"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function AccordionCard({
  title,
  summary,
  children,
  defaultOpen = false,
}: {
  title: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="p-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-cocoa">{title}</span>
          {summary ? (
            <span className="mt-0.5 block text-[13px] text-cocoa-soft">{summary}</span>
          ) : null}
        </span>
        <span
          aria-hidden
          className={`shrink-0 text-cocoa-soft transition-transform ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? <div className="border-t border-line px-5 py-4">{children}</div> : null}
    </Card>
  );
}
