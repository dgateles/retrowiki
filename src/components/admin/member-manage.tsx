"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  setUserRoleAction,
  setUserSuspendedAction,
  setUserTrustedAction,
  setUserReputationAction,
  forcePasswordResetAction,
  flagSpammerAction,
} from "@/lib/actions/member-actions";

type Props = {
  userId: number;
  role: string;
  trusted: boolean;
  suspended: boolean;
  reputation: number;
  isSelf: boolean;
};

export function MemberManage({ userId, role, trusted, suspended, reputation, isSelf }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rep, setRep] = useState(String(reputation));

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
    <div className="member-manage">
      <div className="member-manage__row">
        <Label htmlFor="mm-role">Papel</Label>
        <select
          id="mm-role"
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
      </div>

      <label className="member-manage__check">
        <input
          type="checkbox"
          checked={trusted}
          disabled={pending}
          onChange={(e) => run(() => setUserTrustedAction(userId, e.target.checked), "Atualizado.")}
        />
        Confiável (publica sem fila)
      </label>

      <div className="member-manage__row">
        <Label htmlFor="mm-rep">Reputação (pontos)</Label>
        <div className="member-manage__rep">
          <Input id="mm-rep" type="number" min={0} value={rep} onChange={(e) => setRep(e.target.value)} className="w-28" />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => setUserReputationAction(userId, Number(rep)), "Pontos atualizados.")}
          >
            Salvar pontos
          </Button>
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        variant={suspended ? "outline" : "destructive"}
        disabled={isSelf || pending}
        onClick={() => run(() => setUserSuspendedAction(userId, !suspended), suspended ? "Reativado." : "Suspenso.")}
      >
        {suspended ? "Reativar conta" : "Suspender conta"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => forcePasswordResetAction(userId), "E-mail de troca de senha enviado.")}
      >
        Forçar troca de senha
      </Button>

      <Button
        type="button"
        size="sm"
        variant="destructive"
        disabled={isSelf || pending}
        onClick={() => {
          if (window.confirm("Marcar como spammer? Aplica as ações configuradas (suspender, ocultar conteúdo, banir e-mail).")) {
            run(() => flagSpammerAction(userId), "Membro marcado como spammer.");
          }
        }}
      >
        Marcar como spammer
      </Button>
    </div>
  );
}
