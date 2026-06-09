"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAchievementSettingsAction } from "@/lib/actions/settings-actions";
import { recalculateBadgesAction } from "@/lib/actions/badge-actions";

type Settings = { enabled: boolean; rareThreshold: number; rareNever: boolean; excludeRoles: string[] };

const ROLES: { value: string; label: string }[] = [
  { value: "member", label: "Membros" },
  { value: "contributor", label: "Colaboradores" },
  { value: "moderator", label: "Moderadores" },
  { value: "admin", label: "Administradores" },
];

export function AchievementSettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [rareThreshold, setRareThreshold] = useState(initial.rareThreshold);
  const [rareNever, setRareNever] = useState(initial.rareNever);
  const [excludeRoles, setExcludeRoles] = useState<string[]>(initial.excludeRoles);
  const [pending, setPending] = useState(false);
  const [rebuilding, startRebuild] = useTransition();

  function toggleRole(role: string, on: boolean) {
    setExcludeRoles((prev) => (on ? [...new Set([...prev, role])] : prev.filter((r) => r !== role)));
  }

  async function save() {
    setPending(true);
    const body = JSON.stringify({ enabled, rareThreshold, rareNever, excludeRoles });
    const res = await saveAchievementSettingsAction(body);
    setPending(false);
    if (res.ok) {
      toast.success("Configurações salvas.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <label className="rule-form__check">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Gamificação ativada
        </label>
        <p className="muted">Quando desativada, as Regras não concedem pontos nem badges.</p>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Badge rara</h2>
        <div className="field">
          <Label htmlFor="as-rare">Marcar como rara se conquistada por menos de (% dos membros)</Label>
          <Input id="as-rare" type="number" min={0} max={100} value={String(rareThreshold)} disabled={rareNever} onChange={(e) => setRareThreshold(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} className="w-28" />
        </div>
        <label className="rule-form__check">
          <input type="checkbox" checked={rareNever} onChange={(e) => setRareNever(e.target.checked)} /> Nunca marcar como rara
        </label>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Papéis excluídos</h2>
        <p className="muted">Membros nestes papéis não ganham pontos nem badges.</p>
        <div className="rule-form__roles">
          {ROLES.map((r) => (
            <label key={r.value} className="rule-form__check">
              <input type="checkbox" checked={excludeRoles.includes(r.value)} onChange={(e) => toggleRole(r.value, e.target.checked)} /> {r.label}
            </label>
          ))}
        </div>
      </section>

      <div className="rule-form__foot rule-form__foot--split">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={rebuilding}
          onClick={() =>
            startRebuild(async () => {
              const res = await recalculateBadgesAction();
              if (res.ok) {
                toast.success(res.message ?? "Reconstruído.");
                router.refresh();
              } else {
                toast.error(res.error ?? "Falha.");
              }
            })
          }
        >
          <RotateCw className="size-4" aria-hidden="true" /> {rebuilding ? "Reconstruindo…" : "Reconstruir conquistas"}
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
