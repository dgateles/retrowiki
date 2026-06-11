"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createQuestAction, updateQuestAction } from "@/lib/actions/quest-actions";
import { ImageUpload } from "@/components/admin/image-upload";

type Opt = { value: string; label: string };

export type QuestFormInitial = {
  title: string;
  description: string;
  rewardBadge: string;
  coverImage: string;
  startsAt: string;
  endsAt: string;
  audienceRoles: string[];
  allowOptOut: boolean;
  retroactive: boolean;
};

export function QuestForm({
  mode,
  questId,
  initial,
  badges,
  roles,
}: {
  mode: "create" | "edit";
  questId?: number;
  initial: QuestFormInitial;
  badges: Opt[];
  roles: Opt[];
}) {
  const router = useRouter();
  const [v, setV] = useState<QuestFormInitial>(initial);
  const [pending, setPending] = useState(false);

  function set<K extends keyof QuestFormInitial>(key: K, val: QuestFormInitial[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }
  function toggleRole(role: string, on: boolean) {
    setV((prev) => ({ ...prev, audienceRoles: on ? [...new Set([...prev.audienceRoles, role])] : prev.audienceRoles.filter((r) => r !== role) }));
  }

  async function save() {
    if (v.title.trim().length < 2) {
      toast.error("Dê um título à missão.");
      return;
    }
    setPending(true);
    const body = JSON.stringify(v);
    const res = mode === "create" ? await createQuestAction(body) : await updateQuestAction(questId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Missão criada." : "Missão salva.");
      const id = mode === "create" ? (res.data as { id: number } | undefined)?.id : questId;
      router.push(id ? `/admin/quests/${id}` : "/admin/quests");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <h2 className="rule-form__title">Detalhes</h2>
        <div className="field">
          <Label htmlFor="q-title">Título</Label>
          <Input id="q-title" value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={160} />
        </div>
        <div className="field">
          <Label htmlFor="q-desc">Descrição</Label>
          <Textarea id="q-desc" value={v.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} rows={4} />
        </div>
        <div className="field">
          <Label htmlFor="q-badge">Recompensa (badge)</Label>
          <Select value={v.rewardBadge || "none"} onValueChange={(val) => set("rewardBadge", val === "none" ? "" : val)}>
            <SelectTrigger id="q-badge" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">(Nenhuma)</SelectItem>
              {badges.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="field">
          <Label>Imagem de capa (opcional)</Label>
          <ImageUpload value={v.coverImage} onChange={(url) => set("coverImage", url)} folder="quests" />
        </div>
      </section>

      <section className="rule-form__section">
        <h2 className="rule-form__title">Disponibilidade</h2>
        <div className="field">
          <Label htmlFor="q-start">Início (opcional)</Label>
          <Input id="q-start" type="datetime-local" value={v.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
        </div>
        <div className="field">
          <Label htmlFor="q-end">Fim (opcional)</Label>
          <Input id="q-end" type="datetime-local" value={v.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
        </div>
        <div className="field">
          <Label>Público-alvo (papéis; nenhum marcado = todos)</Label>
          <div className="rule-form__roles">
            {roles.map((r) => (
              <label key={r.value} className="flex items-center gap-2 text-sm">
                <Checkbox checked={v.audienceRoles.includes(r.value)} onCheckedChange={(c) => toggleRole(r.value, c === true)} /> {r.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="q-optout" checked={v.allowOptOut} onCheckedChange={(c) => set("allowOptOut", c)} />
          <Label htmlFor="q-optout" className="font-normal">Permitir que o usuário saia da missão</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="q-retro" checked={v.retroactive} onCheckedChange={(c) => set("retroactive", c)} />
          <Label htmlFor="q-retro" className="font-normal">Regras retroativas (marca tarefas já cumpridas)</Label>
        </div>
      </section>

      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
