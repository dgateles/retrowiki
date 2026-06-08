import { Node, mergeAttributes } from "@tiptap/core";

// Container destacado (cartão). Conteúdo de blocos. Alternado com toggleWrap("box").
export const Box = Node.create({
  name: "box",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-box]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-box": "", class: "rte-box" }), 0];
  },
});

// Bloco oculto/revelável. Conteúdo de blocos. Alternado com toggleWrap("spoiler").
export const Spoiler = Node.create({
  name: "spoiler",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "div[data-spoiler]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-spoiler": "", class: "rte-spoiler" }), 0];
  },
});
