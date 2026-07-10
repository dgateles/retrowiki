"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { markSolutionAction } from "@/lib/actions/forum-actions";

/** Botão de marcar/desmarcar uma resposta como a solução (modo pergunta). */
export function BestAnswerButton({ topicId, postId, isSolution }: { topicId: number; postId: number; isSolution: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await markSolutionAction(topicId, postId);
      if (res.ok) {
        toast.success((res.data as { solved?: boolean } | undefined)?.solved ? "Resposta marcada como solução." : "Solução removida.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível marcar a solução.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={isSolution}
      className={cn("fsolution-btn", isSolution && "fsolution-btn--on")}
    >
      <CircleCheck className="size-4" aria-hidden="true" />
      {isSolution ? "Solução" : "Marcar como solução"}
    </button>
  );
}
