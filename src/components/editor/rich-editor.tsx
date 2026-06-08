"use client";

import { useState } from "react";
import { useEditor, EditorContent, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  List, ListOrdered, Quote, Code2, Minus, Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogTitle, DialogClose,
} from "@/components/ui/dialog";
import type { JSONContent } from "@tiptap/react";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active ? "true" : "false"}
      title={label}
      className={cn("rte__btn", active && "rte__btn--active")}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      block: e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : e.isActive("heading", { level: 4 })
              ? "h4"
              : "p",
    }),
  });

  function setBlock(v: string) {
    const chain = editor.chain().focus();
    if (v === "p") chain.setParagraph().run();
    else chain.toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 }).run();
  }

  function openLink() {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }
  function applyLink() {
    const href = linkUrl.trim();
    if (!href) editor.chain().focus().unsetLink().run();
    else if (editor.state.selection.empty)
      editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div className="rte__toolbar">
      <label className="sr-only" htmlFor="rte-block">Tipo de bloco</label>
      <select id="rte-block" className="rte__select" value={state.block} onChange={(e) => setBlock(e.target.value)}>
        <option value="p">Parágrafo</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
        <option value="h3">Título 3</option>
        <option value="h4">Título 4</option>
      </select>

      <span className="rte__sep" aria-hidden="true" />
      <ToolbarButton label="Negrito" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
      <ToolbarButton label="Itálico" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
      <ToolbarButton label="Sublinhado" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="size-4" /></ToolbarButton>
      <ToolbarButton label="Tachado" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToolbarButton>
      <ToolbarButton label="Código inline" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}><Code className="size-4" /></ToolbarButton>
      <ToolbarButton label="Link" active={state.link} onClick={openLink}><LinkIcon className="size-4" /></ToolbarButton>

      <span className="rte__sep" aria-hidden="true" />
      <ToolbarButton label="Lista com marcadores" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
      <ToolbarButton label="Lista numerada" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
      <ToolbarButton label="Citação" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></ToolbarButton>
      <ToolbarButton label="Bloco de código" active={state.codeBlock} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 className="size-4" /></ToolbarButton>
      <ToolbarButton label="Régua horizontal" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></ToolbarButton>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Inserir link</DialogTitle>
          <form
            className="form mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              applyLink();
            }}
          >
            <div className="field">
              <Label htmlFor="link-url">URL</Label>
              <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://exemplo.com" autoFocus />
            </div>
            <div className="modal-actions">
              <DialogClose asChild>
                <Button type="button" variant="ghost" size="sm">Cancelar</Button>
              </DialogClose>
              <Button type="submit" size="sm">{linkUrl.trim() ? "Aplicar" : "Remover"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RichEditor({
  value,
  onChange,
}: {
  value?: JSONContent;
  onChange: (doc: JSONContent) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "nofollow noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Escreva o conteúdo do guia…" }),
    ],
    content: value ?? "",
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
    editorProps: { attributes: { class: "rte__content", role: "textbox", "aria-multiline": "true", "aria-label": "Editor de conteúdo" } },
  });

  if (!editor) return <div className="rte"><div className="rte__content" /></div>;

  return (
    <div className="rte">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
