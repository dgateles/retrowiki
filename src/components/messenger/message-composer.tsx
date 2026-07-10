"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { startConversationAction } from "@/lib/actions/messenger-actions";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

/** Formulário de nova conversa privada. */
export function MessageComposer({ recipient = "" }: { recipient?: string }) {
  const router = useRouter();
  const [to, setTo] = useState(recipient);
  const [subject, setSubject] = useState("");
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [pending, setPending] = useState(false);

  const valid = to.trim().length >= 1 && subject.trim().length >= 2 && docHasText(doc);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    const res = await startConversationAction({ recipient: to.trim(), subject: subject.trim(), body: JSON.stringify(doc) });
    setPending(false);
    if (res.ok && res.data) {
      toast.success("Mensagem enviada.");
      router.push(`/mensagens/${(res.data as { conversationId: number }).conversationId}`);
    } else {
      toast.error(res.error ?? "Não foi possível enviar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="pm-compose">
      <div className="field">
        <Label htmlFor="pm-to">Para</Label>
        <Input id="pm-to" value={to} onChange={(e) => setTo(e.target.value)} maxLength={60} placeholder="@usuario" autoComplete="off" />
      </div>
      <div className="field">
        <Label htmlFor="pm-subj">Assunto</Label>
        <Input id="pm-subj" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} placeholder="Sobre o que é a conversa?" />
      </div>
      <div className="field">
        <Label>Mensagem</Label>
        <RichEditor variant="comment" value={doc} onChange={setDoc} placeholder="Escreva sua mensagem…" />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending || !valid}>{pending ? "Enviando…" : "Enviar mensagem"}</Button>
      </div>
    </form>
  );
}
