"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  setUserRoleAction,
  setUserSuspendedAction,
  setUserTrustedAction,
} from "@/lib/actions/member-actions";

type Props = {
  userId: number;
  role: string;
  trusted: boolean;
  suspended: boolean;
  isSelf: boolean;
};

export function MemberRowActions({ userId, role, trusted, suspended, isSelf }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha.");
      }
    });
  }

  return (
    <div className="member-actions">
      <select
        aria-label="Papel"
        className="rte__select"
        value={role}
        disabled={isSelf || pending}
        onChange={(e) => run(() => setUserRoleAction(userId, e.target.value), "Papel atualizado.")}
      >
        <option value="member">Membro</option>
        <option value="contributor">Colaborador</option>
        <option value="moderator">Moderador</option>
        <option value="admin">Administrador</option>
      </select>

      <label className="editor__check">
        <input
          type="checkbox"
          checked={trusted}
          disabled={pending}
          onChange={(e) => run(() => setUserTrustedAction(userId, e.target.checked), "Atualizado.")}
        />
        Confiável
      </label>

      <Button
        type="button"
        size="sm"
        variant={suspended ? "outline" : "destructive"}
        disabled={isSelf || pending}
        onClick={() => run(() => setUserSuspendedAction(userId, !suspended), suspended ? "Reativado." : "Suspenso.")}
      >
        {suspended ? "Reativar" : "Suspender"}
      </Button>
    </div>
  );
}
