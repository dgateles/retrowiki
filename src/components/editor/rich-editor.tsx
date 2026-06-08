"use client";

import { useState } from "react";
import { useEditor, EditorContent, useEditorState, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TextStyle, Color, FontSize } from "@tiptap/extension-text-style";
import { Highlight } from "@tiptap/extension-highlight";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { Image } from "@tiptap/extension-image";
import {
  Plus, List, ListOrdered, Code2, SquareStack, EyeOff, Quote, Minus, Table as TableIcon, ImageIcon,
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, Subscript as SubIcon, Superscript as SupIcon,
  Type, Palette, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Smile, RemoveFormatting,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Box, Spoiler } from "@/lib/editor/nodes";
import { TEXT_COLORS, HIGHLIGHT_COLORS, FONT_SIZES, EMOJIS } from "@/lib/editor/options";

function TBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-pressed={active ? "true" : "false"} title={label} className={cn("rte__btn", active && "rte__btn--active")}>
      {children}
    </button>
  );
}

function MenuTrigger({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={label} title={label} className="rte__btn">{children}</button>
    </DropdownMenuTrigger>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      strike: e.isActive("strike"), code: e.isActive("code"), sub: e.isActive("subscript"),
      sup: e.isActive("superscript"), link: e.isActive("link"),
      block: e.isActive("heading", { level: 1 }) ? "h1" : e.isActive("heading", { level: 2 }) ? "h2"
        : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "p",
    }),
  });

  const chain = () => editor.chain().focus();

  function setBlock(v: string) {
    if (v === "p") chain().setParagraph().run();
    else chain().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 }).run();
  }
  function openLink() {
    setLinkUrl(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }
  function applyLink() {
    const href = linkUrl.trim();
    if (!href) chain().unsetLink().run();
    else if (editor.state.selection.empty) chain().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
    else chain().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }
  function applyImage() {
    const src = imgUrl.trim();
    if (src) chain().setImage({ src, alt: imgAlt.trim() || undefined }).run();
    setImgOpen(false);
    setImgUrl("");
    setImgAlt("");
  }

  return (
    <div className="rte__toolbar">
      <label className="sr-only" htmlFor="rte-block">Tipo de bloco</label>
      <select id="rte-block" className="rte__select" value={s.block} onChange={(e) => setBlock(e.target.value)}>
        <option value="p">Parágrafo</option>
        <option value="h1">Título 1</option>
        <option value="h2">Título 2</option>
        <option value="h3">Título 3</option>
        <option value="h4">Título 4</option>
      </select>

      <DropdownMenu>
        <MenuTrigger label="Inserir"><Plus className="size-4" /></MenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => chain().toggleBulletList().run()}><List aria-hidden="true" /> Lista com marcadores</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().toggleOrderedList().run()}><ListOrdered aria-hidden="true" /> Lista numerada</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().toggleCodeBlock().run()}><Code2 aria-hidden="true" /> Bloco de código</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().toggleWrap("box").run()}><SquareStack aria-hidden="true" /> Box</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().toggleWrap("spoiler").run()}><EyeOff aria-hidden="true" /> Spoiler</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().toggleBlockquote().run()}><Quote aria-hidden="true" /> Citação</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().setHorizontalRule().run()}><Minus aria-hidden="true" /> Régua horizontal</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon aria-hidden="true" /> Tabela</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setImgOpen(true)}><ImageIcon aria-hidden="true" /> Imagem</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="rte__sep" aria-hidden="true" />
      <TBtn label="Negrito" active={s.bold} onClick={() => chain().toggleBold().run()}><Bold className="size-4" /></TBtn>
      <TBtn label="Itálico" active={s.italic} onClick={() => chain().toggleItalic().run()}><Italic className="size-4" /></TBtn>
      <TBtn label="Sublinhado" active={s.underline} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon className="size-4" /></TBtn>
      <TBtn label="Tachado" active={s.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough className="size-4" /></TBtn>
      <TBtn label="Código inline" active={s.code} onClick={() => chain().toggleCode().run()}><Code className="size-4" /></TBtn>

      <span className="rte__sep" aria-hidden="true" />
      <DropdownMenu>
        <MenuTrigger label="Tamanho da fonte"><Type className="size-4" /></MenuTrigger>
        <DropdownMenuContent>
          {FONT_SIZES.map((fs) => (
            <DropdownMenuItem key={fs} onSelect={() => (fs === "100%" ? chain().unsetFontSize().run() : chain().setFontSize(fs).run())}>
              {fs === "100%" ? "100% (padrão)" : fs}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <MenuTrigger label="Cor do texto"><Palette className="size-4" /></MenuTrigger>
        <DropdownMenuContent>
          {TEXT_COLORS.map((c) => (
            <DropdownMenuItem key={c.label} onSelect={() => (c.value ? chain().setColor(c.value).run() : chain().unsetColor().run())}>
              <span className="rte-swatch" style={c.value ? { backgroundColor: c.value } : undefined} aria-hidden="true" /> {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <MenuTrigger label="Cor de destaque"><Highlighter className="size-4" /></MenuTrigger>
        <DropdownMenuContent>
          {HIGHLIGHT_COLORS.map((c) => (
            <DropdownMenuItem key={c.label} onSelect={() => (c.value ? chain().toggleHighlight({ color: c.value }).run() : chain().unsetHighlight().run())}>
              <span className="rte-swatch" style={c.value ? { backgroundColor: c.value } : undefined} aria-hidden="true" /> {c.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <MenuTrigger label="Alinhamento"><AlignLeft className="size-4" /></MenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => chain().setTextAlign("left").run()}><AlignLeft aria-hidden="true" /> Esquerda</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().setTextAlign("center").run()}><AlignCenter aria-hidden="true" /> Centro</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().setTextAlign("right").run()}><AlignRight aria-hidden="true" /> Direita</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => chain().setTextAlign("justify").run()}><AlignJustify aria-hidden="true" /> Justificado</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="rte__sep" aria-hidden="true" />
      <TBtn label="Subscrito" active={s.sub} onClick={() => chain().toggleSubscript().run()}><SubIcon className="size-4" /></TBtn>
      <TBtn label="Sobrescrito" active={s.sup} onClick={() => chain().toggleSuperscript().run()}><SupIcon className="size-4" /></TBtn>
      <TBtn label="Link" active={s.link} onClick={openLink}><LinkIcon className="size-4" /></TBtn>

      <DropdownMenu>
        <MenuTrigger label="Emoji"><Smile className="size-4" /></MenuTrigger>
        <DropdownMenuContent className="rte-emojis">
          {EMOJIS.map((e) => (
            <DropdownMenuItem key={e} className="rte-emoji" onSelect={() => chain().insertContent(e).run()}>{e}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <TBtn label="Limpar formatação" onClick={() => chain().unsetAllMarks().run()}><RemoveFormatting className="size-4" /></TBtn>

      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Inserir link</DialogTitle>
          <form className="form mt-4" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
            <div className="field">
              <Label htmlFor="link-url">URL</Label>
              <Input id="link-url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://exemplo.com" autoFocus />
            </div>
            <div className="modal-actions">
              <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
              <Button type="submit" size="sm">{linkUrl.trim() ? "Aplicar" : "Remover"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={imgOpen} onOpenChange={setImgOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Inserir imagem</DialogTitle>
          <form className="form mt-4" onSubmit={(e) => { e.preventDefault(); applyImage(); }}>
            <div className="field">
              <Label htmlFor="img-url">URL da imagem</Label>
              <Input id="img-url" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://…" autoFocus />
            </div>
            <div className="field">
              <Label htmlFor="img-alt">Texto alternativo</Label>
              <Input id="img-alt" value={imgAlt} onChange={(e) => setImgAlt(e.target.value)} />
            </div>
            <div className="modal-actions">
              <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
              <Button type="submit" size="sm" disabled={!imgUrl.trim()}>Inserir</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function RichEditor({ value, onChange }: { value?: JSONContent; onChange: (doc: JSONContent) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "nofollow noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Escreva o conteúdo do guia…" }),
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Image,
      Box,
      Spoiler,
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
