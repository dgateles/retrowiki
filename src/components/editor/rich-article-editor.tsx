"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichEditor } from "@/components/editor/rich-editor";
import { createDraftAction, updateDraftAction, submitForReviewAction } from "@/lib/actions/article-actions";

const TYPES = [
  { type: "tutorial", label: "Tutorial" },
  { type: "buying_guide", label: "Guia de compras" },
  { type: "troubleshooting", label: "Solução de problemas" },
  { type: "firmware", label: "Firmware" },
  { type: "general", label: "Geral" },
] as const;

type Initial = { articleId: number; title: string; type: string; doc: JSONContent };

export function RichArticleEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(String(initial?.type ?? "tutorial"));
  const [doc, setDoc] = useState<JSONContent | null>(initial?.doc ?? null);
  const [pending, setPending] = useState(false);

  async function ensureSaved(): Promise<number | null> {
    const payload = { title, type: type as (typeof TYPES)[number]["type"], deviceId: null, body: JSON.stringify(doc ?? { type: "doc", content: [{ type: "paragraph" }] }) };
    const res = initial?.articleId
      ? await updateDraftAction(initial.articleId, payload)
      : await createDraftAction(payload);
    if (!res.ok || !res.data) {
      toast.error(res.error ?? "Falha ao salvar.");
      return null;
    }
    return res.data.id;
  }

  async function onSaveDraft() {
    setPending(true);
    const id = await ensureSaved();
    setPending(false);
    if (id) {
      toast.success("Rascunho salvo.");
      router.push("/estudio");
    }
  }

  async function onSubmitReview() {
    setPending(true);
    const id = await ensureSaved();
    if (!id) {
      setPending(false);
      return;
    }
    const sub = await submitForReviewAction(id);
    setPending(false);
    if (sub.ok) {
      toast.success("Enviado para revisão.");
      router.push("/guias");
    } else {
      toast.error(sub.error ?? "Falha ao enviar.");
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="editor">
      <div className="field">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={8} maxLength={140} />
      </div>
      <div className="field">
        <Label htmlFor="type">Tipo</Label>
        <select id="type" aria-label="Tipo do conteúdo" value={type} onChange={(e) => setType(e.target.value)} className="editor__select editor__select--full">
          {TYPES.map((t) => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <Label htmlFor="body" id="body-label">Conteúdo</Label>
        <RichEditor value={initial?.doc} onChange={setDoc} />
      </div>

      <div className="btn-row">
        <Button type="button" variant="outline" onClick={onSaveDraft} disabled={pending || title.length < 8}>
          {pending ? "Salvando…" : "Salvar rascunho"}
        </Button>
        <Button type="button" onClick={onSubmitReview} disabled={pending || title.length < 8}>
          Enviar para revisão
        </Button>
      </div>
    </form>
  );
}
