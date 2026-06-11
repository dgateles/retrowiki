"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useConfirm } from "@/components/admin/confirm-dialog";
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
  const confirm = useConfirm();
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
        <Select value={role} disabled={isSelf || pending} onValueChange={(v) => run(() => setUserRoleAction(userId, v), "Papel atualizado.")}>
          <SelectTrigger id="mm-role" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Membro</SelectItem>
            <SelectItem value="contributor">Colaborador</SelectItem>
            <SelectItem value="moderator">Moderador</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={trusted}
          disabled={pending}
          onCheckedChange={(c) => run(() => setUserTrustedAction(userId, c), "Atualizado.")}
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
        onClick={async () => {
          if (await confirm({ title: "Marcar como spammer", description: "Aplica as ações configuradas (suspender, ocultar conteúdo, banir e-mail).", confirmLabel: "Marcar", destructive: true })) {
            run(() => flagSpammerAction(userId), "Membro marcado como spammer.");
          }
        }}
      >
        Marcar como spammer
      </Button>
    </div>
  );
}
