"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserX, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleIgnoreUserAction } from "@/lib/actions/ignore-actions";

/** Botão de ignorar/deixar de ignorar um usuário. */
export function IgnoreButton({ targetId, initialIgnoring }: { targetId: number; initialIgnoring: boolean }) {
  const router = useRouter();
  const [ignoring, setIgnoring] = useState(initialIgnoring);
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const res = await toggleIgnoreUserAction(targetId);
      if (res.ok) {
        setIgnoring(!!res.data?.ignoring);
        toast.success(res.data?.ignoring ? "Usuário ignorado." : "Você voltou a ver este usuário.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Não foi possível concluir.");
      }
    });
  }

  return (
    <Button variant={ignoring ? "secondary" : "outline"} size="sm" disabled={pending} onClick={toggle}>
      {ignoring ? <><UserCheck className="size-4" aria-hidden="true" /> Ignorando</> : <><UserX className="size-4" aria-hidden="true" /> Ignorar</>}
    </Button>
  );
}
