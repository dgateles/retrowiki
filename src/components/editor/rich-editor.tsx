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
  Rows3, Columns3, Grid2x2, Trash2, Pilcrow, ChevronDown, Check, Search as SearchIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Box, Spoiler } from "@/components/editor/box-node";
import { TEXT_COLORS, HIGHLIGHT_COLORS, FONT_SIZES, EMOJIS, CODE_LANGS } from "@/lib/editor/options";

function TBtn({ onClick, active, label, children }: { onClick: () => void; active?: boolean; label: string; children: React.ReactNode }) {
  // onMouseDown preventDefault: não tira o foco/seleção do editor ao clicar.
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
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

// Menu não-modal: não prende o foco nem bloqueia o resto da página, e o
// fechamento não rouba o foco do editor (o comando já reaplicou o foco).
function Menu({
  label,
  trigger,
  align = "start",
  contentClassName,
  children,
}: {
  label: string;
  trigger: React.ReactNode;
  align?: "start" | "end";
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={label} title={label} className="rte__btn" onMouseDown={(e) => e.preventDefault()}>
          {trigger}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={contentClassName} onCloseAutoFocus={(e) => e.preventDefault()}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const BLOCK_OPTS = [
  { v: "p", label: "Parágrafo" },
  { v: "h1", label: "Título 1" },
  { v: "h2", label: "Título 2" },
  { v: "h3", label: "Título 3" },
  { v: "h4", label: "Título 4" },
  { v: "h5", label: "Título 5" },
  { v: "h6", label: "Título 6" },
];

function BlockMenu({ value, onSet }: { value: string; onSet: (v: string) => void }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rte__blockbtn" aria-label="Tipo de bloco" title="Tipo de bloco" onMouseDown={(e) => e.preventDefault()}>
          <Pilcrow className="size-4" aria-hidden="true" />
          <ChevronDown className="size-3 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="rte-blockmenu" onCloseAutoFocus={(e) => e.preventDefault()}>
        {BLOCK_OPTS.map((o) => (
          <DropdownMenuItem
            key={o.v}
            onSelect={() => onSet(o.v)}
            className={cn("rte-blockopt", `rte-blockopt--${o.v}`, value === o.v && "rte-blockopt--active")}
          >
            {o.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmojiMenu({ onPick }: { onPick: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = term ? EMOJIS.filter((e) => e.n.includes(term)) : EMOJIS;
  function pick(c: string) {
    onPick(c);
    setOpen(false);
    setQ("");
  }
  return (
    <DropdownMenu open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ(""); }} modal={false}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="rte__btn" aria-label="Emoji" title="Emoji" onMouseDown={(e) => e.preventDefault()}>
          <Smile className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rte-emoji-pop" onCloseAutoFocus={(e) => e.preventDefault()}>
        <div className="rte-emoji-search">
          <SearchIcon className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Buscar emoji"
            aria-label="Buscar emoji"
            className="rte-emoji-input"
            autoFocus
          />
        </div>
        <div className="rte-emoji-grid">
          {list.length === 0 ? (
            <p className="rte-emoji-empty">Nenhum emoji.</p>
          ) : (
            list.map((e, i) => (
              <button key={`${e.c}-${i}`} type="button" className="rte-emoji-cell" title={e.n} onClick={() => pick(e.c)}>
                {e.c}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [imgOpen, setImgOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState("");
  const [imgAlt, setImgAlt] = useState("");

  const [tableDelOpen, setTableDelOpen] = useState(false);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      strike: e.isActive("strike"), code: e.isActive("code"), sub: e.isActive("subscript"),
      sup: e.isActive("superscript"), link: e.isActive("link"),
      inTable: e.isActive("table"), inCode: e.isActive("codeBlock"),
      codeLang: (e.getAttributes("codeBlock").language as string) ?? "",
      block: ([1, 2, 3, 4, 5, 6] as const).find((l) => e.isActive("heading", { level: l }))
        ? `h${([1, 2, 3, 4, 5, 6] as const).find((l) => e.isActive("heading", { level: l }))}`
        : "p",
    }),
  });

  const run = (fn: () => void) => fn();
  const chain = () => editor.chain().focus();

  function setBlock(v: string) {
    if (v === "p") chain().setParagraph().run();
    else chain().toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 | 4 | 5 | 6 }).run();
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
    <>
      <div className="rte__toolbar">
      <BlockMenu value={s.block} onSet={setBlock} />

      <Menu label="Inserir" trigger={<Plus className="size-4" />}>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleBulletList().run())}><List aria-hidden="true" /> Lista com marcadores</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleOrderedList().run())}><ListOrdered aria-hidden="true" /> Lista numerada</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleCodeBlock().run())}><Code2 aria-hidden="true" /> Bloco de código</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleWrap("box").run())}><SquareStack aria-hidden="true" /> Box</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleWrap("spoiler").run())}><EyeOff aria-hidden="true" /> Spoiler</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().toggleBlockquote().run())}><Quote aria-hidden="true" /> Citação</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().setHorizontalRule().run())}><Minus aria-hidden="true" /> Régua horizontal</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())}><TableIcon aria-hidden="true" /> Tabela</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setImgOpen(true)}><ImageIcon aria-hidden="true" /> Imagem</DropdownMenuItem>
      </Menu>

      <span className="rte__sep" aria-hidden="true" />
      <TBtn label="Negrito" active={s.bold} onClick={() => chain().toggleBold().run()}><Bold className="size-4" /></TBtn>
      <TBtn label="Itálico" active={s.italic} onClick={() => chain().toggleItalic().run()}><Italic className="size-4" /></TBtn>
      <TBtn label="Sublinhado" active={s.underline} onClick={() => chain().toggleUnderline().run()}><UnderlineIcon className="size-4" /></TBtn>
      <TBtn label="Tachado" active={s.strike} onClick={() => chain().toggleStrike().run()}><Strikethrough className="size-4" /></TBtn>
      <TBtn label="Código inline" active={s.code} onClick={() => chain().toggleCode().run()}><Code className="size-4" /></TBtn>

      <span className="rte__sep" aria-hidden="true" />
      <Menu label="Tamanho da fonte" trigger={<Type className="size-4" />}>
        {FONT_SIZES.map((fs) => (
          <DropdownMenuItem key={fs} onSelect={() => run(() => (fs === "100%" ? chain().unsetFontSize().run() : chain().setFontSize(fs).run()))}>
            {fs === "100%" ? "100% (padrão)" : fs}
          </DropdownMenuItem>
        ))}
      </Menu>

      <Menu label="Cor do texto" trigger={<Palette className="size-4" />}>
        {TEXT_COLORS.map((c) => (
          <DropdownMenuItem key={c.label} onSelect={() => run(() => (c.value ? chain().setColor(c.value).run() : chain().unsetColor().run()))}>
            <span className="rte-swatch" style={c.value ? { backgroundColor: c.value } : undefined} aria-hidden="true" /> {c.label}
          </DropdownMenuItem>
        ))}
      </Menu>

      <Menu label="Cor de destaque" trigger={<Highlighter className="size-4" />}>
        {HIGHLIGHT_COLORS.map((c) => (
          <DropdownMenuItem key={c.label} onSelect={() => run(() => (c.value ? chain().toggleHighlight({ color: c.value }).run() : chain().unsetHighlight().run()))}>
            <span className="rte-swatch" style={c.value ? { backgroundColor: c.value } : undefined} aria-hidden="true" /> {c.label}
          </DropdownMenuItem>
        ))}
      </Menu>

      <Menu label="Alinhamento" trigger={<AlignLeft className="size-4" />}>
        <DropdownMenuItem onSelect={() => run(() => chain().setTextAlign("left").run())}><AlignLeft aria-hidden="true" /> Esquerda</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().setTextAlign("center").run())}><AlignCenter aria-hidden="true" /> Centro</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().setTextAlign("right").run())}><AlignRight aria-hidden="true" /> Direita</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => run(() => chain().setTextAlign("justify").run())}><AlignJustify aria-hidden="true" /> Justificado</DropdownMenuItem>
      </Menu>

      <span className="rte__sep" aria-hidden="true" />
      <TBtn label="Subscrito" active={s.sub} onClick={() => chain().toggleSubscript().run()}><SubIcon className="size-4" /></TBtn>
      <TBtn label="Sobrescrito" active={s.sup} onClick={() => chain().toggleSuperscript().run()}><SupIcon className="size-4" /></TBtn>
      <TBtn label="Link" active={s.link} onClick={openLink}><LinkIcon className="size-4" /></TBtn>

      <EmojiMenu onPick={(c) => chain().insertContent(c).run()} />

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

      {s.inTable && (
        <div className="rte__toolbar rte__toolbar--ctx">
          <Menu label="Linhas" trigger={<Rows3 className="size-4" />}>
            <DropdownMenuItem onSelect={() => run(() => chain().addRowBefore().run())}>Inserir linha acima</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().addRowAfter().run())}>Inserir linha abaixo</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().deleteRow().run())}>Excluir linha</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().toggleHeaderRow().run())}>Alternar cabeçalho</DropdownMenuItem>
          </Menu>
          <Menu label="Colunas" trigger={<Columns3 className="size-4" />}>
            <DropdownMenuItem onSelect={() => run(() => chain().addColumnBefore().run())}>Inserir coluna antes</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().addColumnAfter().run())}>Inserir coluna depois</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().deleteColumn().run())}>Excluir coluna</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().toggleHeaderColumn().run())}>Alternar cabeçalho</DropdownMenuItem>
          </Menu>
          <Menu label="Célula" trigger={<Grid2x2 className="size-4" />}>
            <DropdownMenuItem onSelect={() => run(() => chain().mergeCells().run())}>Mesclar células</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().splitCell().run())}>Dividir célula</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => run(() => chain().toggleHeaderCell().run())}>Alternar célula de cabeçalho</DropdownMenuItem>
          </Menu>
          <TBtn label="Excluir tabela" onClick={() => setTableDelOpen(true)}><Trash2 className="size-4 text-destructive" /></TBtn>
        </div>
      )}

      {s.inCode && (
        <div className="rte__toolbar rte__toolbar--ctx">
          <label className="sr-only" htmlFor="rte-codelang">Linguagem do código</label>
          <select id="rte-codelang" className="rte__select" value={s.codeLang} onChange={(e) => chain().updateAttributes("codeBlock", { language: e.target.value }).run()}>
            {CODE_LANGS.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      )}

      <Dialog open={tableDelOpen} onOpenChange={setTableDelOpen}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir tabela</DialogTitle>
          <p className="muted mt-1">A tabela e todo o seu conteúdo serão removidos.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button type="button" variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button type="button" variant="destructive" size="sm" onClick={() => { chain().deleteTable().run(); setTableDelOpen(false); }}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RichEditor({ value, onChange }: { value?: JSONContent; onChange: (doc: JSONContent) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] }, link: false, underline: false }),
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
