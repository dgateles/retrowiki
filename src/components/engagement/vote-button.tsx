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
      aria-pressed={voted ? "true" : "false"}
      className={cn("vote", voted ? "vote--on" : "vote--off")}
    >
      <ChevronUp className="size-4" aria-hidden="true" />
      Útil
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
