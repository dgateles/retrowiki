"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDraftAction, submitForReviewAction } from "@/lib/actions/article-actions";

type EditorBlock =
  | { _id: string; type: "heading"; level: 2 | 3 | 4; text: string }
  | { _id: string; type: "paragraph"; text: string }
  | { _id: string; type: "callout"; variant: "info" | "success" | "warning" | "danger"; text: string }
  | { _id: string; type: "image"; url: string; alt: string }
  | { _id: string; type: "github-releases"; owner: string; repo: string; limit: number }
  | { _id: string; type: "device-spec"; deviceId: number };

const TYPES = [
  { type: "tutorial", label: "Tutorial" },
  { type: "buying_guide", label: "Guia de compras" },
  { type: "troubleshooting", label: "Solução de problemas" },
  { type: "firmware", label: "Firmware" },
  { type: "general", label: "Geral" },
] as const;

let counter = 0;
const uid = () => `b${counter++}`;

function newBlock(type: EditorBlock["type"]): EditorBlock {
  switch (type) {
    case "heading":
      return { _id: uid(), type, level: 2, text: "" };
    case "paragraph":
      return { _id: uid(), type, text: "" };
    case "callout":
      return { _id: uid(), type, variant: "info", text: "" };
    case "image":
      return { _id: uid(), type, url: "", alt: "" };
    case "github-releases":
      return { _id: uid(), type, owner: "", repo: "", limit: 3 };
    case "device-spec":
      return { _id: uid(), type, deviceId: 0 };
  }
}

const ADD_BUTTONS: { type: EditorBlock["type"]; label: string }[] = [
  { type: "heading", label: "Título" },
  { type: "paragraph", label: "Parágrafo" },
  { type: "callout", label: "Alerta" },
  { type: "image", label: "Imagem" },
  { type: "github-releases", label: "Releases do GitHub" },
  { type: "device-spec", label: "Ficha de device" },
];

export function BlockEditor() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["type"]>("tutorial");
  const [blocks, setBlocks] = useState<EditorBlock[]>([newBlock("paragraph")]);
  const [pending, setPending] = useState(false);

  const update = (id: string, patch: Partial<EditorBlock>) =>
    setBlocks((bs) => bs.map((b) => (b._id === id ? ({ ...b, ...patch } as EditorBlock) : b)));
  const remove = (id: string) => setBlocks((bs) => bs.filter((b) => b._id !== id));
  const move = (id: string, dir: -1 | 1) =>
    setBlocks((bs) => {
      const i = bs.findIndex((b) => b._id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= bs.length) return bs;
      const copy = [...bs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  function toBlockTree() {
    return {
      version: 1 as const,
      blocks: blocks.map(({ _id, ...rest }) => rest),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const draft = await createDraftAction({ title, type, deviceId: null, body: toBlockTree() });
    if (!draft.ok || !draft.data) {
      setPending(false);
      toast.error(draft.error ?? "Falha ao salvar.");
      return;
    }
    const sub = await submitForReviewAction(draft.data.id);
    setPending(false);
    if (sub.ok) {
      toast.success("Enviado para revisão.");
      router.push("/guias");
    } else {
      toast.error(sub.error ?? "Falha ao enviar.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="title">Título</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={8} maxLength={140} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {TYPES.map((t) => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Conteúdo</legend>
        {blocks.map((b) => (
          <div key={b._id} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{b.type}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => move(b._id, -1)} aria-label="Mover para cima">
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => move(b._id, 1)} aria-label="Mover para baixo">
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(b._id)} aria-label="Remover bloco">
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </div>

            {b.type === "heading" && (
              <Input value={b.text} onChange={(e) => update(b._id, { text: e.target.value })} placeholder="Texto do título" />
            )}
            {b.type === "paragraph" && (
              <textarea
                value={b.text}
                onChange={(e) => update(b._id, { text: e.target.value })}
                placeholder="Escreva o parágrafo"
                rows={4}
                className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            )}
            {b.type === "callout" && (
              <div className="space-y-2">
                <select
                  value={b.variant}
                  onChange={(e) => update(b._id, { variant: e.target.value as "info" })}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="info">Informação</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Atenção</option>
                  <option value="danger">Perigo</option>
                </select>
                <textarea
                  value={b.text}
                  onChange={(e) => update(b._id, { text: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-input bg-background p-3 text-sm"
                />
              </div>
            )}
            {b.type === "image" && (
              <div className="space-y-2">
                <Input value={b.url} onChange={(e) => update(b._id, { url: e.target.value })} placeholder="URL da imagem" />
                <Input value={b.alt} onChange={(e) => update(b._id, { alt: e.target.value })} placeholder="Texto alternativo (obrigatório)" />
              </div>
            )}
            {b.type === "github-releases" && (
              <div className="grid grid-cols-2 gap-2">
                <Input value={b.owner} onChange={(e) => update(b._id, { owner: e.target.value })} placeholder="owner (ex.: ROCKNIX)" />
                <Input value={b.repo} onChange={(e) => update(b._id, { repo: e.target.value })} placeholder="repo (ex.: distribution)" />
              </div>
            )}
            {b.type === "device-spec" && (
              <Input
                type="number"
                value={b.deviceId || ""}
                onChange={(e) => update(b._id, { deviceId: Number(e.target.value) })}
                placeholder="ID do device"
              />
            )}
          </div>
        ))}
      </fieldset>

      <div className="flex flex-wrap gap-2">
        {ADD_BUTTONS.map((a) => (
          <Button key={a.type} type="button" variant="outline" size="sm" onClick={() => setBlocks((bs) => [...bs, newBlock(a.type)])}>
            <Plus className="size-4" /> {a.label}
          </Button>
        ))}
      </div>

      <Button type="submit" disabled={pending || !title || blocks.length === 0}>
        {pending ? "Enviando…" : "Salvar e enviar para revisão"}
      </Button>
    </form>
  );
}
