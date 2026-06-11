import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getQuest } from "@/lib/admin/quests";
import { listBadgesWithCounts } from "@/lib/badges";
import { listRules, TRIGGERS } from "@/lib/achievements";
import { ROLES, ROLE_LABEL } from "@/lib/admin/role-permissions";
import { QuestForm } from "@/components/admin/quest-form";
import { TaskDelete } from "@/components/admin/quest-row-actions";

export const dynamic = "force-dynamic";

function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

export default async function EditQuestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questId = Number(id);
  if (!Number.isInteger(questId) || questId <= 0) notFound();
  const quest = await getQuest(questId);
  if (!quest) notFound();

  const [badges, rules] = await Promise.all([listBadgesWithCounts(), listRules()]);
  const ruleName = new Map(rules.map((r) => [r.id, `${r.name} · ${TRIGGERS[r.trigger]?.label ?? r.trigger}`]));
  const roles = ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));

  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link href="/admin/quests"><ChevronLeft className="size-4" aria-hidden="true" /> Missões</Link>
      </Button>
      <h1 className="page__title mt-3">{quest.title}</h1>

      <QuestForm
        mode="edit"
        questId={quest.id}
        initial={{
          title: quest.title,
          description: quest.description,
          rewardBadge: quest.rewardBadge ?? "",
          coverImage: quest.coverImage ?? "",
          startsAt: toLocalInput(quest.startsAt),
          endsAt: toLocalInput(quest.endsAt),
          audienceRoles: quest.audienceRoles,
          allowOptOut: quest.allowOptOut,
          retroactive: quest.retroactive,
        }}
        badges={badges.map((b) => ({ value: b.slug, label: b.name }))}
        roles={roles}
      />

      <div className="page__head mt-8">
        <h2 className="rule-form__title">Tarefas ({quest.tasks.length})</h2>
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/quests/${quest.id}/tarefas/nova`}><Plus className="size-4" aria-hidden="true" /> Adicionar tarefa</Link>
        </Button>
      </div>

      {quest.tasks.length === 0 ? (
        <p className="muted mt-3">Nenhuma tarefa. Adicione ao menos uma para a missão poder ser concluída.</p>
      ) : (
        <ul className="rule-list">
          {quest.tasks.map((t) => (
            <li key={t.id} className="rule-row">
              <div className="min-w-0">
                <p className="rule-row__name">{t.title}</p>
                <p className="rule-row__meta">{ruleName.get(t.ruleId) ?? `regra #${t.ruleId}`}</p>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href={`/admin/quests/${quest.id}/tarefas/${t.id}`} aria-label={`Editar tarefa ${t.title}`}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Link>
              </Button>
              <TaskDelete id={t.id} questId={quest.id} title={t.title} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
