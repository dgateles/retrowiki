"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { toggleProfileVisitorsAction } from "@/lib/actions/profile-visitors-actions";

/** Interruptor do dono para exibir ou ocultar o bloco de visitantes. */
export function VisitorsToggle({ initialShow }: { initialShow: boolean }) {
  const router = useRouter();
  const [show, setShow] = useState(initialShow);
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    setShow(next);
    start(async () => {
      const res = await toggleProfileVisitorsAction();
      if (res.ok) { toast.success(res.data?.show ? "Visitantes visíveis." : "Visitantes ocultos."); router.refresh(); }
      else { setShow(!next); toast.error(res.error ?? "Falha."); }
    });
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Switch checked={show} onCheckedChange={toggle} disabled={pending} />
      Mostrar visitantes no meu perfil
    </label>
  );
}
