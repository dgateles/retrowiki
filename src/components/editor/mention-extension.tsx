"use client";

import Mention from "@tiptap/extension-mention";
import { ReactRenderer } from "@tiptap/react";
import { MentionList, type MentionListRef, type MentionItem } from "./mention-list";

async function fetchItems(query: string): Promise<MentionItem[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`/api/forum/mention-users?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = (await res.json()) as { users?: MentionItem[] };
    return (data.users ?? []).slice(0, 6);
  } catch {
    return [];
  }
}

/** Extensão de @menção com autocomplete posicionado (sem dependência de tippy). */
export const MentionExtension = Mention.configure({
  HTMLAttributes: { class: "rte-mention" },
  suggestion: {
    char: "@",
    items: ({ query }) => fetchItems(query),
    render: () => {
      let component: ReactRenderer<MentionListRef> | null = null;
      let wrapper: HTMLDivElement | null = null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      function place(props: any) {
        if (!wrapper || typeof props.clientRect !== "function") return;
        const rect = props.clientRect() as DOMRect | null;
        if (!rect) return;
        wrapper.style.position = "absolute";
        wrapper.style.left = `${rect.left + window.scrollX}px`;
        wrapper.style.top = `${rect.bottom + window.scrollY + 4}px`;
      }

      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStart(props: any) {
          component = new ReactRenderer(MentionList, { props, editor: props.editor });
          wrapper = document.createElement("div");
          wrapper.className = "rte-mention-anchor";
          wrapper.style.zIndex = "60";
          wrapper.appendChild(component.element);
          document.body.appendChild(wrapper);
          place(props);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onUpdate(props: any) {
          component?.updateProps(props);
          place(props);
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            wrapper?.remove();
            wrapper = null;
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },
        onExit() {
          wrapper?.remove();
          wrapper = null;
          component?.destroy();
          component = null;
        },
      };
    },
  },
});
