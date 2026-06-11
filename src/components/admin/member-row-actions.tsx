"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
      <Select
        value={role}
        disabled={isSelf || pending}
        onValueChange={(v) => run(() => setUserRoleAction(userId, v), "Papel atualizado.")}
      >
        <SelectTrigger aria-label="Papel" className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="member">Membro</SelectItem>
          <SelectItem value="contributor">Colaborador</SelectItem>
          <SelectItem value="moderator">Moderador</SelectItem>
          <SelectItem value="admin">Administrador</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Switch
          id={`trust-${userId}`}
          checked={trusted}
          disabled={pending}
          onCheckedChange={(c) => run(() => setUserTrustedAction(userId, c), "Atualizado.")}
        />
        <Label htmlFor={`trust-${userId}`} className="text-sm font-normal">Confiável</Label>
      </div>

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
