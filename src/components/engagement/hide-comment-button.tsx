"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import { hideCommentAction } from "@/lib/actions/engagement-actions";

export function HideCommentButton({ commentId }: { commentId: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!window.confirm("Ocultar este comentário?")) return;
    startTransition(async () => {
      const res = await hideCommentAction(commentId);
      if (res.ok) {
        toast.success("Comentário ocultado.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha ao ocultar.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive focus-visible:outline-2"
      aria-label="Ocultar comentário"
    >
      <EyeOff className="size-3.5" aria-hidden="true" /> Ocultar
    </button>
  );
}
