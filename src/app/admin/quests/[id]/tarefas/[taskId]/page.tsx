import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuest, getTask } from "@/lib/admin/quests";
import { listRules, TRIGGERS } from "@/lib/achievements";
import { TaskForm } from "@/components/admin/task-form";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = await params;
  const questId = Number(id);
  const tId = Number(taskId);
  if (!Number.isInteger(questId) || questId <= 0 || !Number.isInteger(tId) || tId <= 0) notFound();
  const [quest, task] = await Promise.all([getQuest(questId), getTask(tId)]);
  if (!quest || !task || task.questId !== questId) notFound();
  const rules = await listRules();

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/admin/quests/${questId}`}><ChevronLeft className="size-4" aria-hidden="true" /> {quest.title}</Link>
      </Button>
      <h1 className="page__title mt-3">{task.title}</h1>
      <TaskForm
        mode="edit"
        taskId={task.id}
        questId={questId}
        initial={{ title: task.title, description: task.description, link: task.link ?? "", ruleId: task.ruleId }}
        rules={rules.map((r) => ({ id: r.id, label: `${r.name} · ${TRIGGERS[r.trigger]?.label ?? r.trigger}` }))}
      />
    </>
  );
}
