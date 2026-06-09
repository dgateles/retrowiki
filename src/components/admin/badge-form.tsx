"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBadgeAction, updateBadgeAction } from "@/lib/actions/badge-actions";
import { BadgeIcon, BADGE_ICON_NAMES } from "@/components/admin/badge-icon";

type Tier = "bronze" | "silver" | "gold";

export function BadgeForm({
  mode,
  badgeId,
  initial,
}: {
  mode: "create" | "edit";
  badgeId?: number;
  initial: { name: string; description: string; icon: string; tier: Tier; manuallyAwardable: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState(initial.icon);
  const [tier, setTier] = useState<Tier>(initial.tier);
  const [manual, setManual] = useState(initial.manuallyAwardable);
  const [pending, setPending] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Dê um nome à badge.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ name, description, icon, tier, manuallyAwardable: manual });
    const res = mode === "create" ? await createBadgeAction(body) : await updateBadgeAction(badgeId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Badge criada." : "Badge salva.");
      router.push("/admin/badges");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className={`rule-form__section badge-preview badge-preview--${tier}`}>
        <span className="badge-preview__icon" aria-hidden="true"><BadgeIcon name={icon} className="size-6" /></span>
        <div className="min-w-0">
          <p className="badge-preview__name">{name || "Nome da badge"}</p>
          <p className="badge-preview__desc">{description || "Descrição"}</p>
        </div>
      </section>

      <section className="rule-form__section">
        <div className="field">
          <Label htmlFor="bd-name">Nome</Label>
          <Input id="bd-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="field">
          <Label htmlFor="bd-desc">Descrição</Label>
          <Input id="bd-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
        <div className="field">
          <Label htmlFor="bd-icon">Ícone</Label>
          <div className="rank-icon-pick">
            <span className={`badge-preview__icon badge-preview__icon--${tier}`} aria-hidden="true"><BadgeIcon name={icon} className="size-5" /></span>
            <select id="bd-icon" className="rte__select" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {BADGE_ICON_NAMES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <Label htmlFor="bd-tier">Nível</Label>
          <select id="bd-tier" className="rte__select" value={tier} onChange={(e) => setTier(e.target.value as Tier)}>
            <option value="bronze">Bronze</option>
            <option value="silver">Prata</option>
            <option value="gold">Ouro</option>
          </select>
        </div>
        <label className="rule-form__check">
          <input type="checkbox" checked={manual} onChange={(e) => setManual(e.target.checked)} /> Concedível manualmente (por moderador/admin)
        </label>
      </section>

      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
