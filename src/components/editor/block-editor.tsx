"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDraftAction, updateDraftAction, submitForReviewAction } from "@/lib/actions/article-actions";
import type { Block } from "@/lib/blocks/schema";

type EditorBlock =
  | { _id: string; type: "heading"; level: 2 | 3 | 4; text: string }
  | { _id: string; type: "paragraph"; text: string }
  | { _id: string; type: "callout"; variant: "info" | "success" | "warning" | "danger"; text: string }
  | { _id: string; type: "code"; code: string; lang: string }
  | { _id: string; type: "image"; url: string; alt: string }
  | { _id: string; type: "github-releases"; owner: string; repo: string; limit: number }
  | { _id: string; type: "device-spec"; deviceId: number }
  | { _id: string; type: "list"; ordered: boolean; itemsText: string }
  | { _id: string; type: "table"; headersText: string; rowsText: string }
  | { _id: string; type: "steps"; itemsText: string }
  | { _id: string; type: "store-links"; idsText: string };

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
    case "code":
      return { _id: uid(), type, code: "", lang: "" };
    case "image":
      return { _id: uid(), type, url: "", alt: "" };
    case "github-releases":
      return { _id: uid(), type, owner: "", repo: "", limit: 3 };
    case "device-spec":
      return { _id: uid(), type, deviceId: 0 };
    case "list":
      return { _id: uid(), type, ordered: false, itemsText: "" };
    case "table":
      return { _id: uid(), type, headersText: "", rowsText: "" };
    case "steps":
      return { _id: uid(), type, itemsText: "" };
    case "store-links":
      return { _id: uid(), type, idsText: "" };
  }
}

const ADD_BUTTONS: { type: EditorBlock["type"]; label: string }[] = [
  { type: "heading", label: "Título" },
  { type: "paragraph", label: "Parágrafo" },
  { type: "callout", label: "Alerta" },
  { type: "code", label: "Código" },
  { type: "image", label: "Imagem" },
  { type: "list", label: "Lista" },
  { type: "table", label: "Tabela" },
  { type: "steps", label: "Passos" },
  { type: "github-releases", label: "Releases do GitHub" },
  { type: "device-spec", label: "Ficha de device" },
  { type: "store-links", label: "Lojas" },
];

function fromBlockTree(blocks: Block[]): EditorBlock[] {
  return blocks.map((b): EditorBlock => {
    switch (b.type) {
      case "heading":
        return { _id: uid(), type: "heading", level: b.level, text: b.text };
      case "paragraph":
        return { _id: uid(), type: "paragraph", text: b.text };
      case "callout":
        return { _id: uid(), type: "callout", variant: b.variant, text: b.text };
      case "code":
        return { _id: uid(), type: "code", code: b.code, lang: b.lang ?? "" };
      case "image":
        return { _id: uid(), type: "image", url: b.url, alt: b.alt };
      case "github-releases":
        return { _id: uid(), type: "github-releases", owner: b.owner, repo: b.repo, limit: b.limit };
      case "device-spec":
        return { _id: uid(), type: "device-spec", deviceId: b.deviceId };
      case "list":
        return { _id: uid(), type: "list", ordered: b.ordered, itemsText: b.items.join("\n") };
      case "table":
        return {
          _id: uid(),
          type: "table",
          headersText: b.headers.join(" | "),
          rowsText: b.rows.map((r) => r.join(" | ")).join("\n"),
        };
      case "steps":
        return {
          _id: uid(),
          type: "steps",
          itemsText: b.items.map((i) => `${i.title} :: ${i.text}`).join("\n"),
        };
      case "store-links":
        return { _id: uid(), type: "store-links", idsText: b.storeIds.join(", ") };
    }
  });
}

type Initial = { articleId: number; title: string; type: (typeof TYPES)[number]["type"]; blocks: Block[] };

export function BlockEditor({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [type, setType] = useState<(typeof TYPES)[number]["type"]>(initial?.type ?? "tutorial");
  const [blocks, setBlocks] = useState<EditorBlock[]>(
    initial && initial.blocks.length ? fromBlockTree(initial.blocks) : [newBlock("paragraph")],
  );
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
    const out: unknown[] = [];
    for (const b of blocks) {
      if (b.type === "list") {
        const items = b.itemsText.split("\n").map((s) => s.trim()).filter(Boolean);
        if (items.length) out.push({ type: "list", ordered: b.ordered, items });
      } else if (b.type === "table") {
        const headers = b.headersText.split("|").map((s) => s.trim()).filter(Boolean);
        const rows = b.rowsText
          .split("\n")
          .map((r) => r.split("|").map((c) => c.trim()))
          .filter((r) => r.some(Boolean));
        if (headers.length && rows.length) out.push({ type: "table", headers, rows });
      } else if (b.type === "code") {
        if (b.code.trim()) {
          out.push({ type: "code", code: b.code, ...(b.lang.trim() ? { lang: b.lang.trim() } : {}) });
        }
      } else if (b.type === "steps") {
        const items = b.itemsText
          .split("\n")
          .map((l) => {
            const idx = l.indexOf("::");
            const title = (idx >= 0 ? l.slice(0, idx) : l).trim();
            const text = idx >= 0 ? l.slice(idx + 2).trim() : "";
            return { title, text };
          })
          .filter((it) => it.title);
        if (items.length) out.push({ type: "steps", items });
      } else if (b.type === "store-links") {
        const storeIds = b.idsText
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => Number.isInteger(n) && n > 0);
        if (storeIds.length) out.push({ type: "store-links", storeIds });
      } else {
        const { _id, ...rest } = b;
        void _id;
        out.push(rest);
      }
    }
    return { version: 1 as const, blocks: out };
  }

  async function ensureSaved(): Promise<number | null> {
    const body = toBlockTree();
    const payload = { title, type, deviceId: null, body };
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
        <select
          id="type"
          aria-label="Tipo do conteúdo"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="editor__select editor__select--full"
        >
          {TYPES.map((t) => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </select>
      </div>

      <fieldset className="editor__fieldset">
        <legend className="editor__legend">Conteúdo</legend>
        {blocks.map((b) => (
          <div key={b._id} className="editor__block">
            <div className="editor__block-head">
              <span className="editor__block-type">{b.type}</span>
              <div className="editor__block-actions">
                <Button type="button" size="icon" variant="ghost" onClick={() => move(b._id, -1)} aria-label="Mover para cima">
                  <ArrowUp className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => move(b._id, 1)} aria-label="Mover para baixo">
                  <ArrowDown className="size-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(b._id)} aria-label="Remover bloco">
                  <Trash2 className="icon-danger" />
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
                aria-label="Texto do parágrafo"
                rows={4}
                className="editor__control"
              />
            )}
            {b.type === "callout" && (
              <div className="space-y-2">
                <select
                  value={b.variant}
                  aria-label="Variante do alerta"
                  onChange={(e) => update(b._id, { variant: e.target.value as "info" })}
                  className="editor__select"
                >
                  <option value="info">Informação</option>
                  <option value="success">Sucesso</option>
                  <option value="warning">Atenção</option>
                  <option value="danger">Perigo</option>
                </select>
                <textarea
                  value={b.text}
                  onChange={(e) => update(b._id, { text: e.target.value })}
                  aria-label="Texto do alerta"
                  rows={2}
                  className="editor__control"
                />
              </div>
            )}
            {b.type === "code" && (
              <div className="space-y-2">
                <Input
                  value={b.lang}
                  onChange={(e) => update(b._id, { lang: e.target.value })}
                  placeholder="Linguagem (opcional, ex.: bash, json)"
                  aria-label="Linguagem do código"
                />
                <textarea
                  value={b.code}
                  onChange={(e) => update(b._id, { code: e.target.value })}
                  aria-label="Código"
                  rows={5}
                  spellCheck={false}
                  placeholder="Cole o código aqui"
                  className="editor__control editor__control--mono"
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
              <div className="editor__grid2">
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
                aria-label="ID do device"
              />
            )}
            {b.type === "list" && (
              <div className="space-y-2">
                <label className="editor__check">
                  <input
                    type="checkbox"
                    checked={b.ordered}
                    onChange={(e) => update(b._id, { ordered: e.target.checked })}
                  />
                  Lista numerada
                </label>
                <textarea
                  value={b.itemsText}
                  onChange={(e) => update(b._id, { itemsText: e.target.value })}
                  aria-label="Itens da lista, um por linha"
                  rows={4}
                  placeholder="Um item por linha"
                  className="editor__control"
                />
              </div>
            )}
            {b.type === "table" && (
              <div className="space-y-2">
                <Input
                  value={b.headersText}
                  onChange={(e) => update(b._id, { headersText: e.target.value })}
                  placeholder="Cabeçalhos separados por |  (ex.: Marca | Capacidade)"
                  aria-label="Cabeçalhos da tabela"
                />
                <textarea
                  value={b.rowsText}
                  onChange={(e) => update(b._id, { rowsText: e.target.value })}
                  aria-label="Linhas da tabela"
                  rows={4}
                  placeholder="Uma linha por linha, células separadas por |"
                  className="editor__control"
                />
              </div>
            )}
            {b.type === "steps" && (
              <textarea
                value={b.itemsText}
                onChange={(e) => update(b._id, { itemsText: e.target.value })}
                aria-label="Passos, um por linha no formato Título :: descrição"
                rows={4}
                placeholder="Um passo por linha: Título :: descrição"
                className="editor__control"
              />
            )}
            {b.type === "store-links" && (
              <Input
                value={b.idsText}
                onChange={(e) => update(b._id, { idsText: e.target.value })}
                placeholder="IDs das lojas separados por vírgula"
                aria-label="IDs das lojas"
              />
            )}
          </div>
        ))}
      </fieldset>

      <div className="editor__add">
        {ADD_BUTTONS.map((a) => (
          <Button key={a.type} type="button" variant="outline" size="sm" onClick={() => setBlocks((bs) => [...bs, newBlock(a.type)])}>
            <Plus className="size-4" /> {a.label}
          </Button>
        ))}
      </div>

      <div className="btn-row">
        <Button type="button" variant="outline" onClick={onSaveDraft} disabled={pending || title.length < 8}>
          {pending ? "Salvando…" : "Salvar rascunho"}
        </Button>
        <Button type="button" onClick={onSubmitReview} disabled={pending || title.length < 8 || blocks.length === 0}>
          Enviar para revisão
        </Button>
      </div>
    </form>
  );
}
