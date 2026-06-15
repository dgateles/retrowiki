"use client";

import { useState, useTransition } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { reactCommentAction } from "@/lib/actions/engagement-actions";

/** Barra compacta de curtir/deslike por comentário, com atualização otimista. */
export function CommentReactions({
  commentId,
  up,
  down,
  mine,
  canReact = true,
}: {
  commentId: number;
  up: number;
  down: number;
  mine: number; // +1, -1 ou 0
  canReact?: boolean;
}) {
  const [state, setState] = useState({ up, down, mine });
  const [pending, start] = useTransition();

  function react(value: 1 | -1) {
    if (!canReact) {
      toast.error("Faça login para reagir.");
      return;
    }
    const prev = state;
    let nextUp = state.up;
    let nextDown = state.down;
    // remove a reação anterior do usuário
    if (state.mine === 1) nextUp--;
    else if (state.mine === -1) nextDown--;
    // aplica a nova (ou desfaz se for a mesma)
    let nextMine: number;
    if (state.mine === value) {
      nextMine = 0;
    } else {
      nextMine = value;
      if (value === 1) nextUp++;
      else nextDown++;
    }
    setState({ up: nextUp, down: nextDown, mine: nextMine });
    start(async () => {
      const res = await reactCommentAction(commentId, value);
      if (!res.ok) {
        setState(prev);
        toast.error(res.error ?? "Falha ao reagir.");
      }
    });
  }

  return (
    <div className="cmt-react">
      <button
        type="button"
        className={cn("cmt-react__btn", state.mine === 1 && "cmt-react__btn--on")}
        aria-pressed={state.mine === 1}
        aria-label="Curtir comentário"
        disabled={pending}
        onClick={() => react(1)}
      >
        <ThumbsUp className="size-3.5" aria-hidden="true" />
        {state.up > 0 && <span className="cmt-react__n">{state.up}</span>}
      </button>
      <button
        type="button"
        className={cn("cmt-react__btn", state.mine === -1 && "cmt-react__btn--on cmt-react__btn--down")}
        aria-pressed={state.mine === -1}
        aria-label="Não curtir comentário"
        disabled={pending}
        onClick={() => react(-1)}
      >
        <ThumbsDown className="size-3.5" aria-hidden="true" />
        {state.down > 0 && <span className="cmt-react__n">{state.down}</span>}
      </button>
    </div>
  );
}
