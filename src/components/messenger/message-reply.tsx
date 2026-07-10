"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { sendMessageAction } from "@/lib/actions/messenger-actions";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** Caixa de resposta dentro de uma conversa. */
export function MessageReply({ conversationId }: { conversationId: number }) {
  const router = useRouter();
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [pending, setPending] = useState(false);
  const [editorKey, setEditorKey] = useState(0);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!docHasText(doc)) return;
    setPending(true);
    const res = await sendMessageAction({ conversationId, body: JSON.stringify(doc) });
    setPending(false);
    if (res.ok) {
      setDoc(EMPTY);
      setEditorKey((k) => k + 1);
      router.refresh();
    } else {
      toast.error(res.error ?? "Não foi possível enviar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="pm-reply">
      <RichEditor key={editorKey} variant="comment" value={doc} onChange={setDoc} placeholder="Escreva uma resposta…" />
      <div className="mt-3 flex justify-end">
        <Button type="submit" size="sm" disabled={pending || !docHasText(doc)}>{pending ? "Enviando…" : "Responder"}</Button>
      </div>
    </form>
  );
}
