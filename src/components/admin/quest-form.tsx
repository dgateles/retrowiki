"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createQuestAction, updateQuestAction } from "@/lib/actions/quest-actions";

type Opt = { value: string; label: string };

export function QuestForm({
  mode,
  questId,
  initial,
  badges,
}: {
  mode: "create" | "edit";
  questId?: number;
  initial: { title: string; description: string; rewardBadge: string };
  badges: Opt[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [rewardBadge, setRewardBadge] = useState(initial.rewardBadge);
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 2) {
      toast.error("Dê um título à missão.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ title, description, rewardBadge });
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
    <section className="rule-form__section">
      <div className="field">
        <Label htmlFor="q-title">Título</Label>
        <Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="q-desc">Descrição</Label>
        <textarea id="q-desc" className="q-textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={4} />
      </div>
      <div className="field">
        <Label htmlFor="q-badge">Recompensa (badge)</Label>
        <select id="q-badge" className="rte__select" value={rewardBadge} onChange={(e) => setRewardBadge(e.target.value)}>
          <option value="">(Nenhuma)</option>
          {badges.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </section>
  );
}
