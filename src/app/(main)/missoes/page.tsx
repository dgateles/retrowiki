import Link from "next/link";
import type { Metadata } from "next";
import { Check, Circle, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { getQuestsForUser } from "@/lib/admin/quests";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Missões",
  description: "Complete tarefas e ganhe conquistas na comunidade RetroWiki.",
};

export default async function MissoesPage() {
  const user = await getCurrentUser();
  const quests = await getQuestsForUser(user ? Number(user.id) : null);

  return (
    <main id="main" className="page">
      <h1 className="page__title">Missões</h1>
      <p className="page__note">Complete as tarefas para ganhar conquistas.</p>

      {!user && (
        <p className="muted mt-4">
          <Link href="/auth/entrar" className="underline">Entre</Link> para acompanhar seu progresso.
        </p>
      )}

      {quests.length === 0 ? (
        <p className="empty mt-6">Nenhuma missão disponível no momento.</p>
      ) : (
        <ul className="quest-cards mt-6">
          {quests.map((q) => (
            <li key={q.id} className={`quest-card${q.completed ? " quest-card--done" : ""}`}>
              <div className="quest-card__head">
                <h2 className="quest-card__title">{q.title}</h2>
                {q.completed && (
                  <span className="quest-card__done" aria-label="Missão concluída">
                    <CheckCircle2 className="size-4" aria-hidden="true" /> Concluída
                  </span>
                )}
              </div>
              {q.description && <p className="quest-card__desc">{q.description}</p>}
              <ul className="quest-tasks">
                {q.tasks.map((t) => (
                  <li key={t.id} className={`quest-task${t.done ? " quest-task--done" : ""}`}>
                    <span className="quest-task__mark" aria-hidden="true">
                      {t.done ? <Check className="size-4" /> : <Circle className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      {t.link ? (
                        <Link href={t.link} className="quest-task__title quest-task__title--link">{t.title}</Link>
                      ) : (
                        <span className="quest-task__title">{t.title}</span>
                      )}
                      {t.description && <span className="quest-task__desc">{t.description}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
