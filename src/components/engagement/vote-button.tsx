"use client";

import { useState, useTransition } from "react";
import { ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { voteAction } from "@/lib/actions/engagement-actions";

export function VoteButton({
  articleId,
  initialCount,
  initialVoted,
}: {
  articleId: number;
  initialCount: number;
  initialVoted: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, startTransition] = useTransition();

  function onClick() {
    // otimista
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await voteAction(articleId);
      if (!res.ok) {
        setVoted(!next);
        setCount((c) => c + (next ? -1 : 1));
        toast.error(res.error ?? "Não foi possível votar.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={voted}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        voted
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/50",
      )}
    >
      <ChevronUp className="size-4" aria-hidden="true" />
      Útil
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
