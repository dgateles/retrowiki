"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type ReactNodeViewProps } from "@tiptap/react";
import { ChevronDown, ChevronRight, EyeOff } from "lucide-react";

// View React compartilhada para Box e Spoiler: campo de título + corpo editável.
// O Box tem o estado "recolhido por padrão" (display no conteúdo publicado).
function ContainerView({ node, updateAttributes }: ReactNodeViewProps) {
  const isSpoiler = node.type.name === "spoiler";
  const title = (node.attrs.title as string) ?? "";
  const collapsed = Boolean(node.attrs.collapsed);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper className={isSpoiler ? "rte-cv rte-cv--spoiler" : "rte-cv rte-cv--box"}>
      <div className="rte-cv__head" contentEditable={false}>
        {isSpoiler ? (
          <EyeOff className="rte-cv__icon" aria-hidden="true" />
        ) : (
          <button
            type="button"
            className="rte-cv__toggle"
            onMouseDown={stop}
            onClick={() => updateAttributes({ collapsed: !collapsed })}
            aria-label={collapsed ? "Não recolher por padrão" : "Recolher por padrão"}
            title={collapsed ? "Recolhido por padrão" : "Aberto por padrão"}
          >
            {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronDown className="size-4" aria-hidden="true" />}
          </button>
        )}
        <input
          className="rte-cv__title"
          value={title}
          placeholder={isSpoiler ? "Título do spoiler…" : "Título do box…"}
          aria-label="Título"
          onChange={(e) => updateAttributes({ title: e.target.value })}
          onMouseDown={stop}
          onKeyDown={stop}
          onPaste={stop}
        />
      </div>
      <NodeViewContent className="rte-cv__body" />
    </NodeViewWrapper>
  );
}

const titleAttr = {
  default: "",
  parseHTML: (el: HTMLElement) => el.getAttribute("data-title") || "",
  renderHTML: (attrs: { title?: string }) => (attrs.title ? { "data-title": attrs.title } : {}),
};

export const Box = Node.create({
  name: "box",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return {
      title: titleAttr,
      collapsed: {
        default: false,
        parseHTML: (el: HTMLElement) => el.getAttribute("data-collapsed") === "true",
        renderHTML: (attrs: { collapsed?: boolean }) => (attrs.collapsed ? { "data-collapsed": "true" } : {}),
      },
    };
  },
  parseHTML() {
    return [{ tag: "div[data-box]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-box": "", class: "rte-box" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContainerView);
  },
});

export const Spoiler = Node.create({
  name: "spoiler",
  group: "block",
  content: "block+",
  defining: true,
  addAttributes() {
    return { title: titleAttr };
  },
  parseHTML() {
    return [{ tag: "div[data-spoiler]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-spoiler": "", class: "rte-spoiler" }), 0];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ContainerView);
  },
});
