"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SettingGroup, SettingToggle } from "@/components/admin/setting-toggle";
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
    <div className="flex flex-col gap-5">
      <div className="field">
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

      <SettingGroup>
        <SettingToggle
          label="Confiável"
          description="Publica sem passar pela fila de moderação."
          checked={trusted}
          disabled={pending}
          onCheckedChange={(c) => run(() => setUserTrustedAction(userId, c), "Atualizado.")}
        />
      </SettingGroup>

      <div className="field">
        <Label htmlFor="mm-rep">Reputação (pontos)</Label>
        <div className="flex items-center gap-2">
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

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ações</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full justify-center"
          disabled={pending}
          onClick={() => run(() => forcePasswordResetAction(userId), "E-mail de troca de senha enviado.")}
        >
          Forçar troca de senha
        </Button>
        <Button
          type="button"
          size="sm"
          variant={suspended ? "outline" : "destructive"}
          className="w-full justify-center"
          disabled={isSelf || pending}
          onClick={() => run(() => setUserSuspendedAction(userId, !suspended), suspended ? "Reativado." : "Suspenso.")}
        >
          {suspended ? "Reativar conta" : "Suspender conta"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="w-full justify-center"
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
    </div>
  );
}
