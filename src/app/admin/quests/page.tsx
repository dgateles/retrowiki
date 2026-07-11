import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listQuests } from "@/lib/admin/quests";
import { QuestToggle, QuestDelete } from "@/components/admin/quest-row-actions";

import { count } from "@/lib/plural";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const quests = await listQuests();

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Missões</h1>
          <p className="page__note">Conjuntos de tarefas (ligadas a Regras) que concedem uma recompensa ao serem concluídas.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/quests/nova"><Plus className="size-4" aria-hidden="true" /> Nova missão</Link>
        </Button>
      </div>

      {quests.length === 0 ? (
        <p className="empty mt-6">Nenhuma missão ainda.</p>
      ) : (
        <ul className="rule-list">
          {quests.map((q) => (
            <li key={q.id} className="rule-row">
              <span className={`rule-row__status${q.enabled ? " rule-row__status--on" : ""}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="rule-row__name">{q.title}</p>
                <p className="rule-row__meta">
                  {count(q.taskCount, "tarefa", "tarefas")}{q.rewardBadge && ` · recompensa: ${q.rewardBadge}`}{!q.enabled && " · desativada"}
                </p>
              </div>
              <QuestToggle id={q.id} enabled={q.enabled} />
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href={`/admin/quests/${q.id}`} aria-label={`Editar ${q.title}`}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Link>
              </Button>
              <QuestDelete id={q.id} title={q.title} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
