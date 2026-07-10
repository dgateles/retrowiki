"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { replyTopicAction } from "@/lib/actions/forum-actions";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function ReplyForm({ topicId }: { topicId: number }) {
  const router = useRouter();
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [follow, setFollow] = useState(true);
  const [pending, setPending] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

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
    <form onSubmit={onSubmit} className="freply">
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
