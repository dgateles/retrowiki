"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createTaskAction, updateTaskAction } from "@/lib/actions/quest-actions";

type RuleOpt = { id: number; label: string };

export function TaskForm({
  mode,
  taskId,
  questId,
  initial,
  rules,
}: {
  mode: "create" | "edit";
  taskId?: number;
  questId: number;
  initial: { title: string; description: string; link: string; ruleId: number };
  rules: RuleOpt[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [link, setLink] = useState(initial.link);
  const [ruleId, setRuleId] = useState(initial.ruleId || (rules[0]?.id ?? 0));
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 2) {
      toast.error("Dê um título à tarefa.");
      return;
    }
    if (!ruleId) {
      toast.error("Escolha uma regra.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ title, description, link, ruleId });
    const res = mode === "create" ? await createTaskAction(questId, body) : await updateTaskAction(taskId!, questId, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Tarefa criada." : "Tarefa salva.");
      router.push(`/admin/quests/${questId}`);
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <section className="rule-form__section">
      <div className="field">
        <Label htmlFor="t-title">Título</Label>
        <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} />
      </div>
      <div className="field">
        <Label htmlFor="t-desc">Descrição</Label>
        <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={3} />
      </div>
      <div className="field">
        <Label htmlFor="t-link">Link (opcional)</Label>
        <Input id="t-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/guias ou https://…" maxLength={400} />
      </div>
      <div className="field">
        <Label htmlFor="t-rule">Regra (completa a tarefa quando a ação acontece)</Label>
        <Select value={String(ruleId)} onValueChange={(v) => setRuleId(Number(v))} disabled={rules.length === 0}>
          <SelectTrigger id="t-rule" className="w-full"><SelectValue placeholder="Crie uma regra primeiro" /></SelectTrigger>
          <SelectContent>
            {rules.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending || rules.length === 0}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </section>
  );
}
