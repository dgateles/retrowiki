"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { replyTopicAction } from "@/lib/actions/forum-actions";
import type { ForumQuoteDetail } from "@/components/forum/quote-button";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** Monta um nó de citação (blockquote) com atribuição a partir do texto do post. */
function buildQuoteNode(author: string, text: string): JSONContent {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 40);
  const paras: JSONContent[] = lines.length
    ? lines.map((line) => ({ type: "paragraph", content: [{ type: "text", text: line }] }))
    : [{ type: "paragraph" }];
  return {
    type: "blockquote",
    content: [{ type: "paragraph", content: [{ type: "text", marks: [{ type: "bold" }], text: `${author} escreveu:` }] }, ...paras],
  };
}
/** Anexa a citação ao doc atual (descartando o parágrafo vazio inicial). */
function appendQuote(prev: JSONContent, author: string, text: string): JSONContent {
  const existing = (prev.content ?? []).filter((n) => !(n.type === "paragraph" && !(n.content && n.content.length)));
  return { type: "doc", content: [...existing, buildQuoteNode(author, text), { type: "paragraph" }] };
}

export function ReplyForm({ topicId }: { topicId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [follow, setFollow] = useState(true);
  const [pending, setPending] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  // Escuta o botão "Citar" de cada post; empilha a citação e rola até o editor.
  useEffect(() => {
    function onQuote(e: Event) {
      const d = (e as CustomEvent<ForumQuoteDetail>).detail;
      if (!d) return;
      setDoc((prev) => appendQuote(prev, d.author, d.text));
      setEditorKey((k) => k + 1);
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
    window.addEventListener("forum:quote", onQuote as EventListener);
    return () => window.removeEventListener("forum:quote", onQuote as EventListener);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docHasText(doc)) return;
    setPending(true);
    const res = await replyTopicAction({ topicId, body: JSON.stringify(doc), follow });
    setPending(false);
    if (res.ok) {
      setDoc(EMPTY);
      setEditorKey((k) => k + 1);
      toast.success((res.data as { pending?: boolean } | undefined)?.pending ? "Enviado para revisão." : "Resposta publicada.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível responder.");
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="freply">
      <h2 className="freply__title">Responder</h2>
      <RichEditor key={editorKey} value={doc} onChange={setDoc} variant="full" placeholder="Escreva sua resposta…" />
      <div className="freply__foot">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={follow} onCheckedChange={(c) => setFollow(c === true)} />
          Seguir e receber novas respostas
        </label>
        <Button type="submit" size="sm" disabled={pending || !docHasText(doc)}>
          {pending ? "Enviando…" : "Responder"}
        </Button>
      </div>
    </form>
  );
}
