"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { reactAction } from "@/lib/actions/engagement-actions";

type ReactionOpt = { id: number; name: string; emoji: string; weight: number };

/** Barra de reações estilo IPB: resumo de quem reagiu + um botão que revela as
 * opções no hover/clique. */
export function ReactionBar({
  articleId,
  reactions,
  initialCounts,
  initialReaction,
  reactorNames,
  initialTotal,
}: {
  articleId: number;
  reactions: ReactionOpt[];
  initialCounts: Record<number, number>;
  initialReaction: number | null;
  reactorNames: string[];
  initialTotal: number;
}) {
  const [counts, setCounts] = useState<Record<number, number>>(initialCounts);
  const [mine, setMine] = useState<number | null>(initialReaction);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const triggerRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc (o mouseleave fechava cedo demais ao
  // cruzar o vão entre o botão e as opções).
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function react(id: number) {
    const prevCounts = counts;
    const prevMine = mine;
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
    setOpen(false);
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
  const myReaction = mine != null ? reactions.find((r) => r.id === mine) : null;

  // Emojis distintos com contagem > 0 (para os selos), ordenados por contagem.
  const usedBadges = reactions
    .filter((r) => (counts[r.id] ?? 0) > 0)
    .sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0))
    .slice(0, 3);

  // Texto "Fulano, Sicrano e mais N".
  const shown = reactorNames.slice(0, 3);
  const extra = Math.max(0, total - shown.length);
  const summary =
    total === 0
      ? "Seja o primeiro a reagir"
      : shown.length === 0
        ? `${total} ${total === 1 ? "reação" : "reações"}`
        : extra > 0
          ? `${shown.join(", ")} e mais ${extra}`
          : shown.join(", ");

  return (
    <div className="react-bar">
      <div className="react-bar__summary">
        {usedBadges.length > 0 && (
          <span className="react-bar__badges" aria-hidden="true">
            {usedBadges.map((r) => (
              <span key={r.id} className="react-bar__badge">{r.emoji}</span>
            ))}
          </span>
        )}
        <span className="react-bar__names">{summary}</span>
        {total > 0 && <span className="react-bar__count tabular-nums">{total}</span>}
      </div>

      <div className="react-trigger" ref={triggerRef}>
        <div className={cn("react-trigger__menu", open && "react-trigger__menu--open")} role="menu">
          {reactions.map((r) => (
            <button
              key={r.id}
              type="button"
              role="menuitemradio"
              aria-checked={mine === r.id}
              onClick={() => react(r.id)}
              disabled={pending}
              title={r.name}
              className={cn("react-trigger__opt", mine === r.id && "react-trigger__opt--on")}
            >
              <span aria-hidden="true">{r.emoji}</span>
              <span className="sr-only">{r.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={cn("react-trigger__btn", mine != null && "react-trigger__btn--on")}
          onClick={() => setOpen(true)}
          onMouseEnter={() => setOpen(true)}
          disabled={pending}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={mine != null ? `Você reagiu: ${myReaction?.name}. Trocar ou remover` : "Reagir"}
        >
          {myReaction ? <span aria-hidden="true">{myReaction.emoji}</span> : <Heart className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
