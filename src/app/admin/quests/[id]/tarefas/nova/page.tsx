import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuest } from "@/lib/admin/quests";
import { listRules, TRIGGERS } from "@/lib/achievements";
import { TaskForm } from "@/components/admin/task-form";

export const dynamic = "force-dynamic";

export default async function NewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questId = Number(id);
  if (!Number.isInteger(questId) || questId <= 0) notFound();
  const quest = await getQuest(questId);
  if (!quest) notFound();
  const rules = await listRules();

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/quests/${questId}`}><ChevronLeft className="size-4" aria-hidden="true" /> {quest.title}</Link>
      </Button>
      <h1 className="page__title mt-3">Nova tarefa</h1>
      <TaskForm
        mode="create"
        questId={questId}
        initial={{ title: "", description: "", link: "", ruleId: 0 }}
        rules={rules.map((r) => ({ id: r.id, label: `${r.name} · ${TRIGGERS[r.trigger]?.label ?? r.trigger}` }))}
      />
    </>
  );
}
