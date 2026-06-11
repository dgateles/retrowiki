"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichEditor } from "@/components/editor/rich-editor";
import { CommentAvatar } from "@/components/engagement/comment-avatar";
import { COMMENT_REPLY_EVENT, type CommentReplyDetail } from "@/components/engagement/comment-reply-button";
import { addCommentAction } from "@/lib/actions/engagement-actions";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

// Há texto não vazio em algum nó do doc?
export function docHasText(doc: JSONContent | undefined): boolean {
  if (!doc) return false;
  const walk = (n: JSONContent): boolean => {
    if (n.type === "text" && (n.text ?? "").trim()) return true;
    return (n.content ?? []).some(walk);
  };
  return (doc.content ?? []).some(walk);
}

export function CommentForm({ articleId, meName, meAvatar }: { articleId: number; meName: string; meAvatar?: string | null }) {
  const router = useRouter();
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [follow, setFollow] = useState(true);
  const [pending, setPending] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const ref = useRef<HTMLFormElement>(null);

  // Resposta: recebe a citação do comentário, carrega no editor e guarda o autor
  // citado para notificá-lo ao enviar.
  useEffect(() => {
    function onReply(e: Event) {
      const { doc: quote, authorId } = (e as CustomEvent<CommentReplyDetail>).detail;
      setDoc(quote);
      setReplyTo(authorId);
      setEditorKey((k) => k + 1);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    window.addEventListener(COMMENT_REPLY_EVENT, onReply);
    return () => window.removeEventListener(COMMENT_REPLY_EVENT, onReply);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docHasText(doc)) return;
    setPending(true);
    const res = await addCommentAction({ articleId, body: JSON.stringify(doc), follow, replyToUserId: replyTo ?? undefined });
    setPending(false);
    if (res.ok) {
      setDoc(EMPTY);
      setReplyTo(null);
      setEditorKey((k) => k + 1);
      toast.success("Comentário publicado.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível comentar.");
    }
  }

  return (
    <form ref={ref} onSubmit={onSubmit} className="comment-form">
      <CommentAvatar name={meName} src={meAvatar} />
      <div className="comment-form__main">
        <RichEditor key={editorKey} value={doc} onChange={setDoc} variant="comment" placeholder="Escreva um comentário…" />
        <div className="comment-form__foot">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={follow} onCheckedChange={(c) => setFollow(c === true)} />
            Seguir o tópico e receber novas respostas
          </label>
          <Button type="submit" size="sm" disabled={pending || !docHasText(doc)}>
            {pending ? "Enviando…" : "Comentar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
