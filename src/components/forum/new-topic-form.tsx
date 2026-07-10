"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { createTopicAction } from "@/lib/actions/forum-actions";
import { topicHref, forumHref } from "@/lib/forum-url";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

export function NewTopicForm({ forumId, forumSlug }: { forumId: number; forumSlug: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [doc, setDoc] = useState<JSONContent>(EMPTY);
  const [follow, setFollow] = useState(true);
  const [pending, setPending] = useState(false);

  const valid = title.trim().length >= 5 && docHasText(doc);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setPending(true);
    const res = await createTopicAction({ forumId, title: title.trim(), body: JSON.stringify(doc), follow });
    setPending(false);
    if (res.ok && res.data) {
      if (res.data.pending) {
        toast.success("Tópico enviado para revisão.");
        router.push(forumHref(res.data.forumSlug));
      } else {
        toast.success("Tópico criado.");
        router.push(topicHref(res.data.forumSlug, res.data.topicSlug));
      }
    } else {
      toast.error(res.error ?? "Não foi possível criar o tópico.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex max-w-3xl flex-col gap-4">
      <div className="field">
        <Label htmlFor="topic-title">Título</Label>
        <Input id="topic-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Sobre o que você quer conversar?" required />
      </div>
      <div className="field">
        <Label>Mensagem</Label>
        <RichEditor value={doc} onChange={setDoc} variant="comment" placeholder="Escreva sua mensagem…" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={follow} onCheckedChange={(c) => setFollow(c === true)} />
          Seguir o tópico
        </label>
        <div className="flex gap-2">
          <Button asChild type="button" variant="ghost" size="sm"><a href={forumHref(forumSlug)}>Cancelar</a></Button>
          <Button type="submit" size="sm" disabled={pending || !valid}>{pending ? "Publicando…" : "Publicar tópico"}</Button>
        </div>
      </div>
    </form>
  );
}
