"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setQuestOptOutAction } from "@/lib/actions/quest-actions";

export function QuestOptOut({ questId, optedOut }: { questId: number; optedOut: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await setQuestOptOutAction(questId, !optedOut);
          if (res.ok) {
            toast.success(optedOut ? "Você voltou à missão." : "Você saiu da missão.");
            router.refresh();
          } else {
            toast.error(res.error ?? "Falha.");
          }
        })
      }
    >
      {optedOut ? "Voltar à missão" : "Sair da missão"}
    </Button>
  );
}
