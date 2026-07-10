"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";

export type MentionItem = { id: string; label: string; avatar: string | null };
export type MentionListRef = { onKeyDown: (p: { event: KeyboardEvent }) => boolean };

/** Dropdown de autocomplete de @menção. Recebe items + command da extensão. */
export const MentionList = forwardRef<MentionListRef, { items: MentionItem[]; command: (item: { id: string; label: string }) => void }>(
  function MentionList({ items, command }, ref) {
    const [idx, setIdx] = useState(0);
    useEffect(() => setIdx(0), [items]);

    function select(i: number) {
      const it = items[i];
      if (it) command({ id: it.id, label: it.label });
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (!items.length) return false;
        if (event.key === "ArrowUp") { setIdx((i) => (i + items.length - 1) % items.length); return true; }
        if (event.key === "ArrowDown") { setIdx((i) => (i + 1) % items.length); return true; }
        if (event.key === "Enter" || event.key === "Tab") {
          const it = items[idx];
          if (it) command({ id: it.id, label: it.label });
          return true;
        }
        return false;
      },
    }), [items, idx, command]);

    if (!items.length) return null;
    return (
      <div className="rte-mention-menu" role="listbox" aria-label="Menções">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="option"
            aria-selected={i === idx}
            className={cn("rte-mention-opt", i === idx && "rte-mention-opt--on")}
            onMouseEnter={() => setIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); select(i); }}
          >
            <span className="rte-mention-opt__name">{it.label}</span>
            <span className="rte-mention-opt__handle">@{it.id}</span>
          </button>
        ))}
      </div>
    );
  },
);
