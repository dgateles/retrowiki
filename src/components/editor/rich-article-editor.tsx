"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RichEditor } from "@/components/editor/rich-editor";
import { ImageUpload } from "@/components/admin/image-upload";
import { createDraftAction, updateDraftAction, submitForReviewAction, proposeEditAction } from "@/lib/actions/article-actions";

const TYPES = [
  { type: "tutorial", label: "Tutorial" },
  { type: "buying_guide", label: "Guia de compras" },
  { type: "troubleshooting", label: "Solução de problemas" },
  { type: "firmware", label: "Firmware" },
  { type: "general", label: "Geral" },
] as const;

type Initial = { articleId: number; title: string; type: string; doc: JSONContent; published?: boolean; kind?: "guide" | "blog"; coverImage?: string | null; isAuthor?: boolean };

export function RichArticleEditor({ initial, kind: kindProp }: { initial?: Initial; kind?: "guide" | "blog" }) {
  const router = useRouter();
  const kind: "guide" | "blog" = initial?.kind ?? kindProp ?? "guide";
  const isBlog = kind === "blog";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState(String(initial?.type ?? (isBlog ? "general" : "tutorial")));
  const [coverImage, setCoverImage] = useState<string>(initial?.coverImage ?? "");
  const [doc, setDoc] = useState<JSONContent | null>(initial?.doc ?? null);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const isProposal = !!initial?.published;
  const isAuthor = initial?.isAuthor !== false;
  const backTo = isBlog ? "/blog" : "/guias";

  function payload() {
    return { title, type: type as (typeof TYPES)[number]["type"], kind, coverImage: coverImage || null, deviceId: null, body: JSON.stringify(doc ?? { type: "doc", content: [{ type: "paragraph" }] }) };
  }

  async function ensureSaved(): Promise<number | null> {
    const res = initial?.articleId
      ? await updateDraftAction(initial.articleId, payload())
      : await createDraftAction(payload());
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
      router.push(backTo);
    } else {
      toast.error(sub.error ?? "Falha ao enviar.");
    }
  }

  // Edição de um conteúdo publicado: cria revisão pendente sem derrubar o no ar.
  async function onProposeEdit() {
    if (!initial?.articleId) return;
    setPending(true);
    const res = await proposeEditAction(initial.articleId, { ...payload(), note });
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Alteração enviada para revisão.");
      router.push(backTo);
    } else {
      toast.error(res.error ?? "Falha ao enviar.");
    }
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className="editor">
      <div className="field">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={8} maxLength={140} />
      </div>
      {!isBlog && (
        <div className="field">
          <Label htmlFor="type">Tipo</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="type" aria-label="Tipo do conteúdo" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="field">
        <Label htmlFor="cover">Imagem de capa {isBlog ? "" : "(opcional)"}</Label>
        <ImageUpload value={coverImage} onChange={setCoverImage} folder="covers" />
      </div>

      <div className="field">
        <Label htmlFor="body" id="body-label">Conteúdo</Label>
        <RichEditor value={initial?.doc} onChange={setDoc} />
      </div>

      {isProposal && (
        <div className="field">
          <Label htmlFor="edit-note">Justificativa da alteração</Label>
          <Textarea
            id="edit-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            minLength={10}
            maxLength={300}
            rows={3}
            placeholder={isAuthor ? "O que você mudou nesta versão?" : "Explique o que mudou e por quê — um moderador vai revisar antes de publicar."}
            aria-describedby="edit-note-hint"
          />
          <p id="edit-note-hint" className="muted text-sm">Obrigatório · 10–300 caracteres. Vai junto para a fila de moderação.</p>
        </div>
      )}

      <div className="btn-row">
        {isProposal ? (
          <Button type="button" onClick={onProposeEdit} disabled={pending || title.length < 8 || note.trim().length < 10}>
            {pending ? "Enviando…" : isAuthor ? "Enviar alteração para revisão" : "Enviar sugestão para revisão"}
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={onSaveDraft} disabled={pending || title.length < 8}>
              {pending ? "Salvando…" : "Salvar rascunho"}
            </Button>
            <Button type="button" onClick={onSubmitReview} disabled={pending || title.length < 8}>
              Enviar para revisão
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
