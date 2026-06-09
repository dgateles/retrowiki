"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reactAction } from "@/lib/actions/engagement-actions";

type ReactionOpt = { id: number; name: string; emoji: string; weight: number };

export function ReactionPicker({
  articleId,
  reactions,
  initialCounts,
  initialReaction,
  display = "individual",
}: {
  articleId: number;
  reactions: ReactionOpt[];
  initialCounts: Record<number, number>;
  initialReaction: number | null;
  display?: "individual" | "total";
}) {
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts);
  const [mine, setMine] = useState<number | null>(initialReaction);
  const [pending, start] = useTransition();

  function react(id: number) {
    const prevCounts = counts;
    const prevMine = mine;
    // otimista
    const next = { ...counts };
    let nextMine: number | null;
    if (mine === id) {
      next[id] = Math.max(0, (next[id] ?? 0) - 1);
      nextMine = null;
    } else if (mine !== null) {
      next[mine] = Math.max(0, (next[mine] ?? 0) - 1);
      next[id] = (next[id] ?? 0) + 1;
      nextMine = id;
    } else {
      next[id] = (next[id] ?? 0) + 1;
      nextMine = id;
    }
    setCounts(next);
    setMine(nextMine);
    start(async () => {
      const res = await reactAction(articleId, id);
      if (!res.ok) {
        setCounts(prevCounts);
        setMine(prevMine);
        toast.error(res.error ?? "Não foi possível reagir.");
      }
    });
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="reactions">
      <ul className="reactions__list">
        {reactions.map((r) => {
          const c = counts[r.id] ?? 0;
          const active = mine === r.id;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => react(r.id)}
                disabled={pending}
                aria-pressed={active}
                title={r.name}
                className={cn("reaction", active && "reaction--on")}
              >
                <span className="reaction__emoji" aria-hidden="true">{r.emoji}</span>
                <span className="sr-only">{r.name}</span>
                {display === "individual" && c > 0 && <span className="reaction__count tabular-nums">{c}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {display === "total" && <span className="reactions__total tabular-nums">{total}</span>}
    </div>
  );
}
