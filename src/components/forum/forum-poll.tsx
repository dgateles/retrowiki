"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, Check, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { votePollAction } from "@/lib/actions/forum-actions";
import type { PollView } from "@/lib/forum-polls";

const dateFmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

/** Enquete de um tópico (estilo IPB): formulário de voto ou resultados com barras. */
export function ForumPoll({ poll, canVote }: { poll: PollView; canVote: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [showResults, setShowResults] = useState(poll.hasVoted || poll.closed || !canVote);

  const closesAt = poll.closesAt ? new Date(poll.closesAt) : null;

  function toggle(questionId: number, choiceId: number, multiple: boolean) {
    setSelected((prev) => {
      const cur = prev[questionId] ?? [];
      if (multiple) {
        return { ...prev, [questionId]: cur.includes(choiceId) ? cur.filter((c) => c !== choiceId) : [...cur, choiceId] };
      }
      return { ...prev, [questionId]: [choiceId] };
    });
  }

  function submit() {
    const choiceIds = Object.values(selected).flat();
    if (poll.questions.some((q) => (selected[q.id] ?? []).length === 0)) {
      toast.error("Responda todas as perguntas.");
      return;
    }
    start(async () => {
      const res = await votePollAction({ pollId: poll.id, choiceIds });
      if (res.ok) { toast.success("Voto registrado."); setShowResults(true); router.refresh(); }
      else toast.error(res.error ?? "Não foi possível votar.");
    });
  }

  return (
    <section className="fpoll" aria-label={poll.title ?? "Enquete"}>
      <header className="fpoll__head">
        <BarChart3 className="size-5 text-primary" aria-hidden="true" />
        <h2 className="fpoll__title">{poll.title ?? "Enquete"}</h2>
        {poll.closed && <span className="fpoll__badge"><Lock className="size-3" aria-hidden="true" /> Encerrada</span>}
      </header>

      {poll.questions.map((q) => {
        const picks = selected[q.id] ?? [];
        return (
          <div key={q.id} className="fpoll__q">
            <p className="fpoll__q-title">{q.title}{q.multiple && <span className="fpoll__q-hint"> (múltipla escolha)</span>}</p>
            <ul className="fpoll__choices">
              {q.choices.map((c) => {
                const pct = q.total > 0 ? Math.round((c.votes / q.total) * 100) : 0;
                const mine = poll.myChoiceIds.includes(c.id);
                if (showResults) {
                  return (
                    <li key={c.id} className={cn("fpoll__result", mine && "fpoll__result--mine")}>
                      <div className="fpoll__result-top">
                        <span className="fpoll__result-label">{mine && <Check className="mr-1 inline size-3.5 text-primary" aria-label="Seu voto" />}{c.label}</span>
                        <span className="fpoll__result-num tabular-nums">{pct}% · {c.votes}</span>
                      </div>
                      <div className="fpoll__bar"><div className="fpoll__bar-fill" style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                }
                return (
                  <li key={c.id}>
                    <label className={cn("fpoll__opt", picks.includes(c.id) && "fpoll__opt--on")}>
                      <input
                        type={q.multiple ? "checkbox" : "radio"}
                        name={`q-${q.id}`}
                        checked={picks.includes(c.id)}
                        onChange={() => toggle(q.id, c.id, q.multiple)}
                        className="size-4 accent-primary"
                      />
                      <span>{c.label}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <footer className="fpoll__foot">
        <span className="fpoll__meta">
          {poll.participants} {poll.participants === 1 ? "participante" : "participantes"}
          {closesAt && <> · {poll.closed ? "Encerrou" : "Encerra"} em {dateFmt(closesAt)}</>}
        </span>
        {!showResults ? (
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowResults(true)}>Ver resultados</Button>
            <Button type="button" size="sm" disabled={pending} onClick={submit}>{pending ? "Enviando…" : "Votar"}</Button>
          </div>
        ) : canVote && !poll.hasVoted && !poll.closed ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setShowResults(false)}>Votar</Button>
        ) : null}
      </footer>

      {poll.publicVoters && poll.voters.length > 0 && (
        <div className="fpoll__voters">
          <span className="fpoll__voters-label">Votaram:</span>{" "}
          {poll.voters.map((v, i) => (
            <span key={v.id}>{i > 0 && ", "}<a href={`/u/${v.handle}`} className="link-inline">{v.name}</a></span>
          ))}
        </div>
      )}
    </section>
  );
}
