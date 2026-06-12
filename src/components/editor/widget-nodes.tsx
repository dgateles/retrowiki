"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import { Info, CheckCircle2, AlertTriangle, OctagonAlert, Plus, Trash2, Github } from "lucide-react";

// Nós-widget atômicos do editor rico. Espelham os blocos antigos (callout,
// steps, github-releases): guardam dados simples nos attrs e exibem um
// mini-formulário de edição. Texto puro, sem conteúdo rico aninhado.

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const VARIANTS = [
  { value: "info", label: "Informação", Icon: Info },
  { value: "success", label: "Sucesso", Icon: CheckCircle2 },
  { value: "warning", label: "Atenção", Icon: AlertTriangle },
  { value: "danger", label: "Perigo", Icon: OctagonAlert },
] as const;

// ── Callout ────────────────────────────────────────────────────────────────
function CalloutView({ node, updateAttributes }: ReactNodeViewProps) {
  const variant = (node.attrs.variant as string) || "info";
  const text = (node.attrs.text as string) || "";
  return (
    <NodeViewWrapper className={`rte-wgt rte-wgt--callout rte-wgt--callout-${variant}`}>
      <div className="rte-wgt__head" contentEditable={false}>
        <label className="rte-wgt__label">Alerta</label>
        <select
          className="rte-wgt__select"
          value={variant}
          aria-label="Tipo do alerta"
          onMouseDown={stop}
          onChange={(e) => updateAttributes({ variant: e.target.value })}
        >
          {VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </select>
      </div>
      <textarea
        className="rte-wgt__textarea"
        value={text}
        placeholder="Texto do alerta…"
        aria-label="Texto do alerta"
        rows={2}
        maxLength={2000}
        onMouseDown={stop}
        onKeyDown={stop}
        onPaste={stop}
        onChange={(e) => updateAttributes({ text: e.target.value })}
      />
    </NodeViewWrapper>
  );
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-variant") || "info",
        renderHTML: (a: { variant?: string }) => ({ "data-variant": a.variant || "info" }),
      },
      text: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-text") || "",
        renderHTML: (a: { text?: string }) => ({ "data-text": a.text || "" }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-callout": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },
});

// ── Steps ──────────────────────────────────────────────────────────────────
type Step = { title: string; text: string };

function StepsView({ node, updateAttributes }: ReactNodeViewProps) {
  const items: Step[] = Array.isArray(node.attrs.items) ? node.attrs.items : [];
  const setItems = (next: Step[]) => updateAttributes({ items: next });
  const update = (i: number, patch: Partial<Step>) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const add = () => setItems([...items, { title: "", text: "" }]);
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <NodeViewWrapper className="rte-wgt rte-wgt--steps" contentEditable={false}>
      <div className="rte-wgt__head">
        <label className="rte-wgt__label">Passos</label>
      </div>
      <ol className="rte-wgt__steps">
        {items.map((it, i) => (
          <li key={i} className="rte-wgt__step">
            <span className="rte-wgt__step-num" aria-hidden="true">{i + 1}</span>
            <div className="rte-wgt__step-fields">
              <input
                className="rte-wgt__input"
                value={it.title}
                placeholder="Título do passo"
                aria-label={`Título do passo ${i + 1}`}
                maxLength={160}
                onMouseDown={stop}
                onKeyDown={stop}
                onPaste={stop}
                onChange={(e) => update(i, { title: e.target.value })}
              />
              <textarea
                className="rte-wgt__textarea"
                value={it.text}
                placeholder="Detalhe (opcional)"
                aria-label={`Texto do passo ${i + 1}`}
                rows={2}
                maxLength={2000}
                onMouseDown={stop}
                onKeyDown={stop}
                onPaste={stop}
                onChange={(e) => update(i, { text: e.target.value })}
              />
            </div>
            <button
              type="button"
              className="rte-wgt__remove"
              aria-label={`Remover passo ${i + 1}`}
              onMouseDown={stop}
              onClick={() => remove(i)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      <button type="button" className="rte-wgt__add" onMouseDown={stop} onClick={add}>
        <Plus className="size-4" aria-hidden="true" /> Adicionar passo
      </button>
    </NodeViewWrapper>
  );
}

export const Steps = Node.create({
  name: "steps",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      items: {
        default: [] as Step[],
        parseHTML: (el: HTMLElement) => {
          try {
            return JSON.parse(el.getAttribute("data-items") || "[]");
          } catch {
            return [];
          }
        },
        renderHTML: (a: { items?: Step[] }) => ({ "data-items": JSON.stringify(a.items ?? []) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-steps]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-steps": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(StepsView);
  },
});

// ── GitHub Releases ──────────────────────────────────────────────────────────
function GithubReleasesView({ node, updateAttributes }: ReactNodeViewProps) {
  const owner = (node.attrs.owner as string) || "";
  const repo = (node.attrs.repo as string) || "";
  const limit = Number(node.attrs.limit) || 3;
  return (
    <NodeViewWrapper className="rte-wgt rte-wgt--gh" contentEditable={false}>
      <div className="rte-wgt__head">
        <Github className="size-4" aria-hidden="true" />
        <label className="rte-wgt__label">Releases do GitHub</label>
      </div>
      <div className="rte-wgt__gh-fields">
        <input
          className="rte-wgt__input"
          value={owner}
          placeholder="owner"
          aria-label="Dono do repositório (owner)"
          onMouseDown={stop}
          onKeyDown={stop}
          onChange={(e) => updateAttributes({ owner: e.target.value })}
        />
        <span aria-hidden="true">/</span>
        <input
          className="rte-wgt__input"
          value={repo}
          placeholder="repo"
          aria-label="Repositório (repo)"
          onMouseDown={stop}
          onKeyDown={stop}
          onChange={(e) => updateAttributes({ repo: e.target.value })}
        />
        <label className="rte-wgt__label" htmlFor="gh-limit">Qtd.</label>
        <input
          id="gh-limit"
          className="rte-wgt__input rte-wgt__input--num"
          type="number"
          min={1}
          max={5}
          value={limit}
          aria-label="Quantidade de releases"
          onMouseDown={stop}
          onKeyDown={stop}
          onChange={(e) => updateAttributes({ limit: Math.min(5, Math.max(1, Number(e.target.value) || 3)) })}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const GithubReleases = Node.create({
  name: "githubReleases",
  group: "block",
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      owner: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-owner") || "",
        renderHTML: (a: { owner?: string }) => ({ "data-owner": a.owner || "" }),
      },
      repo: {
        default: "",
        parseHTML: (el: HTMLElement) => el.getAttribute("data-repo") || "",
        renderHTML: (a: { repo?: string }) => ({ "data-repo": a.repo || "" }),
      },
      limit: {
        default: 3,
        parseHTML: (el: HTMLElement) => Number(el.getAttribute("data-limit")) || 3,
        renderHTML: (a: { limit?: number }) => ({ "data-limit": String(a.limit ?? 3) }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-github-releases]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-github-releases": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(GithubReleasesView);
  },
});
