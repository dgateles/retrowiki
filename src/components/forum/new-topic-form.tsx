"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RichEditor } from "@/components/editor/rich-editor";
import { docHasText } from "@/components/engagement/comment-form";
import { createTopicAction } from "@/lib/actions/forum-actions";
import { topicHref, forumHref } from "@/lib/forum-url";

const EMPTY: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };
const Required = () => <span className="text-xs font-semibold uppercase tracking-wide text-destructive">Obrigatório</span>;

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
    <form onSubmit={onSubmit} className="ftopic-form">
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

      <div className="ftopic-form__foot">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={follow} onCheckedChange={setFollow} /> Seguir o tópico
        </label>
        <div className="flex gap-2">
          <Button asChild type="button" variant="ghost" size="sm"><a href={forumHref(forumSlug)}>Cancelar</a></Button>
          <Button type="submit" disabled={pending || !valid}>{pending ? "Publicando…" : "Publicar tópico"}</Button>
        </div>
      </div>
    </form>
  );
}
