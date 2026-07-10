"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Plus, X, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { createTopicAction } from "@/lib/actions/forum-actions";
import { topicHref, forumHref } from "@/lib/forum-url";
import { cn } from "@/lib/utils";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const Required = () => <span className="text-xs font-semibold uppercase tracking-wide text-destructive">Obrigatório</span>;

type PollQuestion = { title: string; multiple: boolean; choices: string[] };
const newQuestion = (): PollQuestion => ({ title: "", multiple: false, choices: ["", ""] });

export function NewTopicForm({ forumId, forumSlug, isStaff = false }: { forumId: number; forumSlug: string; isStaff?: boolean }) {
  const router = useRouter();
  const [tab, setTab] = useState<"content" | "poll">("content");
  const [title, setTitle] = useState("");
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [follow, setFollow] = useState(true);
  const [isQuestion, setIsQuestion] = useState(false);
  const [pending, setPending] = useState(false);

  // Enquete
  const [pollOn, setPollOn] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [publicVoters, setPublicVoters] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [questions, setQuestions] = useState<PollQuestion[]>([newQuestion()]);

  // Pós-publicação (staff)
  const [lock, setLock] = useState(false);
  const [pin, setPin] = useState(false);
  const [hide, setHide] = useState(false);

  const contentValid = title.trim().length >= 5 && docHasText(doc);

  function setQuestion(i: number, patch: Partial<PollQuestion>) {
    setQuestions((qs) => qs.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function setChoice(qi: number, ci: number, value: string) {
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, choices: q.choices.map((c, j) => (j === ci ? value : c)) } : q)));
  }
  function addChoice(qi: number) {
    setQuestions((qs) => qs.map((q, idx) => (idx === qi ? { ...q, choices: [...q.choices, ""] } : q)));
  }
  function removeChoice(qi: number, ci: number) {
    setQuestions((qs) => qs.map((q, idx) => (idx === qi && q.choices.length > 2 ? { ...q, choices: q.choices.filter((_, j) => j !== ci) } : q)));
  }

  function validatePoll(): { ok: boolean; error?: string } {
    for (const q of questions) {
      if (q.title.trim().length === 0) return { ok: false, error: "Cada pergunta precisa de um título." };
      if (q.choices.filter((c) => c.trim()).length < 2) return { ok: false, error: "Cada pergunta precisa de ao menos 2 opções." };
    }
    return { ok: true };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!contentValid) { setTab("content"); toast.error("Preencha o título e a mensagem."); return; }
    let poll;
    if (pollOn) {
      const v = validatePoll();
      if (!v.ok) { setTab("poll"); toast.error(v.error!); return; }
      poll = {
        title: pollTitle.trim() || undefined,
        publicVoters,
        closesAt: closesAt ? new Date(closesAt).toISOString() : null,
        questions: questions.map((q) => ({ title: q.title.trim(), multiple: q.multiple, choices: q.choices.map((c) => c.trim()).filter(Boolean) })),
      };
    }
    setPending(true);
    const res = await createTopicAction({
      forumId, title: title.trim(), body: JSON.stringify(doc), follow, isQuestion, poll,
      options: isStaff ? { lock, pin, hide } : undefined,
    });
    setPending(false);
    if (res.ok && res.data) {
      if (res.data.pending) { toast.success("Tópico enviado para revisão."); router.push(forumHref(res.data.forumSlug)); }
      else { toast.success("Tópico criado."); router.push(topicHref(res.data.forumSlug, res.data.topicSlug)); }
    } else {
      toast.error(res.error ?? "Não foi possível criar o tópico.");
    }
  }

  return (
    <form onSubmit={onSubmit} className={cn("ftopic-grid", isStaff && "ftopic-grid--aside")}>
      <div className="ftopic-main">
        <div className="ftopic-tabs" role="tablist" aria-label="Conteúdo ou enquete">
          <button type="button" role="tab" aria-selected={tab === "content"} className={cn("ftopic-tab", tab === "content" && "ftopic-tab--on")} onClick={() => setTab("content")}>
            <FileText className="size-4" aria-hidden="true" /> Conteúdo
          </button>
          <button type="button" role="tab" aria-selected={tab === "poll"} className={cn("ftopic-tab", tab === "poll" && "ftopic-tab--on")} onClick={() => setTab("poll")}>
            <BarChart3 className="size-4" aria-hidden="true" /> Enquete{pollOn && <span className="ftopic-tab__dot" aria-hidden="true" />}
          </button>
        </div>

        {tab === "content" ? (
          <div className="ftopic-form">
            <div className="ftopic-form__section">
              <div className="ftopic-form__labelrow">
                <Label htmlFor="topic-title" className="text-sm font-semibold">Título</Label>
                <Required />
              </div>
              <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
                className="h-11 text-base" placeholder="Sobre o que você quer conversar?" required />
            </div>
            <div className="ftopic-form__section">
              <div className="ftopic-form__labelrow">
                <Label className="text-sm font-semibold">Mensagem</Label>
                <Required />
              </div>
              <RichEditor variant="full" value={doc} onChange={setDoc} placeholder="Escreva sua mensagem…" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={isQuestion} onCheckedChange={setIsQuestion} />
              É uma pergunta <span className="text-muted-foreground">— habilita marcar a “melhor resposta” (Resolvido)</span>
            </label>
          </div>
        ) : (
          <div className="ftopic-form">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Switch checked={pollOn} onCheckedChange={setPollOn} /> Adicionar uma enquete a este tópico
            </label>

            {pollOn && (
              <>
                <div className="ftopic-form__section">
                  <Label htmlFor="poll-title" className="text-sm font-semibold">Título da enquete</Label>
                  <Input id="poll-title" value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} maxLength={200} placeholder="Ex.: Qual seu handheld favorito?" />
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={publicVoters} onCheckedChange={(c) => setPublicVoters(c === true)} /> Tornar votantes públicos</label>
                  <div className="flex items-center gap-2 text-sm">
                    <Label htmlFor="poll-closes" className="text-sm">Fechar em</Label>
                    <Input id="poll-closes" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="h-9 w-auto" />
                  </div>
                </div>

                {questions.map((q, qi) => (
                  <fieldset key={qi} className="fpoll-edit">
                    <div className="fpoll-edit__head">
                      <Input value={q.title} onChange={(e) => setQuestion(qi, { title: e.target.value })} maxLength={300} placeholder={`Pergunta ${qi + 1}`} className="h-10" />
                      {questions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="size-9 shrink-0 text-muted-foreground" aria-label="Remover pergunta" onClick={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}>
                          <X className="size-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    <div className="fpoll-edit__choices">
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="fpoll-edit__choice">
                          <span className="fpoll-edit__num tabular-nums">{ci + 1}</span>
                          <Input value={c} onChange={(e) => setChoice(qi, ci, e.target.value)} maxLength={300} placeholder={`Opção ${ci + 1}`} className="h-9" />
                          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground disabled:opacity-30" aria-label="Remover opção" disabled={q.choices.length <= 2} onClick={() => removeChoice(qi, ci)}>
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="fpoll-edit__foot">
                      <Button type="button" variant="outline" size="sm" onClick={() => addChoice(qi)}><Plus className="size-4" aria-hidden="true" /> Adicionar opção</Button>
                      <label className="flex items-center gap-2 text-sm"><Checkbox checked={q.multiple} onCheckedChange={(c) => setQuestion(qi, { multiple: c === true })} /> Múltipla escolha</label>
                    </div>
                  </fieldset>
                ))}

                <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => setQuestions((qs) => [...qs, newQuestion()])}>
                  <Plus className="size-4" aria-hidden="true" /> Adicionar pergunta
                </Button>
              </>
            )}
          </div>
        )}

        <div className="ftopic-form__foot">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={follow} onCheckedChange={setFollow} /> Seguir o tópico
          </label>
          <div className="flex gap-2">
            <Button asChild type="button" variant="ghost" size="sm"><a href={forumHref(forumSlug)}>Cancelar</a></Button>
            <Button type="submit" disabled={pending || !contentValid}>{pending ? "Publicando…" : "Publicar tópico"}</Button>
          </div>
        </div>
      </div>

      {isStaff && (
        <aside className="ftopic-aside" aria-label="Opções de publicação">
          <h2 className="ftopic-aside__title">Ao publicar…</h2>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={lock} onCheckedChange={(c) => setLock(c === true)} /> Trancar o tópico</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={pin} onCheckedChange={(c) => setPin(c === true)} /> Fixar o tópico</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={hide} onCheckedChange={(c) => setHide(c === true)} /> Ocultar o tópico</label>
          <p className="ftopic-aside__note">Opções de moderação. Trancar e ocultar não podem ser usados juntos.</p>
        </aside>
      )}
    </form>
  );
}
