"use client";

import { useState, useRef, useEffect, Fragment, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, Heading, Type, ImageIcon, MousePointerClick, Minus, MoveVertical, Video, Megaphone, Rows3, Images, GripVertical, CreditCard, ListChecks, X, Copy, SlidersHorizontal, Monitor, Tablet, Smartphone, FileText, Download, HardDrive, ShoppingCart, Save, LayoutGrid, Undo2, Redo2, Eye, Gamepad2, Hash, ArrowLeftRight, List, Building2, Boxes, ChevronDown, Palette, ListTree, FileCode2 } from "lucide-react";
import type { JSONContent } from "@tiptap/react";
import { ICON_KEYS, ICON_LABELS } from "@/lib/page-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FX_EFFECTS, fxVal, type FxParams, type FxParamValue } from "@/lib/fx-effects";
import { ImageUpload } from "@/components/admin/image-upload";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { RichEditor } from "@/components/editor/rich-editor";
import { WidgetView, PageRenderer, SEC_BG, SEC_PADY, COL_BG, CONTAINER_BG, CONTAINER_PADY, CONTAINER_GAP, colFlex, sxClass } from "@/components/pages/page-renderer";
import { SectionFx } from "@/components/pages/fx-backgrounds";
import { savePageAction, deletePageAction, saveBlockAction, deleteBlockAction } from "@/lib/actions/page-actions";
import type { Layout, Widget, WidgetType, Section, Column, ContainerWidget, WidgetSx } from "@/lib/pages";

type SavedBlock = { id: number; name: string; layout: unknown };

const uid = () => Math.random().toString(36).slice(2, 10);

const WIDGETS: { type: WidgetType; label: string; icon: typeof Heading }[] = [
  { type: "heading", label: "Título", icon: Heading },
  { type: "text", label: "Texto", icon: Type },
  { type: "richtext", label: "Texto rico", icon: FileText },
  { type: "image", label: "Imagem", icon: ImageIcon },
  { type: "button", label: "Botão", icon: MousePointerClick },
  { type: "video", label: "Vídeo", icon: Video },
  { type: "callout", label: "Destaque", icon: Megaphone },
  { type: "accordion", label: "Acordeão", icon: Rows3 },
  { type: "gallery", label: "Galeria", icon: Images },
  { type: "card", label: "Cartão", icon: CreditCard },
  { type: "iconList", label: "Lista de ícones", icon: ListChecks },
  { type: "deviceGrid", label: "Grade de consoles", icon: Gamepad2 },
  { type: "dtbVault", label: "DTB Vault", icon: FileCode2 },
  { type: "numberTicker", label: "Contador", icon: Hash },
  { type: "marquee", label: "Marquee", icon: ArrowLeftRight },
  { type: "bento", label: "Bento Grid", icon: LayoutGrid },
  { type: "animatedList", label: "Lista animada", icon: List },
  { type: "logoCloud", label: "Logo Clouds", icon: Building2 },
  { type: "download", label: "Downloads", icon: Download },
  { type: "firmware", label: "Firmwares", icon: HardDrive },
  { type: "buyingGuide", label: "Guia de compra", icon: ShoppingCart },
  { type: "divider", label: "Divisor", icon: Minus },
  { type: "spacer", label: "Espaçador", icon: MoveVertical },
  { type: "container", label: "Container (estrutura)", icon: Boxes },
];

// Rótulo de um tipo de widget (para o editor aninhado do container).
const WIDGET_LABEL: Record<string, string> = Object.fromEntries(WIDGETS.map((x) => [x.type, x.label]));

// Presets de estrutura (colunas) — como o "Selecione sua estrutura" do Elementor.
// Qual preset bate com a distribuição de colunas atual (para destacar o ativo).
const spansEqual = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i]);

const STRUCTURE_PRESETS: { key: string; label: string; spans: number[] }[] = [
  { key: "1", label: "1 coluna", spans: [12] },
  { key: "2", label: "2 colunas (50/50)", spans: [6, 6] },
  { key: "37", label: "1/3 + 2/3", spans: [4, 8] },
  { key: "73", label: "2/3 + 1/3", spans: [8, 4] },
  { key: "3", label: "3 colunas", spans: [4, 4, 4] },
  { key: "4", label: "4 colunas", spans: [3, 3, 3, 3] },
];

function newWidget(type: WidgetType): Widget {
  switch (type) {
    case "heading": return { type: "heading", level: 2, text: "Novo título", align: "left", color: "default", fx: "none" };
    case "text": return { type: "text", text: "Escreva aqui o texto…", align: "left", color: "default" };
    case "richtext": return { type: "richtext", doc: { type: "doc", content: [{ type: "paragraph" }] } };
    case "image": return { type: "image", url: "", alt: "", caption: "", href: "" };
    case "button": return { type: "button", label: "Saiba mais", href: "/", variant: "primary", align: "left" };
    case "divider": return { type: "divider" };
    case "spacer": return { type: "spacer", size: "md" };
    case "video": return { type: "video", url: "" };
    case "callout": return { type: "callout", tone: "info", text: "Texto em destaque." };
    case "accordion": return { type: "accordion", items: [{ title: "Pergunta", body: "Resposta." }] };
    case "gallery": return { type: "gallery", columns: 3, images: [{ url: "", alt: "", href: "" }] };
    case "card": return { type: "card", image: "", title: "Título do cartão", text: "Descrição do cartão.", href: "", buttonLabel: "", effect: "none" };
    case "iconList": return { type: "iconList", items: [{ icon: "check", text: "Item da lista" }] };
    case "deviceGrid": return { type: "deviceGrid", title: "Consoles", titleLevel: "h2", titleColor: "default", titleFx: "none", titleAlign: "left", limit: 0, showAll: true };
    case "dtbVault": return { type: "dtbVault", title: "DTB Vault", titleLevel: "h2", titleColor: "default", titleFx: "none", titleAlign: "left", count: 5 };
    case "numberTicker": return { type: "numberTicker", value: 100, prefix: "", suffix: "+", label: "Membros", align: "center" };
    case "marquee": return { type: "marquee", items: [{ text: "RetroWiki" }, { text: "Emulação" }, { text: "Handhelds" }], reverse: false, pauseOnHover: true };
    case "bento": return { type: "bento", items: [{ icon: "check", title: "Recurso", description: "Descrição do recurso.", href: "", wide: false }] };
    case "animatedList": return { type: "animatedList", items: [{ icon: "check", title: "Notificação", description: "Detalhe da notificação." }] };
    case "logoCloud": return { type: "logoCloud", title: "", titleLevel: "p", titleColor: "default", titleFx: "none", titleAlign: "center", display: "grid", size: "lg", grayscale: true, items: [{ image: "", imageDark: "", alt: "", href: "" }] };
    case "download": return { type: "download", items: [{ name: "ArkOS", version: "1.0", url: "", size: "", date: "", changelogUrl: "", checksum: "" }] };
    case "firmware": return { type: "firmware", items: [{ name: "ArkOS", description: "", owner: "", repo: "", website: "", deprecated: false }] };
    case "buyingGuide": return { type: "buyingGuide", consoleName: "Console", priceRange: "", stores: [{ name: "Loja", description: "", href: "", trustLevel: "trusted", badge: "" }], accessories: [], tips: [] };
    case "container": return { type: "container", tag: "div", bg: "none", padY: "none", gap: "md", full: false, columns: [{ id: uid(), span: 12, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }] };
  }
}

// Linha de inserção do arraste: mostra onde o widget vai encaixar antes de
// soltar. Horizontal em colunas empilhadas; vertical quando lado a lado.
function DropLine({ row }: { row?: boolean }) {
  return <div className={cn("pb-dropline", row && "pb-dropline--v")} aria-hidden="true" />;
}

type PageInput = {
  id: number; title: string; slug: string; metaDescription: string;
  status: "draft" | "published"; showInMenu: boolean; menuOrder: number; noindex: boolean; isHome: boolean; layout: Layout;
};

const COL_SPAN: Record<number, string> = {
  1: "sm:col-span-1", 2: "sm:col-span-2", 3: "sm:col-span-3", 4: "sm:col-span-4",
  5: "sm:col-span-5", 6: "sm:col-span-6", 7: "sm:col-span-7", 8: "sm:col-span-8",
  9: "sm:col-span-9", 10: "sm:col-span-10", 11: "sm:col-span-11", 12: "sm:col-span-12",
};

// Distribui 12 colunas igualmente entre N colunas (resto nas primeiras).
function evenSpans(n: number): number[] {
  const base = Math.floor(12 / n);
  const rem = 12 - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
}

type Sel = { si: number; ci: number; wi: number };

// Caminho de "steps" que entra em containers aninhados. Resolve o array de
// colunas naquele ponto da árvore (para drop-into-container recursivo).
type Step = { ci: number; wi: number };
function colsAt(ss: Section[], si: number, steps: Step[]): Column[] | undefined {
  let cols: Column[] | undefined = ss[si]?.columns;
  for (const st of steps) {
    const w: Widget | undefined = cols?.[st.ci]?.widgets[st.wi];
    if (!w || w.type !== "container") return undefined;
    cols = w.columns;
  }
  return cols;
}

// Localização completa de um widget (section + caminho de containers + col/wi).
type WLoc = { si: number; steps: Step[]; ci: number; wi: number };
const stepsEq = (a: Step[], b: Step[]) => a.length === b.length && a.every((s, i) => s.ci === b[i].ci && s.wi === b[i].wi);
const sameWLoc = (a: WLoc, b: WLoc) => a.si === b.si && a.ci === b.ci && a.wi === b.wi && stepsEq(a.steps, b.steps);
const sameColumn = (a: WLoc, b: WLoc) => a.si === b.si && a.ci === b.ci && stepsEq(a.steps, b.steps);
// `to` está dentro do subtree de `from`? (impede mover um container pra dentro de si mesmo)
function isWithin(from: WLoc, to: WLoc): boolean {
  if (to.si !== from.si) return false;
  const prefix = [...from.steps, { ci: from.ci, wi: from.wi }];
  return to.steps.length >= prefix.length && prefix.every((s, i) => s.ci === to.steps[i].ci && s.wi === to.steps[i].wi);
}

export function PageBuilder({ page, blocks = [] }: { page: PageInput; blocks?: SavedBlock[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [metaDescription, setMeta] = useState(page.metaDescription);
  const [showInMenu, setShowInMenu] = useState(page.showInMenu);
  const [menuOrder, setMenuOrder] = useState(page.menuOrder);
  const [noindex, setNoindex] = useState(page.noindex);
  const [isHome, setIsHome] = useState(page.isHome);
  const [sections, setSections] = useState<Section[]>(page.layout.sections);
  const [selected, setSelected] = useState<Sel | null>(null);
  const [selSection, setSelSection] = useState<number | null>(null);
  const [selCol, setSelCol] = useState<{ si: number; ci: number } | null>(null);
  const [leftTab, setLeftTab] = useState<"elements" | "blocks" | "page">("elements");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [preview, setPreview] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [blockList, setBlockList] = useState<SavedBlock[]>(blocks);
  const [past, setPast] = useState<Section[][]>([]);
  const [future, setFuture] = useState<Section[][]>([]);
  const sectionsRef = useRef(sections);
  useEffect(() => { sectionsRef.current = sections; }, [sections]);

  function selectWidget(s: Sel) { setSelected(s); setSelSection(null); setSelCol(null); }
  function selectSection(si: number) { setSelSection(si); setSelected(null); setSelCol(null); }
  function selectCol(si: number, ci: number) { setSelCol({ si, ci }); setSelected(null); setSelSection(null); }
  function deselect() { setSelected(null); setSelSection(null); setSelCol(null); }
  const dragRef = useRef<WLoc | null>(null);
  const secDragRef = useRef<number | null>(null);
  const libDragRef = useRef<WidgetType | null>(null);
  const colDragRef = useRef<{ si: number; ci: number } | null>(null);
  const blockDragRef = useRef<unknown | null>(null);

  // Feedback visual do arraste: onde o widget vai encaixar (coluna + índice).
  // `dropHint` desenha a linha de inserção e realça a coluna alvo antes de soltar.
  const [dropHint, setDropHint] = useState<WLoc | null>(null);
  const hintRef = useRef<WLoc | null>(null);
  function setHint(loc: WLoc) {
    // só re-renderiza quando o alvo muda (dragover dispara continuamente).
    const h = hintRef.current;
    if (h && h.si === loc.si && h.ci === loc.ci && h.wi === loc.wi && stepsEq(h.steps, loc.steps)) return;
    hintRef.current = loc;
    setDropHint(loc);
  }
  function clearHint() { hintRef.current = null; setDropHint(null); }
  // Há um arraste de widget em curso (da biblioteca ou movendo um existente)?
  const widgetDragActive = () => !!(libDragRef.current || dragRef.current);
  function hintAt(loc: WLoc): boolean {
    const h = dropHint;
    return !!h && h.si === loc.si && h.ci === loc.ci && h.wi === loc.wi && stepsEq(h.steps, loc.steps);
  }

  // Drop numa posição: tile da biblioteca → novo widget; senão → move/reordena.
  function handleDrop(to: WLoc) {
    clearHint();
    if (libDragRef.current) {
      const type = libDragRef.current;
      libDragRef.current = null;
      mutate((ss) => { colsAt(ss, to.si, to.steps)?.[to.ci]?.widgets.splice(to.wi, 0, newWidget(type)); });
      if (to.steps.length === 0) selectWidget({ si: to.si, ci: to.ci, wi: to.wi });
      return;
    }
    dropWidget(to);
  }

  // Mutação com histórico (para desfazer/refazer).
  function mutate(fn: (s: Section[]) => void) {
    setSections((prev) => {
      setPast((p) => [...p, prev].slice(-100));
      setFuture([]);
      const next = structuredClone(prev) as Section[];
      fn(next);
      return next;
    });
  }

  // Mutação "ao vivo" sem registrar histórico (usada no arrasto de resize).
  function setLive(fn: (s: Section[]) => void) {
    setSections((prev) => { const next = structuredClone(prev) as Section[]; fn(next); return next; });
  }
  function pushHistory() { setPast((p) => [...p, sectionsRef.current].slice(-100)); setFuture([]); }

  function undo() {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setFuture((f) => [sectionsRef.current, ...f].slice(0, 100));
    setPast((p) => p.slice(0, -1));
    setSections(prev);
    deselect();
  }
  function redo() {
    if (future.length === 0) return;
    const next = future[0];
    setPast((p) => [...p, sectionsRef.current].slice(-100));
    setFuture((f) => f.slice(1));
    setSections(next);
    deselect();
  }

  // Arrastar-e-soltar de widgets: entre colunas, seções e containers (recursivo).
  function dropWidget(to: WLoc) {
    const from = dragRef.current;
    dragRef.current = null;
    if (!from) return;
    if (sameWLoc(from, to)) return;
    if (isWithin(from, to)) return; // não mover um container pra dentro de si mesmo
    mutate((ss) => {
      const fromCols = colsAt(ss, from.si, from.steps);
      const w = fromCols?.[from.ci]?.widgets.splice(from.wi, 1)[0];
      if (!w) return;
      // A remoção desloca os índices > from.wi na coluna de origem. Se o destino
      // passa por essa mesma coluna num índice posterior (ex.: mover um widget
      // para dentro de um container que está logo ABAIXO dele na coluna), o
      // caminho `to.steps` precisa ser corrigido — senão aponta pro lugar errado
      // e o widget some.
      const steps = to.steps.map((s) => ({ ...s }));
      if (to.si === from.si && to.steps.length > from.steps.length && stepsEq(to.steps.slice(0, from.steps.length), from.steps)) {
        const lvl = from.steps.length;
        if (steps[lvl].ci === from.ci && steps[lvl].wi > from.wi) steps[lvl].wi -= 1;
      }
      const toCols = colsAt(ss, to.si, steps);
      if (!toCols?.[to.ci]) return;
      let ti = to.wi;
      if (sameColumn(from, to) && from.wi < to.wi) ti -= 1;
      toCols[to.ci].widgets.splice(ti, 0, w);
    });
  }

  function dropSection(to: number) {
    const from = secDragRef.current;
    secDragRef.current = null;
    if (from === null || from === to) return;
    mutate((ss) => {
      const sec = ss.splice(from, 1)[0];
      ss.splice(from < to ? to - 1 : to, 0, sec);
    });
  }

  // Reordena colunas dentro da mesma seção.
  function dropColumn(toSi: number, toCi: number) {
    const from = colDragRef.current;
    colDragRef.current = null;
    if (!from || from.si !== toSi || from.ci === toCi) return;
    mutate((ss) => {
      const col = ss[toSi].columns.splice(from.ci, 1)[0];
      ss[toSi].columns.splice(from.ci < toCi ? toCi - 1 : toCi, 0, col);
    });
  }

  function dupWidget(si: number, ci: number, wi: number) {
    mutate((ss) => {
      const w = structuredClone(ss[si].columns[ci].widgets[wi]);
      ss[si].columns[ci].widgets.splice(wi + 1, 0, w);
    });
  }

  // Render do CONTAINER no canvas: cada coluna é uma drop-zone que aceita
  // widgets arrastados da paleta (em qualquer profundidade). Os widgets já
  // dentro renderizam via WidgetView; containers aninhados recursam.
  function renderContainerCanvas(w: ContainerWidget, si: number, steps: Step[], ci: number, wi: number): React.ReactNode {
    const myPath = [...steps, { ci, wi }];
    const Tag = w.tag;
    const boxed = w.bg !== "none";
    return (
      <Tag
        className={cn("page-container pb-container", CONTAINER_BG[w.bg], CONTAINER_PADY[w.padY], boxed && "rounded-lg px-4")}
        onClick={steps.length === 0 ? (e: React.MouseEvent) => { e.stopPropagation(); selectWidget({ si, ci, wi }); } : undefined}
      >
        <div className={cn("page-container__grid", CONTAINER_GAP[w.gap])}>
          {w.columns.map((c, k) => {
            const colActive = !!dropHint && dropHint.si === si && dropHint.ci === k && stepsEq(dropHint.steps, myPath);
            return (
            <div
              key={c.id}
              className={cn("page-col pb-subcol", COL_SPAN[c.span], colFlex(c), c.dir === "row" && "page-col--row", COL_BG[c.bg], colActive && "pb-subcol--drop")}
              onDragOver={(e) => { if (widgetDragActive()) { e.preventDefault(); e.stopPropagation(); setHint({ si, steps: myPath, ci: k, wi: c.widgets.length }); } }}
              onDrop={(e) => { if (!widgetDragActive()) return; e.preventDefault(); e.stopPropagation(); handleDrop({ si, steps: myPath, ci: k, wi: c.widgets.length }); }}
            >
              <span className="pb-subcol__tag" aria-hidden="true">col {k + 1} · {c.span}/12</span>
              {c.widgets.length === 0 && <div className={cn("pb-drop pb-drop--sm", colActive && "pb-drop--active")}>Arraste um elemento aqui</div>}
              {c.widgets.map((cw, cwi) => (
                <Fragment key={cwi}>
                  {hintAt({ si, steps: myPath, ci: k, wi: cwi }) && <DropLine row={c.dir === "row"} />}
                  <div
                    className={cn("pb-subel pb-subel--draggable", sxClass(cw.sx))}
                    draggable
                    onDragStart={(e) => { dragRef.current = { si, steps: myPath, ci: k, wi: cwi }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "w"); e.stopPropagation(); }}
                    onDragEnd={clearHint}
                    onDragOver={(e) => { if (widgetDragActive()) { e.preventDefault(); e.stopPropagation(); setHint({ si, steps: myPath, ci: k, wi: cwi }); } }}
                    onDrop={(e) => { if (!widgetDragActive()) return; e.preventDefault(); e.stopPropagation(); handleDrop({ si, steps: myPath, ci: k, wi: cwi }); }}
                  >
                    {cw.type === "container" ? renderContainerCanvas(cw, si, myPath, k, cwi) : <div className="pointer-events-none"><WidgetView w={cw} /></div>}
                  </div>
                </Fragment>
              ))}
              {c.widgets.length > 0 && hintAt({ si, steps: myPath, ci: k, wi: c.widgets.length }) && <DropLine row={c.dir === "row"} />}
            </div>
            );
          })}
        </div>
      </Tag>
    );
  }

  function dupSection(si: number) {
    mutate((ss) => {
      const clone = structuredClone(ss[si]) as Section;
      clone.id = uid();
      clone.columns.forEach((c) => { c.id = uid(); });
      ss.splice(si + 1, 0, clone);
    });
  }

  async function saveBlock(si: number) {
    const name = window.prompt("Nome do bloco:");
    if (!name || name.trim().length < 2) return;
    const layout = structuredClone(sections[si]);
    const res = await saveBlockAction(name.trim(), JSON.stringify(layout));
    if (res.ok && res.data) { toast.success("Bloco salvo."); setBlockList((prev) => [{ id: res.data!.id, name: name.trim(), layout }, ...prev]); }
    else toast.error(res.error ?? "Falha.");
  }

  function insertBlock(layout: unknown) {
    const sec = structuredClone(layout) as Section;
    sec.id = uid();
    sec.columns?.forEach((c) => { c.id = uid(); });
    mutate((ss) => { ss.push(sec); });
  }

  async function removeBlock(id: number) {
    const res = await deleteBlockAction(id);
    if (res.ok) { toast.success("Bloco excluído."); setBlockList((prev) => prev.filter((b) => b.id !== id)); }
    else toast.error(res.error ?? "Falha.");
  }

  // Redimensiona a divisória entre a coluna ci e ci+1 (mantém a soma do par),
  // encaixando na grade de 12.
  function startResize(si: number, ci: number, e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const sectionEl = (e.currentTarget as HTMLElement).closest(".page-section") as HTMLElement | null;
    if (!sectionEl) return;
    const sectionW = sectionEl.getBoundingClientRect().width || 1;
    const cols = sections[si].columns;
    const total = cols[ci].span + cols[ci + 1].span;
    const startX = e.clientX;
    const startSpan = cols[ci].span;
    const unit = sectionW / 12;
    setResizing(true);
    pushHistory(); // um único passo de undo para todo o arrasto
    const move = (ev: PointerEvent) => {
      const deltaUnits = Math.round((ev.clientX - startX) / unit);
      const left = Math.max(1, Math.min(total - 1, startSpan + deltaUnits));
      setLive((ss) => { ss[si].columns[ci].span = left; ss[si].columns[ci + 1].span = total - left; });
    };
    const up = () => {
      setResizing(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  async function save(publish?: boolean) {
    setPending(true);
    const payload = {
      title, slug, metaDescription,
      status: publish === undefined ? page.status : publish ? "published" : "draft",
      showInMenu, menuOrder, noindex, isHome,
      layout: { sections },
    };
    const res = await savePageAction(page.id, JSON.stringify(payload));
    setPending(false);
    if (res.ok) {
      toast.success(publish ? "Página publicada." : "Página salva.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha ao salvar.");
    }
  }

  async function remove() {
    if (!(await confirm({ title: "Excluir página", description: "Excluir esta página? Esta ação não pode ser desfeita.", confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deletePageAction(page.id);
    if (res.ok) { toast.success("Página excluída."); router.push("/admin/paginas"); }
    else toast.error(res.error ?? "Falha.");
  }

  // Adiciona um widget na coluna ativa (a do widget selecionado, ou a última) e
  // já o seleciona para edição no painel.
  function addWidget(type: WidgetType) {
    let target: Sel | null = null;
    setSections((prev) => {
      setPast((p) => [...p, prev].slice(-100));
      setFuture([]);
      const ss = structuredClone(prev) as Section[];
      if (ss.length === 0) ss.push({ id: uid(), bg: "none", fxParams: {}, full: false, padY: "none", anim: "none", gradFrom: "#10b981", gradTo: "#6366f1", columns: [{ id: uid(), span: 12, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }] });
      const si = selected && ss[selected.si] ? selected.si : ss.length - 1;
      const ci = selected && ss[si].columns[selected.ci] ? selected.ci : ss[si].columns.length - 1;
      const wi = ss[si].columns[ci].widgets.length;
      ss[si].columns[ci].widgets.push(newWidget(type));
      target = { si, ci, wi };
      return ss;
    });
    if (target) selectWidget(target);
  }

  // Atalhos: Ctrl/Cmd+Z desfaz, Ctrl/Cmd+Shift+Z (ou Ctrl+Y) refaz.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape" && preview) { setPreview(false); return; }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [past, future, preview]);

  const selWidget = selected && sections[selected.si]?.columns[selected.ci]?.widgets[selected.wi];

  // Navegador de estrutura (estilo Elementor): árvore seção → coluna → widget,
  // recursando em containers. Clicar seleciona o nó (nós aninhados selecionam o
  // container de nível superior, onde o editor inline daquele widget vive).
  function renderNavWidget(w: Widget, si: number, top: Sel, depth: number): ReactNode {
    const Icon = WIDGETS.find((x) => x.type === w.type)?.icon ?? Boxes;
    const isSel = depth === 0 && !!selected && selected.si === top.si && selected.ci === top.ci && selected.wi === top.wi;
    const label = w.type === "heading" || w.type === "text" ? (w as { text?: string }).text?.slice(0, 24) || WIDGET_LABEL[w.type] : WIDGET_LABEL[w.type] ?? w.type;
    return (
      <li key={`${depth}-${top.wi}-${w.type}`}>
        <button type="button" className={cn("pb-nav__item", isSel && "pb-nav__item--sel")} style={{ paddingLeft: depth * 14 + 10 }} onClick={() => selectWidget(top)}>
          <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </button>
        {w.type === "container" && (
          <ul className="pb-nav__sub">
            {w.columns.map((col, cci) => (
              <li key={col.id}>
                <span className="pb-nav__collabel" style={{ paddingLeft: (depth + 1) * 14 + 10 }}>Coluna {cci + 1} · {col.span}/12</span>
                <ul>{col.widgets.map((cw) => renderNavWidget(cw, si, top, depth + 1))}</ul>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className={cn("pb-fs", resizing && "pb-fs--resizing")}>
      {/* Painel flutuante: biblioteca / edição do widget / configurações */}
      <aside className="pb-fs__panel">
          {selWidget ? (
            <div className="pb-panel__edit">
              <div className="pb-panel__head">
                <button type="button" className="pb-panel__back" onClick={deselect}>← Elementos</button>
                <span className="pb-panel__title">{WIDGETS.find((x) => x.type === selWidget.type)?.label}</span>
              </div>
              <div className="pb-panel__scroll">
                <WidgetForm w={selWidget} onChange={(patch) => mutate((ss) => { Object.assign(ss[selected!.si].columns[selected!.ci].widgets[selected!.wi], patch); })} />
                <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => dupWidget(selected!.si, selected!.ci, selected!.wi)}>
                  <Copy className="size-4" /> Duplicar
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full text-destructive" onClick={() => { mutate((ss) => { ss[selected!.si].columns[selected!.ci].widgets.splice(selected!.wi, 1); }); deselect(); }}>
                  <Trash2 className="size-4" /> Excluir elemento
                </Button>
              </div>
            </div>
          ) : selSection !== null && sections[selSection] ? (
            <div className="pb-panel__edit">
              <div className="pb-panel__head">
                <button type="button" className="pb-panel__back" onClick={deselect}>← Elementos</button>
                <span className="pb-panel__title">Seção {selSection + 1}</span>
              </div>
              <div className="pb-panel__scroll">
                <div className="field">
                  <Label htmlFor="pb-bg">Fundo</Label>
                  <Select value={sections[selSection].bg} onValueChange={(val) => mutate((ss) => { ss[selSection].bg = val as Section["bg"]; ss[selSection].fxParams = {}; })}>
                    <SelectTrigger id="pb-bg" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="muted">Cinza suave</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="primary">Destaque (cor primária)</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="gradient">Gradiente animado</SelectItem>
                      <SelectItem value="particles">Partículas</SelectItem>
                      <SelectItem value="retrogrid">Retro Grid</SelectItem>
                      <SelectItem value="meteors">Meteoros</SelectItem>
                      <SelectItem value="dots">Dot Pattern</SelectItem>
                      <SelectItem value="ripple">Ripple</SelectItem>
                      <SelectItem value="flickering">Flickering Grid</SelectItem>
                      <SelectItem value="animgrid">Grade animada</SelectItem>
                      <SelectItem value="interactivegrid">Grade interativa</SelectItem>
                      <SelectItem value="hexagon">Hexágonos</SelectItem>
                      <SelectItem value="striped">Listras</SelectItem>
                      <SelectItem value="lightrays">Raios de luz</SelectItem>
                      {Object.entries(FX_EFFECTS).map(([key, e]) => <SelectItem key={key} value={key}>{e.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {FX_EFFECTS[sections[selSection].bg] && (
                  <FxControls
                    effect={sections[selSection].bg}
                    params={sections[selSection].fxParams ?? {}}
                    onChange={(key, value) => mutate((ss) => { ss[selSection].fxParams = { ...(ss[selSection].fxParams ?? {}), [key]: value }; })}
                  />
                )}
                {sections[selSection].bg === "gradient" && (
                  <div className="field">
                    <Label>Cores do gradiente</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" aria-label="Cor inicial" value={sections[selSection].gradFrom ?? "#10b981"} onChange={(e) => mutate((ss) => { ss[selSection].gradFrom = e.target.value; })} className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent" />
                      <input type="color" aria-label="Cor final" value={sections[selSection].gradTo ?? "#6366f1"} onChange={(e) => mutate((ss) => { ss[selSection].gradTo = e.target.value; })} className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent" />
                      <span className="h-9 flex-1 rounded-md border border-border" style={{ backgroundImage: `linear-gradient(120deg, ${sections[selSection].gradFrom ?? "#10b981"}, ${sections[selSection].gradTo ?? "#6366f1"})` }} aria-hidden="true" />
                    </div>
                  </div>
                )}
                <div className="field">
                  <Label htmlFor="pb-pady">Espaçamento vertical</Label>
                  <Select value={sections[selSection].padY} onValueChange={(val) => mutate((ss) => { ss[selSection].padY = val as Section["padY"]; })}>
                    <SelectTrigger id="pb-pady" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="sm">Pequeno</SelectItem>
                      <SelectItem value="md">Médio</SelectItem>
                      <SelectItem value="lg">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="field">
                  <Label>Estrutura (colunas)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {STRUCTURE_PRESETS.map((p) => {
                      const active = spansEqual(p.spans, sections[selSection].columns.map((c) => c.span));
                      return (
                      <button
                        key={p.key}
                        type="button"
                        title={p.label}
                        aria-label={p.label}
                        aria-pressed={active}
                        className={cn("rounded-md border p-1.5 transition-colors hover:border-primary hover:bg-accent", active ? "border-primary bg-primary/10" : "border-border")}
                        onClick={() => mutate((ss) => { const cur = ss[selSection].columns; ss[selSection].columns = p.spans.map((span, i) => cur[i] ? { ...cur[i], span } : { id: uid(), span, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }); })}
                      >
                        <div className="flex h-6 gap-0.5">
                          {p.spans.map((s, i) => <div key={i} className={cn("rounded-sm", active ? "bg-primary/60" : "bg-muted-foreground/40")} style={{ flexGrow: s }} />)}
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sections[selSection].full ?? false} onCheckedChange={(c) => mutate((ss) => { ss[selSection].full = c === true; })} /> Largura total (fundo ocupa a tela inteira)
                </label>
                <div className="field">
                  <Label htmlFor="pb-anim">Animação de entrada</Label>
                  <Select value={sections[selSection].anim ?? "none"} onValueChange={(val) => mutate((ss) => { ss[selSection].anim = val as Section["anim"]; })}>
                    <SelectTrigger id="pb-anim" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="up">Subir</SelectItem>
                      <SelectItem value="left">Da esquerda</SelectItem>
                      <SelectItem value="right">Da direita</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="blur">Desfoque (blur)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" variant="ghost" size="sm" className="mt-3 w-full" onClick={() => dupSection(selSection)}>
                  <Copy className="size-4" /> Duplicar seção
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => saveBlock(selSection)}>
                  <Save className="size-4" /> Salvar como bloco
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-full text-destructive" onClick={() => { mutate((ss) => { ss.splice(selSection, 1); }); deselect(); }}>
                  <Trash2 className="size-4" /> Excluir seção
                </Button>
              </div>
            </div>
          ) : selCol && sections[selCol.si]?.columns[selCol.ci] ? (
            <div className="pb-panel__edit">
              <div className="pb-panel__head">
                <button type="button" className="pb-panel__back" onClick={deselect}>← Elementos</button>
                <span className="pb-panel__title">Coluna ({sections[selCol.si].columns[selCol.ci].span}/12)</span>
              </div>
              <div className="pb-panel__scroll">
                <div className="field">
                  <Label htmlFor="pb-valign">Alinhamento vertical</Label>
                  <Select value={sections[selCol.si].columns[selCol.ci].valign} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].valign = val as Section["columns"][number]["valign"]; })}>
                    <SelectTrigger id="pb-valign" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Topo</SelectItem>
                      <SelectItem value="center">Centro</SelectItem>
                      <SelectItem value="bottom">Base</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="field">
                  <Label htmlFor="pb-colbg">Fundo da coluna</Label>
                  <Select value={sections[selCol.si].columns[selCol.ci].bg} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].bg = val as Section["columns"][number]["bg"]; })}>
                    <SelectTrigger id="pb-colbg" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="muted">Cinza suave</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="field">
                  <Label htmlFor="pb-coldir">Direção dos widgets</Label>
                  <Select value={sections[selCol.si].columns[selCol.ci].dir} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].dir = val as Section["columns"][number]["dir"]; })}>
                    <SelectTrigger id="pb-coldir" className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="col">Empilhado (um embaixo do outro)</SelectItem>
                      <SelectItem value="row">Lado a lado (na horizontal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="field">
                    <Label>Distribuição (eixo)</Label>
                    <Select value={sections[selCol.si].columns[selCol.ci].justify} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].justify = val as Section["columns"][number]["justify"]; })}>
                      <SelectTrigger aria-label="Distribuição" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">Início</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="end">Fim</SelectItem>
                        <SelectItem value="between">Espaçar (between)</SelectItem>
                        <SelectItem value="around">Ao redor (around)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="field">
                    <Label>Alinhamento (cruz.)</Label>
                    <Select value={sections[selCol.si].columns[selCol.ci].align} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].align = val as Section["columns"][number]["align"]; })}>
                      <SelectTrigger aria-label="Alinhamento cruzado" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stretch">Esticar</SelectItem>
                        <SelectItem value="start">Início</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="end">Fim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 items-end gap-2">
                  <div className="field">
                    <Label>Espaço (gap)</Label>
                    <Select value={sections[selCol.si].columns[selCol.ci].gap} onValueChange={(val) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].gap = val as Section["columns"][number]["gap"]; })}>
                      <SelectTrigger aria-label="Gap" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="none">Nenhum</SelectItem><SelectItem value="sm">Pequeno</SelectItem><SelectItem value="md">Médio</SelectItem><SelectItem value="lg">Grande</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 pb-2 text-sm">
                    <Checkbox checked={sections[selCol.si].columns[selCol.ci].wrap} onCheckedChange={(c) => mutate((ss) => { ss[selCol.si].columns[selCol.ci].wrap = c === true; })} /> Quebrar linha
                  </label>
                </div>
                {sections[selCol.si].columns.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" className="mt-3 w-full text-destructive" onClick={() => { mutate((ss) => { ss[selCol.si].columns.splice(selCol.ci, 1); const sp = evenSpans(ss[selCol.si].columns.length); ss[selCol.si].columns.forEach((c, idx) => { c.span = sp[idx]; }); }); deselect(); }}>
                    <Trash2 className="size-4" /> Excluir coluna
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="pb-panel__tabs">
                <button type="button" className={cn("pb-panel__tab", leftTab === "elements" && "pb-panel__tab--active")} onClick={() => setLeftTab("elements")}>Elementos</button>
                <button type="button" className={cn("pb-panel__tab", leftTab === "blocks" && "pb-panel__tab--active")} onClick={() => setLeftTab("blocks")}>Blocos</button>
                <button type="button" className={cn("pb-panel__tab", leftTab === "page" && "pb-panel__tab--active")} onClick={() => setLeftTab("page")}>Página</button>
              </div>
              <div className="pb-panel__scroll">
                {leftTab === "blocks" ? (
                  blockList.length === 0 ? (
                    <p className="muted text-sm">Nenhum bloco salvo. Selecione uma seção e use &quot;Salvar como bloco&quot;.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {blockList.map((b) => (
                        <div key={b.id} className="pb-block">
                          <button type="button" className="pb-block__add" title="Clique ou arraste para inserir" draggable onDragStart={(e) => { blockDragRef.current = b.layout; e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", "block"); }} onDragEnd={() => { blockDragRef.current = null; }} onClick={() => insertBlock(b.layout)}>
                            <LayoutGrid className="size-4" aria-hidden="true" /> <span className="truncate">{b.name}</span>
                          </button>
                          <button type="button" className="pb-icon pb-icon--danger" title="Excluir bloco" onClick={() => removeBlock(b.id)}><Trash2 className="size-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )
                ) : leftTab === "elements" ? (
                  <div className="pb-lib">
                    {WIDGETS.map((wt) => (
                      <button
                        key={wt.type}
                        type="button"
                        className="pb-lib__tile"
                        title={`Clique ou arraste para adicionar ${wt.label}`}
                        draggable
                        onDragStart={(e) => { libDragRef.current = wt.type; e.dataTransfer.effectAllowed = "copy"; e.dataTransfer.setData("text/plain", wt.type); }}
                        onDragEnd={() => { libDragRef.current = null; clearHint(); }}
                        onClick={() => addWidget(wt.type)}
                      >
                        <wt.icon className="size-5" aria-hidden="true" />
                        <span>{wt.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="field"><Label htmlFor="pg-title">Título</Label><Input id="pg-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} /></div>
                    <div className="field"><Label htmlFor="pg-slug">Slug (/p/…)</Label><Input id="pg-slug" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={120} /></div>
                    <div className="field"><Label htmlFor="pg-meta">Meta description</Label><Input id="pg-meta" value={metaDescription} onChange={(e) => setMeta(e.target.value)} maxLength={320} /></div>
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={showInMenu} onCheckedChange={(c) => setShowInMenu(c === true)} /> Mostrar no menu</label>
                    {showInMenu && <div className="field"><Label htmlFor="pg-order">Ordem no menu</Label><Input id="pg-order" type="number" value={menuOrder} onChange={(e) => setMenuOrder(Number(e.target.value) || 0)} className="w-24" /></div>}
                    <label className="flex items-center gap-2 text-sm"><Checkbox checked={noindex} onCheckedChange={(c) => setNoindex(c === true)} /> Não indexar (noindex)</label>
                    <div className="rounded-lg border border-border p-3">
                      <label className="flex items-center gap-2 text-sm font-medium"><Checkbox checked={isHome} onCheckedChange={(c) => setIsHome(c === true)} /> Usar como página inicial</label>
                      <p className="muted mt-1.5 text-xs">Quando publicada, esta página substitui a home estática em <code>/</code>. Apenas uma página pode ser a inicial.</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Navegador de estrutura (painel flutuante, alternável) */}
        {navOpen && (
          <aside className="pb-fs__nav" aria-label="Navegador de estrutura">
            <div className="pb-fs__nav-head">
              <span className="flex items-center gap-1.5 text-sm font-semibold"><ListTree className="size-4" aria-hidden="true" /> Navegador</span>
              <button type="button" className="pb-mini" title="Fechar navegador" onClick={() => setNavOpen(false)}><X className="size-3.5" /></button>
            </div>
            <div className="pb-fs__nav-body">
              {sections.length === 0 && <p className="muted p-3 text-sm">Sem elementos ainda.</p>}
              <ul className="pb-nav__tree">
                {sections.map((s, si) => (
                  <li key={s.id}>
                    <button type="button" className={cn("pb-nav__item pb-nav__item--sec", selSection === si && "pb-nav__item--sel")} onClick={() => selectSection(si)}>
                      <Boxes className="size-3.5 shrink-0" aria-hidden="true" /> <span className="truncate">Seção {si + 1}</span>
                    </button>
                    <ul className="pb-nav__sub">
                      {s.columns.map((c, ci) => (
                        <li key={c.id}>
                          <button type="button" className={cn("pb-nav__item pb-nav__item--col", selCol?.si === si && selCol?.ci === ci && "pb-nav__item--sel")} style={{ paddingLeft: 24 }} onClick={() => selectCol(si, ci)}>
                            <LayoutGrid className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> <span className="truncate">Coluna {ci + 1} · {c.span}/12</span>
                          </button>
                          <ul>{c.widgets.map((w, wi) => renderNavWidget(w, si, { si, ci, wi }, 0))}</ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Canvas (backdrop tela cheia) */}
        <div className="pb-fs__stage" onClick={deselect}>
          <div
            className={cn("pb-fs__page", `pb-dev--${device}`)}
            onClick={(e) => e.stopPropagation()}
            onDragOver={(e) => { if (blockDragRef.current) e.preventDefault(); }}
            onDrop={(e) => { if (blockDragRef.current) { e.preventDefault(); insertBlock(blockDragRef.current); blockDragRef.current = null; } }}
          >
            {sections.length === 0 && (
              <div className="pb-stage__empty">
                <p>Comece adicionando um elemento pelo painel à esquerda.</p>
              </div>
            )}

            {sections.map((s, si) => (
              <div
                key={s.id}
                className={cn("pb-sec", selSection === si && "pb-sec--selected")}
                onDragOver={(e) => { if (secDragRef.current !== null) e.preventDefault(); }}
                onDrop={(e) => { if (secDragRef.current !== null) { e.preventDefault(); dropSection(si); } }}
              >
                <div className="pb-sec__bar">
                  <span className="pb-sec__handle pb-handle" title="Arrastar seção" draggable onDragStart={(e) => { secDragRef.current = si; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "s"); }}><GripVertical className="size-3.5" /></span>
                  <button type="button" className="pb-mini" title="Configurar seção" onClick={(e) => { e.stopPropagation(); selectSection(si); }}><SlidersHorizontal className="size-3.5" /></button>
                  {s.columns.length < 4 && <button type="button" className="pb-mini" title="Adicionar coluna" onClick={() => mutate((ss) => { ss[si].columns.push({ id: uid(), span: 6, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }); const sp = evenSpans(ss[si].columns.length); ss[si].columns.forEach((col, idx) => { col.span = sp[idx]; }); })}><Plus className="size-3.5" /></button>}
                  <button type="button" className="pb-mini" title="Duplicar seção" onClick={() => dupSection(si)}><Copy className="size-3.5" /></button>
                  <button type="button" className="pb-mini" title="Mover acima" disabled={si === 0} onClick={() => mutate((ss) => { [ss[si - 1], ss[si]] = [ss[si], ss[si - 1]]; })}><ArrowUp className="size-3.5" /></button>
                  <button type="button" className="pb-mini" title="Mover abaixo" disabled={si === sections.length - 1} onClick={() => mutate((ss) => { [ss[si + 1], ss[si]] = [ss[si], ss[si + 1]]; })}><ArrowDown className="size-3.5" /></button>
                  <button type="button" className="pb-mini pb-mini--danger" title="Excluir seção" onClick={() => mutate((ss) => { ss.splice(si, 1); })}><Trash2 className="size-3.5" /></button>
                </div>

                <div className={cn(SEC_BG[s.bg], SEC_PADY[s.padY])} style={s.bg === "gradient" ? { backgroundImage: `linear-gradient(120deg, ${s.gradFrom ?? "#10b981"}, ${s.gradTo ?? "#6366f1"})` } : undefined}>
                <div className="page-sec__fx" aria-hidden="true"><SectionFx bg={s.bg} params={s.fxParams} /></div>
                <div className="page-section">
                  {s.columns.map((c, ci) => {
                    const colActive = !!dropHint && dropHint.si === si && dropHint.ci === ci && dropHint.steps.length === 0;
                    return (
                    <div
                      key={c.id}
                      className={cn("page-col pb-colwrap", COL_SPAN[c.span], colFlex(c), c.dir === "row" && "page-col--row", COL_BG[c.bg], selCol?.si === si && selCol?.ci === ci && "pb-colwrap--selected", colActive && "pb-colwrap--drop")}
                      onDragOver={(e) => { if (colDragRef.current) { e.preventDefault(); } else if (widgetDragActive()) { e.preventDefault(); setHint({ si, steps: [], ci, wi: c.widgets.length }); } }}
                      onDrop={(e) => { e.preventDefault(); if (colDragRef.current) { dropColumn(si, ci); } else { handleDrop({ si, steps: [], ci, wi: c.widgets.length }); } }}
                    >
                      <div className="pb-colwrap__bar">
                        {s.columns.length > 1 && <span className="pb-handle pb-colwrap__drag" title="Arrastar coluna" draggable onDragStart={(e) => { colDragRef.current = { si, ci }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "c"); }} onDragEnd={() => { colDragRef.current = null; }}><GripVertical className="size-3" /></span>}
                        <span className="pb-colwrap__span" title="Largura na grade de 12">{c.span}/12</span>
                        <button type="button" className="pb-mini" title="Configurar coluna" onClick={(e) => { e.stopPropagation(); selectCol(si, ci); }}><SlidersHorizontal className="size-3" /></button>
                        {s.columns.length > 1 && <button type="button" className="pb-mini pb-mini--danger" title="Excluir coluna" onClick={() => mutate((ss) => { ss[si].columns.splice(ci, 1); const sp = evenSpans(ss[si].columns.length); ss[si].columns.forEach((col, idx) => { col.span = sp[idx]; }); })}><Trash2 className="size-3" /></button>}
                      </div>

                      {c.widgets.map((w, wi) => {
                        const isSel = selected?.si === si && selected?.ci === ci && selected?.wi === wi;
                        return (
                          <Fragment key={wi}>
                            {hintAt({ si, steps: [], ci, wi }) && <DropLine row={c.dir === "row"} />}
                            <div
                              className={cn("pb-el", isSel && "pb-el--selected")}
                              onClick={(e) => { e.stopPropagation(); selectWidget({ si, ci, wi }); }}
                              onDragOver={(e) => { if (widgetDragActive()) { e.preventDefault(); e.stopPropagation(); setHint({ si, steps: [], ci, wi }); } }}
                              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop({ si, steps: [], ci, wi }); }}
                            >
                              <span className="pb-el__bar">
                                <span className="pb-el__handle pb-handle" title="Arrastar" draggable onDragStart={(e) => { dragRef.current = { si, steps: [], ci, wi }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "w"); }} onDragEnd={clearHint}><GripVertical className="size-3" /></span>
                                <button type="button" className="pb-mini" title="Duplicar" onClick={(e) => { e.stopPropagation(); dupWidget(si, ci, wi); }}><Copy className="size-3" /></button>
                                <button type="button" className="pb-mini pb-mini--danger" title="Excluir" onClick={(e) => { e.stopPropagation(); mutate((ss) => { ss[si].columns[ci].widgets.splice(wi, 1); }); if (isSel) deselect(); }}><Trash2 className="size-3" /></button>
                              </span>
                              <div className={cn("pb-el__content", sxClass(w.sx))}>{w.type === "container" ? renderContainerCanvas(w, si, [], ci, wi) : <WidgetView w={w} />}</div>
                            </div>
                          </Fragment>
                        );
                      })}

                      {c.widgets.length > 0 && hintAt({ si, steps: [], ci, wi: c.widgets.length }) && <DropLine row={c.dir === "row"} />}

                      {c.widgets.length === 0 && <div className={cn("pb-drop", colActive && "pb-drop--active")}>Solte um elemento aqui</div>}

                      {ci < s.columns.length - 1 && (
                        <span className="pb-resize" title="Arraste para redimensionar" onPointerDown={(e) => startResize(si, ci, e)} onClick={(e) => e.stopPropagation()} />
                      )}
                    </div>
                    );
                  })}
                </div>
                </div>
              </div>
            ))}

            <button type="button" className="pb-addsec" onClick={() => mutate((ss) => { ss.push({ id: uid(), bg: "none", fxParams: {}, full: false, padY: "none", anim: "none", gradFrom: "#10b981", gradTo: "#6366f1", columns: [{ id: uid(), span: 12, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }] }); })}>
              <Plus className="size-4" aria-hidden="true" /> Adicionar seção
            </button>
          </div>
        </div>

        {/* Barra flutuante superior */}
        <div className="pb-fs__bar">
          <Link href="/admin/paginas" className="pb-fs__exit" title="Sair do editor"><X className="size-4" aria-hidden="true" /></Link>
          <span className="pb-dev-toggle" role="group" aria-label="Histórico">
            <button type="button" className="pb-mini" title="Desfazer (Ctrl+Z)" disabled={past.length === 0} onClick={undo}><Undo2 className="size-4" /></button>
            <button type="button" className="pb-mini" title="Refazer (Ctrl+Shift+Z)" disabled={future.length === 0} onClick={redo}><Redo2 className="size-4" /></button>
          </span>
          <button type="button" className={cn("pb-mini", navOpen && "pb-mini--on")} title="Navegador de estrutura" aria-pressed={navOpen} onClick={() => setNavOpen((v) => !v)}><ListTree className="size-4" /></button>
          <span className="pb-fs__bartitle">{title || "Sem título"}</span>
          <span className="pb-dev-toggle" role="group" aria-label="Pré-visualização responsiva">
            <button type="button" className={cn("pb-mini", device === "desktop" && "pb-mini--on")} title="Desktop" onClick={() => setDevice("desktop")}><Monitor className="size-4" /></button>
            <button type="button" className={cn("pb-mini", device === "tablet" && "pb-mini--on")} title="Tablet" onClick={() => setDevice("tablet")}><Tablet className="size-4" /></button>
            <button type="button" className={cn("pb-mini", device === "mobile" && "pb-mini--on")} title="Celular" onClick={() => setDevice("mobile")}><Smartphone className="size-4" /></button>
          </span>
          <span className={`status-pill status-pill--${page.status === "published" ? "published" : "draft"}`}>{page.status === "published" ? "Publicada" : "Rascunho"}</span>
          <span className="ml-1 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreview(true)}><Eye className="size-4" /> Prévia</Button>
            <Button type="button" variant="ghost" size="sm" onClick={remove}>Excluir</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => save(false)} disabled={pending}>Salvar</Button>
            <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>{pending ? "…" : "Publicar"}</Button>
          </span>
        </div>

        {/* Prévia: renderiza a página como ficará publicada, sem o chrome do editor */}
        {preview && (
          <div className="pb-preview" role="dialog" aria-modal="true" aria-label="Prévia da página">
            <div className="pb-preview__bar">
              <span className="pb-preview__title">Prévia — {title || "Sem título"}</span>
              <span className="pb-dev-toggle" role="group" aria-label="Pré-visualização responsiva">
                <button type="button" className={cn("pb-mini", device === "desktop" && "pb-mini--on")} title="Desktop" onClick={() => setDevice("desktop")}><Monitor className="size-4" /></button>
                <button type="button" className={cn("pb-mini", device === "tablet" && "pb-mini--on")} title="Tablet" onClick={() => setDevice("tablet")}><Tablet className="size-4" /></button>
                <button type="button" className={cn("pb-mini", device === "mobile" && "pb-mini--on")} title="Celular" onClick={() => setDevice("mobile")}><Smartphone className="size-4" /></button>
              </span>
              <Button type="button" variant="outline" size="sm" onClick={() => setPreview(false)}><X className="size-4" /> Fechar prévia</Button>
            </div>
            <div className="pb-preview__scroll">
              <div className={cn("pb-preview__frame", `pb-dev--${device}`)}>
                <main className="page">
                  <h1 className="page__title">{title || "Sem título"}</h1>
                  <div className="mt-6">
                    <PageRenderer layout={{ sections }} />
                  </div>
                </main>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

/** Painel de controles customizáveis de um efeito de fundo (React Bits). */
function FxControls({ effect, params, onChange }: { effect: string; params: FxParams; onChange: (key: string, value: FxParamValue) => void }) {
  const def = FX_EFFECTS[effect];
  if (!def) return null;
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-semibold text-muted-foreground">Personalizar {def.label}</p>
      <div className="flex flex-col gap-3">
        {def.controls.map((ctl) => {
          const val = fxVal(effect, params, ctl.key);
          if (ctl.type === "color") {
            const v = typeof val === "string" ? val : ctl.default;
            return (
              <div key={ctl.key} className="flex items-center justify-between gap-2">
                <Label className="text-sm">{ctl.label}</Label>
                <input type="color" aria-label={ctl.label} value={v} onChange={(e) => onChange(ctl.key, e.target.value)} className="h-8 w-10 shrink-0 cursor-pointer rounded-md border border-border bg-transparent" />
              </div>
            );
          }
          if (ctl.type === "toggle") {
            return (
              <label key={ctl.key} className="flex items-center justify-between gap-2 text-sm">
                {ctl.label}
                <Switch checked={Boolean(val)} onCheckedChange={(c) => onChange(ctl.key, c)} />
              </label>
            );
          }
          if (ctl.type === "select") {
            return (
              <div key={ctl.key} className="field">
                <Label className="text-sm">{ctl.label}</Label>
                <Select value={typeof val === "string" ? val : ctl.default} onValueChange={(v) => onChange(ctl.key, v)}>
                  <SelectTrigger aria-label={ctl.label} className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{ctl.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            );
          }
          // slider
          const num = typeof val === "number" ? val : ctl.default;
          return (
            <div key={ctl.key} className="field">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{ctl.label}</Label>
                <span className="font-mono text-xs text-muted-foreground">{num}</span>
              </div>
              <Slider value={[num]} min={ctl.min} max={ctl.max} step={ctl.step} onValueChange={([v]) => onChange(ctl.key, v)} aria-label={ctl.label} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WidgetForm({ w, onChange }: { w: Widget; onChange: (patch: Partial<Widget>) => void }) {
  const align = (
    <div className="field">
      <Label>Alinhamento</Label>
      <Select value={(w as { align?: string }).align ?? "left"} onValueChange={(val) => onChange({ align: val } as Partial<Widget>)}>
        <SelectTrigger aria-label="Alinhamento" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="left">Esquerda</SelectItem>
          <SelectItem value="center">Centro</SelectItem>
          <SelectItem value="right">Direita</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  const color = (
    <div className="field">
      <Label>Cor</Label>
      <Select value={(w as { color?: string }).color ?? "default"} onValueChange={(val) => onChange({ color: val } as Partial<Widget>)}>
        <SelectTrigger aria-label="Cor" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Padrão</SelectItem>
          <SelectItem value="muted">Suave</SelectItem>
          <SelectItem value="primary">Primária</SelectItem>
          <SelectItem value="success">Verde</SelectItem>
          <SelectItem value="warn">Âmbar</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
  // Controles do título de um widget (nível semântico, cor, animação).
  const titleControls = (
    <>
      <div className="field"><Label>Nível do título</Label>
        <Select value={(w as { titleLevel?: string }).titleLevel ?? "p"} onValueChange={(val) => onChange({ titleLevel: val } as Partial<Widget>)}>
          <SelectTrigger aria-label="Nível do título" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Parágrafo</SelectItem>
            <SelectItem value="h2">Título (H2)</SelectItem>
            <SelectItem value="h3">Subtítulo (H3)</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
            <SelectItem value="h5">H5</SelectItem>
            <SelectItem value="h6">H6</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="field"><Label>Alinhamento do título</Label>
        <Select value={(w as { titleAlign?: string }).titleAlign ?? "left"} onValueChange={(val) => onChange({ titleAlign: val } as Partial<Widget>)}>
          <SelectTrigger aria-label="Alinhamento do título" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="field"><Label>Cor do título</Label>
        <Select value={(w as { titleColor?: string }).titleColor ?? "default"} onValueChange={(val) => onChange({ titleColor: val } as Partial<Widget>)}>
          <SelectTrigger aria-label="Cor do título" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            <SelectItem value="muted">Suave</SelectItem>
            <SelectItem value="primary">Primária</SelectItem>
            <SelectItem value="success">Verde</SelectItem>
            <SelectItem value="warn">Âmbar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="field"><Label>Animação do título</Label>
        <Select value={(w as { titleFx?: string }).titleFx ?? "none"} onValueChange={(val) => onChange({ titleFx: val } as Partial<Widget>)}>
          <SelectTrigger aria-label="Animação do título" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma</SelectItem>
            <SelectItem value="gradient">Gradiente animado</SelectItem>
            <SelectItem value="aurora">Aurora</SelectItem>
            <SelectItem value="shiny">Brilho</SelectItem>
            <SelectItem value="textanimate">Revelar</SelectItem>
            <SelectItem value="typing">Digitando</SelectItem>
            <SelectItem value="lineshadow">Sombra</SelectItem>
            <SelectItem value="hyper">Hyper</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  return (
    <div className="pb-form">
      {w.type === "heading" && (
        <>
          <div className="field"><Label>Texto</Label><Input value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Nível</Label>
            <Select value={String(w.level)} onValueChange={(val) => onChange({ level: Number(val) as 2 | 3 | 4 })}>
              <SelectTrigger aria-label="Nível" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="2">Título (H2)</SelectItem><SelectItem value="3">Subtítulo (H3)</SelectItem><SelectItem value="4">Menor (H4)</SelectItem></SelectContent>
            </Select>
          </div>
          {align}
          {color}
          <div className="field"><Label>Efeito de texto</Label>
            <Select value={(w as { fx?: string }).fx ?? "none"} onValueChange={(val) => onChange({ fx: val } as Partial<Widget>)}>
              <SelectTrigger aria-label="Efeito de texto" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="gradient">Gradiente animado</SelectItem>
                <SelectItem value="aurora">Aurora</SelectItem>
                <SelectItem value="shiny">Brilho (shiny)</SelectItem>
                <SelectItem value="textanimate">Animar por palavra</SelectItem>
                <SelectItem value="typing">Digitação</SelectItem>
                <SelectItem value="lineshadow">Sombra de linha</SelectItem>
                <SelectItem value="hyper">Hyper (embaralhar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {w.type === "text" && (
        <>
          <div className="field"><Label>Texto</Label><Textarea value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={5000} rows={5} /></div>
          {align}
          {color}
        </>
      )}
      {w.type === "richtext" && (
        <div className="field">
          <Label>Conteúdo</Label>
          <RichEditor value={w.doc as JSONContent} onChange={(doc) => onChange({ doc } as Partial<Widget>)} />
        </div>
      )}
      {w.type === "image" && (
        <>
          <div className="field"><Label>Imagem</Label><ImageUpload value={w.url} onChange={(url) => onChange({ url })} folder="pages" /></div>
          <div className="field"><Label>Texto alternativo</Label><Input value={w.alt} onChange={(e) => onChange({ alt: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Legenda</Label><Input value={w.caption} onChange={(e) => onChange({ caption: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Link (opcional)</Label><Input value={w.href ?? ""} onChange={(e) => onChange({ href: e.target.value })} placeholder="/guias ou https://…" maxLength={500} /></div>
        </>
      )}
      {w.type === "button" && (
        <>
          <div className="field"><Label>Texto do botão</Label><Input value={w.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={80} /></div>
          <div className="field"><Label>Link (URL ou /caminho)</Label><Input value={w.href} onChange={(e) => onChange({ href: e.target.value })} maxLength={500} /></div>
          <div className="field"><Label>Estilo</Label>
            <Select value={w.variant} onValueChange={(val) => onChange({ variant: val as "primary" | "outline" | "rainbow" })}>
              <SelectTrigger aria-label="Estilo" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="primary">Preenchido</SelectItem><SelectItem value="outline">Contorno</SelectItem><SelectItem value="rainbow">Arco-íris</SelectItem></SelectContent>
            </Select>
          </div>
          {align}
        </>
      )}
      {w.type === "spacer" && (
        <div className="field"><Label>Tamanho</Label>
          <Select value={w.size} onValueChange={(val) => onChange({ size: val as "sm" | "md" | "lg" })}>
            <SelectTrigger aria-label="Tamanho" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="sm">Pequeno</SelectItem><SelectItem value="md">Médio</SelectItem><SelectItem value="lg">Grande</SelectItem></SelectContent>
          </Select>
        </div>
      )}
      {w.type === "video" && (
        <div className="field"><Label>URL do YouTube ou Vimeo</Label><Input value={w.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://youtu.be/…" maxLength={500} /></div>
      )}
      {w.type === "callout" && (
        <>
          <div className="field"><Label>Tom</Label>
            <Select value={w.tone} onValueChange={(val) => onChange({ tone: val as "info" | "warn" | "success" })}>
              <SelectTrigger aria-label="Tom" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="info">Informação</SelectItem><SelectItem value="warn">Atenção</SelectItem><SelectItem value="success">Sucesso</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="field"><Label>Texto</Label><Textarea value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={2000} rows={3} /></div>
        </>
      )}
      {w.type === "accordion" && (
        <div className="field">
          <Label>Itens</Label>
          {w.items.map((it, i) => (
            <div key={i} className="pb-acc-item">
              <div className="flex items-center gap-2">
                <Input value={it.title} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Título" maxLength={200} />
                {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover item" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
              <Textarea className="mt-1" value={it.body} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, body: e.target.value } : x) })} placeholder="Conteúdo" maxLength={3000} rows={2} />
            </div>
          ))}
          {w.items.length < 15 && (
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { title: "Novo item", body: "Conteúdo." }] })}><Plus className="size-3.5" /> Adicionar item</button>
          )}
        </div>
      )}
      {w.type === "gallery" && (
        <>
          <div className="field"><Label>Colunas</Label>
            <Select value={String(w.columns)} onValueChange={(val) => onChange({ columns: Number(val) as 2 | 3 | 4 })}>
              <SelectTrigger aria-label="Colunas" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="2">2</SelectItem><SelectItem value="3">3</SelectItem><SelectItem value="4">4</SelectItem></SelectContent>
            </Select>
          </div>
          {w.images.map((im, i) => (
            <div key={i} className="pb-acc-item">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Imagem {i + 1}</Label>
                {w.images.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ images: w.images.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
              <ImageUpload value={im.url} onChange={(url) => onChange({ images: w.images.map((x, j) => j === i ? { ...x, url } : x) })} folder="pages" />
              <Input className="mt-1" value={im.alt} onChange={(e) => onChange({ images: w.images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} placeholder="Texto alternativo" maxLength={200} />
              <Input className="mt-1" value={(im as { href?: string }).href ?? ""} onChange={(e) => onChange({ images: w.images.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} placeholder="Link (opcional)" maxLength={500} />
            </div>
          ))}
          {w.images.length < 24 && (
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ images: [...w.images, { url: "", alt: "", href: "" }] })}><Plus className="size-3.5" /> Adicionar imagem</button>
          )}
        </>
      )}
      {w.type === "card" && (
        <>
          <div className="field"><Label>Imagem (opcional)</Label><ImageUpload value={w.image} onChange={(image) => onChange({ image })} folder="pages" /></div>
          <div className="field"><Label>Título</Label><Input value={w.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Texto</Label><Textarea value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={2000} rows={3} /></div>
          <div className="field"><Label>Link do botão (opcional)</Label><Input value={w.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="/guias" maxLength={500} /></div>
          <div className="field"><Label>Texto do botão (opcional)</Label><Input value={w.buttonLabel} onChange={(e) => onChange({ buttonLabel: e.target.value })} maxLength={80} /></div>
          <div className="field"><Label>Efeito da borda</Label>
            <Select value={(w as { effect?: string }).effect ?? "none"} onValueChange={(val) => onChange({ effect: val } as Partial<Widget>)}>
              <SelectTrigger aria-label="Efeito da borda" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="beam">Feixe (Border Beam)</SelectItem>
                <SelectItem value="shine">Brilho (Shine Border)</SelectItem>
                <SelectItem value="magic">Magic Card (spotlight)</SelectItem>
                <SelectItem value="glare">Glare (reflexo no hover)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
      {w.type === "numberTicker" && (
        <>
          <div className="field"><Label>Valor</Label><Input type="number" min={0} value={w.value} onChange={(e) => onChange({ value: Math.max(0, Number(e.target.value) || 0) })} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="field"><Label>Prefixo</Label><Input value={w.prefix} onChange={(e) => onChange({ prefix: e.target.value })} maxLength={8} placeholder="R$" /></div>
            <div className="field"><Label>Sufixo</Label><Input value={w.suffix} onChange={(e) => onChange({ suffix: e.target.value })} maxLength={8} placeholder="+" /></div>
          </div>
          <div className="field"><Label>Legenda</Label><Input value={w.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={80} placeholder="Membros" /></div>
          {align}
        </>
      )}
      {w.type === "marquee" && (
        <>
          <div className="field">
            <Label>Itens (texto)</Label>
            {w.items.map((it, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={it.text} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { text: e.target.value } : x) })} maxLength={120} />
                {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
            ))}
            {w.items.length < 30 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { text: "Novo item" }] })}><Plus className="size-3.5" /> Adicionar item</button>}
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={w.reverse} onCheckedChange={(c) => onChange({ reverse: c === true })} /> Inverter direção</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={w.pauseOnHover} onCheckedChange={(c) => onChange({ pauseOnHover: c === true })} /> Pausar ao passar o mouse</label>
        </>
      )}
      {w.type === "bento" && (
        <div className="field">
          <Label>Cartões</Label>
          {w.items.map((it, i) => (
            <div key={i} className="pb-acc-item space-y-2">
              <div className="flex items-center gap-2">
                <Select value={it.icon} onValueChange={(val) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, icon: val as typeof ICON_KEYS[number] } : x) })}>
                  <SelectTrigger aria-label="Ícone" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{ICON_KEYS.map((k) => <SelectItem key={k} value={k}>{ICON_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
                {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
              <Input value={it.title} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Título" maxLength={120} />
              <Textarea value={it.description} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} placeholder="Descrição" rows={2} maxLength={300} />
              <Input value={it.href} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} placeholder="Link (opcional)" maxLength={500} />
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={it.wide} onCheckedChange={(c) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, wide: c === true } : x) })} /> Cartão largo</label>
            </div>
          ))}
          {w.items.length < 12 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { icon: "check", title: "Recurso", description: "", href: "", wide: false }] })}><Plus className="size-3.5" /> Adicionar cartão</button>}
        </div>
      )}
      {w.type === "animatedList" && (
        <div className="field">
          <Label>Itens</Label>
          {w.items.map((it, i) => (
            <div key={i} className="pb-acc-item space-y-2">
              <div className="flex items-center gap-2">
                <Select value={it.icon} onValueChange={(val) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, icon: val as typeof ICON_KEYS[number] } : x) })}>
                  <SelectTrigger aria-label="Ícone" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{ICON_KEYS.map((k) => <SelectItem key={k} value={k}>{ICON_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
                {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
              <Input value={it.title} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} placeholder="Título" maxLength={120} />
              <Input value={it.description} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} placeholder="Descrição" maxLength={200} />
            </div>
          ))}
          {w.items.length < 20 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { icon: "check", title: "Notificação", description: "" }] })}><Plus className="size-3.5" /> Adicionar item</button>}
        </div>
      )}
      {w.type === "logoCloud" && (
        <>
          <div className="field"><Label>Título (opcional)</Label><Input value={w.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={120} placeholder="Parceiros" /></div>
          {titleControls}
          <div className="field">
            <Label>Exibição</Label>
            <Select value={w.display} onValueChange={(val) => onChange({ display: val as "grid" | "marquee" })}>
              <SelectTrigger aria-label="Exibição" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Grade</SelectItem>
                <SelectItem value="marquee">Marquee (rolagem)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label>Tamanho dos logos</Label>
            <Select value={(w as { size?: string }).size ?? "lg"} onValueChange={(val) => onChange({ size: val } as Partial<Widget>)}>
              <SelectTrigger aria-label="Tamanho dos logos" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sm">Pequeno</SelectItem>
                <SelectItem value="md">Médio</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
                <SelectItem value="xl">Extra grande</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={w.grayscale} onCheckedChange={(c) => onChange({ grayscale: c === true })} /> Escala de cinza (colore ao passar o mouse)</label>
          <div className="field">
            <Label>Logos</Label>
            {w.items.map((it, i) => (
              <div key={i} className="pb-acc-item space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Logo {i + 1}</span>
                  {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
                </div>
                <span className="text-[11px] text-muted-foreground">Logo (tema claro)</span>
                <ImageUpload value={it.image} onChange={(image) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, image } : x) })} folder="pages" />
                <span className="text-[11px] text-muted-foreground">Logo (tema escuro, opcional)</span>
                <ImageUpload value={it.imageDark ?? ""} onChange={(imageDark) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, imageDark } : x) })} folder="pages" />
                <Input value={it.alt} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} placeholder="Nome / alt" maxLength={120} />
                <Input value={it.href} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} placeholder="Link (opcional)" maxLength={500} />
              </div>
            ))}
            {w.items.length < 24 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { image: "", imageDark: "", alt: "", href: "" }] })}><Plus className="size-3.5" /> Adicionar logo</button>}
          </div>
        </>
      )}
      {w.type === "iconList" && (
        <div className="field">
          <Label>Itens</Label>
          {w.items.map((it, i) => (
            <div key={i} className="pb-acc-item">
              <div className="flex items-center gap-2">
                <Select value={it.icon} onValueChange={(val) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, icon: val as typeof ICON_KEYS[number] } : x) })}>
                  <SelectTrigger aria-label="Ícone" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{ICON_KEYS.map((k) => <SelectItem key={k} value={k}>{ICON_LABELS[k]}</SelectItem>)}</SelectContent>
                </Select>
                <Input value={it.text} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} placeholder="Texto" maxLength={300} />
                {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
            </div>
          ))}
          {w.items.length < 15 && (
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { icon: "check", text: "Novo item" }] })}><Plus className="size-3.5" /> Adicionar item</button>
          )}
        </div>
      )}
      {w.type === "deviceGrid" && (
        <div className="flex flex-col gap-3">
          <div className="field">
            <Label htmlFor="dg-title">Título da seção</Label>
            <Input id="dg-title" value={w.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={120} placeholder="Consoles" />
          </div>
          {titleControls}
          <div className="field">
            <Label htmlFor="dg-limit">Limite de consoles</Label>
            <Input id="dg-limit" type="number" min={0} max={48} value={w.limit} onChange={(e) => onChange({ limit: Math.max(0, Math.min(48, Number(e.target.value) || 0)) })} className="w-28" />
            <p className="muted text-xs">0 = mostrar todos.</p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={w.showAll} onCheckedChange={(c) => onChange({ showAll: c === true })} /> Mostrar link &quot;Ver todos&quot;
          </label>
        </div>
      )}
      {w.type === "dtbVault" && (
        <div className="flex flex-col gap-3">
          <div className="field">
            <Label htmlFor="dtb-title">Título da seção</Label>
            <Input id="dtb-title" value={w.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={120} placeholder="DTB Vault" />
          </div>
          {titleControls}
          <div className="field">
            <Label htmlFor="dtb-count">Quantos arquivos</Label>
            <Input id="dtb-count" type="number" min={1} max={10} value={w.count} onChange={(e) => onChange({ count: Math.max(1, Math.min(10, Number(e.target.value) || 5)) })} className="w-28" />
            <p className="muted text-xs">Os últimos enviados ao DTB Vault (1–10).</p>
          </div>
        </div>
      )}
      {w.type === "download" && (
        <div className="field">
          <Label>Downloads</Label>
          {w.items.map((it, i) => {
            const set = (patch: Partial<typeof it>) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, ...patch } : x) });
            return (
              <div key={i} className="pb-acc-item">
                <div className="flex items-center gap-2">
                  <Input value={it.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome" maxLength={120} />
                  <Input value={it.version} onChange={(e) => set({ version: e.target.value })} placeholder="Versão" className="w-24" maxLength={40} />
                  {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
                </div>
                <Input className="mt-1" value={it.url} onChange={(e) => set({ url: e.target.value })} placeholder="URL do download" maxLength={500} />
                <div className="mt-1 flex gap-2">
                  <Input value={it.size} onChange={(e) => set({ size: e.target.value })} placeholder="Tamanho" maxLength={40} />
                  <Input value={it.date} onChange={(e) => set({ date: e.target.value })} placeholder="Data" maxLength={40} />
                </div>
                <Input className="mt-1" value={it.changelogUrl} onChange={(e) => set({ changelogUrl: e.target.value })} placeholder="URL do changelog (opcional)" maxLength={500} />
                <Input className="mt-1" value={it.checksum} onChange={(e) => set({ checksum: e.target.value })} placeholder="SHA256 (opcional)" maxLength={200} />
              </div>
            );
          })}
          {w.items.length < 40 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { name: "Novo", version: "", url: "", size: "", date: "", changelogUrl: "", checksum: "" }] })}><Plus className="size-3.5" /> Adicionar download</button>}
        </div>
      )}
      {w.type === "firmware" && (
        <div className="field">
          <Label>Firmwares</Label>
          {w.items.map((it, i) => {
            const set = (patch: Partial<typeof it>) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, ...patch } : x) });
            return (
              <div key={i} className="pb-acc-item">
                <div className="flex items-center gap-2">
                  <Input value={it.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nome" maxLength={120} />
                  {w.items.length > 1 && <button type="button" className="pb-icon pb-icon--danger" onClick={() => onChange({ items: w.items.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
                </div>
                <Input className="mt-1" value={it.description} onChange={(e) => set({ description: e.target.value })} placeholder="Descrição" maxLength={300} />
                <div className="mt-1 flex gap-2">
                  <Input value={it.owner} onChange={(e) => set({ owner: e.target.value })} placeholder="GitHub owner" maxLength={80} />
                  <Input value={it.repo} onChange={(e) => set({ repo: e.target.value })} placeholder="repo" maxLength={120} />
                </div>
                <Input className="mt-1" value={it.website} onChange={(e) => set({ website: e.target.value })} placeholder="Site (se não for GitHub)" maxLength={500} />
                <label className="mt-1 flex items-center gap-2 text-sm"><Checkbox checked={it.deprecated} onCheckedChange={(c) => set({ deprecated: c === true })} /> Obsoleto</label>
              </div>
            );
          })}
          {w.items.length < 40 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ items: [...w.items, { name: "Novo", description: "", owner: "", repo: "", website: "", deprecated: false }] })}><Plus className="size-3.5" /> Adicionar firmware</button>}
        </div>
      )}
      {w.type === "buyingGuide" && (
        <>
          <div className="field"><Label>Console</Label><Input value={w.consoleName} onChange={(e) => onChange({ consoleName: e.target.value })} maxLength={120} /></div>
          <div className="field"><Label>Faixa de preço</Label><Input value={w.priceRange} onChange={(e) => onChange({ priceRange: e.target.value })} placeholder="Ex.: R$ 600–800" maxLength={80} /></div>
          <div className="field">
            <Label>Lojas</Label>
            {w.stores.map((s, i) => {
              const set = (patch: Partial<typeof s>) => onChange({ stores: w.stores.map((x, j) => j === i ? { ...x, ...patch } : x) });
              return (
                <div key={i} className="pb-acc-item">
                  <div className="flex items-center gap-2">
                    <Input value={s.name} onChange={(e) => set({ name: e.target.value })} placeholder="Loja" maxLength={120} />
                    <button type="button" className="pb-icon pb-icon--danger" onClick={() => onChange({ stores: w.stores.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>
                  </div>
                  <Input className="mt-1" value={s.description} onChange={(e) => set({ description: e.target.value })} placeholder="Descrição" maxLength={300} />
                  <Input className="mt-1" value={s.href} onChange={(e) => set({ href: e.target.value })} placeholder="Link" maxLength={500} />
                  <div className="mt-1 flex gap-2">
                    <Select value={s.trustLevel} onValueChange={(val) => set({ trustLevel: val as typeof s.trustLevel })}>
                      <SelectTrigger aria-label="Confiança" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="verified">Verificado</SelectItem><SelectItem value="trusted">Confiável</SelectItem><SelectItem value="caution">Cautela</SelectItem><SelectItem value="choice">Escolha</SelectItem></SelectContent>
                    </Select>
                    <Input value={s.badge} onChange={(e) => set({ badge: e.target.value })} placeholder="Selo (opcional)" maxLength={40} />
                  </div>
                </div>
              );
            })}
            {w.stores.length < 20 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ stores: [...w.stores, { name: "Loja", description: "", href: "", trustLevel: "trusted", badge: "" }] })}><Plus className="size-3.5" /> Adicionar loja</button>}
          </div>
          <div className="field">
            <Label>Acessórios</Label>
            {w.accessories.map((a, i) => {
              const set = (patch: Partial<typeof a>) => onChange({ accessories: w.accessories.map((x, j) => j === i ? { ...x, ...patch } : x) });
              return (
                <div key={i} className="pb-acc-item">
                  <div className="flex items-center gap-2">
                    <Input value={a.name} onChange={(e) => set({ name: e.target.value })} placeholder="Acessório" maxLength={120} />
                    <button type="button" className="pb-icon pb-icon--danger" onClick={() => onChange({ accessories: w.accessories.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>
                  </div>
                  <Input className="mt-1" value={a.description} onChange={(e) => set({ description: e.target.value })} placeholder="Descrição" maxLength={300} />
                  <Input className="mt-1" value={a.href} onChange={(e) => set({ href: e.target.value })} placeholder="Link" maxLength={500} />
                  <Select value={a.category} onValueChange={(val) => set({ category: val as typeof a.category })}>
                    <SelectTrigger aria-label="Categoria" className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="storage">Armazenamento</SelectItem><SelectItem value="connectivity">Conectividade</SelectItem><SelectItem value="protection">Proteção</SelectItem><SelectItem value="other">Outros</SelectItem></SelectContent>
                  </Select>
                </div>
              );
            })}
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ accessories: [...w.accessories, { name: "Acessório", description: "", href: "", category: "other", badge: "" }] })}><Plus className="size-3.5" /> Adicionar acessório</button>
          </div>
          <div className="field">
            <Label>Dicas</Label>
            {w.tips.map((tp, i) => {
              const set = (patch: Partial<typeof tp>) => onChange({ tips: w.tips.map((x, j) => j === i ? { ...x, ...patch } : x) });
              return (
                <div key={i} className="pb-acc-item">
                  <div className="flex items-center gap-2">
                    <Input value={tp.title} onChange={(e) => set({ title: e.target.value })} placeholder="Título" maxLength={120} />
                    <Select value={tp.type} onValueChange={(val) => set({ type: val as typeof tp.type })}>
                      <SelectTrigger aria-label="Tipo" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="tip">Dica</SelectItem><SelectItem value="warning">Aviso</SelectItem></SelectContent>
                    </Select>
                    <button type="button" className="pb-icon pb-icon--danger" onClick={() => onChange({ tips: w.tips.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>
                  </div>
                  <Textarea className="mt-1" value={tp.description} onChange={(e) => set({ description: e.target.value })} placeholder="Descrição" rows={2} maxLength={400} />
                </div>
              );
            })}
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ tips: [...w.tips, { title: "Dica", description: "", type: "tip" }] })}><Plus className="size-3.5" /> Adicionar dica</button>
          </div>
        </>
      )}
      {w.type === "container" && (() => {
        const setCols = (cols: Column[]) => onChange({ columns: cols } as Partial<Widget>);
        const rebalance = (cols: Column[]): Column[] => {
          const sp = evenSpans(Math.max(1, cols.length));
          return cols.map((col, idx) => ({ ...col, span: sp[idx] ?? 12 }));
        };
        return (
          <>
            <div className="field"><Label>Tag (semântica)</Label>
              <Select value={w.tag} onValueChange={(val) => onChange({ tag: val } as Partial<Widget>)}>
                <SelectTrigger aria-label="Tag" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="div">Container (div)</SelectItem>
                  <SelectItem value="section">Seção (section)</SelectItem>
                  <SelectItem value="article">Artigo (article)</SelectItem>
                  <SelectItem value="aside">Lateral (aside)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="field"><Label>Fundo</Label>
              <Select value={w.bg} onValueChange={(val) => onChange({ bg: val } as Partial<Widget>)}>
                <SelectTrigger aria-label="Fundo" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  <SelectItem value="muted">Cinza suave</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="primary">Destaque</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="field"><Label>Espaço vertical</Label>
                <Select value={w.padY} onValueChange={(val) => onChange({ padY: val } as Partial<Widget>)}>
                  <SelectTrigger aria-label="Espaço vertical" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhum</SelectItem><SelectItem value="sm">Pequeno</SelectItem><SelectItem value="md">Médio</SelectItem><SelectItem value="lg">Grande</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="field"><Label>Gap colunas</Label>
                <Select value={w.gap} onValueChange={(val) => onChange({ gap: val } as Partial<Widget>)}>
                  <SelectTrigger aria-label="Gap colunas" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhum</SelectItem><SelectItem value="sm">Pequeno</SelectItem><SelectItem value="md">Médio</SelectItem><SelectItem value="lg">Grande</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={w.full} onCheckedChange={(c) => onChange({ full: c === true } as Partial<Widget>)} /> Largura total (full-bleed)</label>

            <div className="field">
              <Label>Estrutura</Label>
              <div className="grid grid-cols-3 gap-2">
                {STRUCTURE_PRESETS.map((p) => {
                  const active = spansEqual(p.spans, w.columns.map((c) => c.span));
                  return (
                  <button
                    key={p.key}
                    type="button"
                    title={p.label}
                    aria-label={p.label}
                    aria-pressed={active}
                    className={cn("rounded-md border p-1.5 transition-colors hover:border-primary hover:bg-accent", active ? "border-primary bg-primary/10" : "border-border")}
                    onClick={() => setCols(p.spans.map((span, i) => w.columns[i] ? { ...w.columns[i], span } : { id: uid(), span, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }))}
                  >
                    <div className="flex h-6 gap-0.5">
                      {p.spans.map((s, i) => <div key={i} className={cn("rounded-sm", active ? "bg-primary/60" : "bg-muted-foreground/40")} style={{ flexGrow: s }} />)}
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>

            <div className="field"><Label>Colunas ({w.columns.length})</Label>
              {w.columns.map((c, ci) => {
                const updWidget = (wi: number, patch: Partial<Widget>) =>
                  setCols(w.columns.map((cc, i) => i === ci ? { ...cc, widgets: cc.widgets.map((sw, j) => j === wi ? ({ ...sw, ...patch } as Widget) : sw) } : cc));
                const addWidget = (type: WidgetType) =>
                  setCols(w.columns.map((cc, i) => i === ci ? { ...cc, widgets: [...cc.widgets, newWidget(type)] } : cc));
                const delWidget = (wi: number) =>
                  setCols(w.columns.map((cc, i) => i === ci ? { ...cc, widgets: cc.widgets.filter((_, j) => j !== wi) } : cc));
                const moveWidget = (wi: number, dir: number) => {
                  const j = wi + dir;
                  if (j < 0 || j >= c.widgets.length) return;
                  const ws = [...c.widgets];
                  [ws[wi], ws[j]] = [ws[j], ws[wi]];
                  setCols(w.columns.map((cc, i) => i === ci ? { ...cc, widgets: ws } : cc));
                };
                return (
                  <div key={c.id} className="mt-2 rounded-lg border border-border p-2">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Coluna {ci + 1} · {c.span}/12</span>
                      {w.columns.length > 1 && <button type="button" aria-label={`Remover coluna ${ci + 1}`} onClick={() => setCols(rebalance(w.columns.filter((_, i) => i !== ci)))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>}
                    </div>
                    <input type="range" min={1} max={12} value={c.span} aria-label={`Largura da coluna ${ci + 1}`} onChange={(e) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, span: Number(e.target.value) } : cc))} className="mb-2 w-full" />
                    <div className="mb-2">
                      <Label className="text-[10px] uppercase text-muted-foreground">Direção dos widgets</Label>
                      <Select value={c.dir} onValueChange={(val) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, dir: val as "col" | "row" } : cc))}>
                        <SelectTrigger aria-label="Direção dos widgets" className="h-7 w-full"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="col">Empilhado (↓)</SelectItem><SelectItem value="row">Lado a lado (→)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="mb-2 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Distribuição</Label>
                        <Select value={c.justify} onValueChange={(val) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, justify: val as Column["justify"] } : cc))}>
                          <SelectTrigger aria-label="Distribuição" className="h-7 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="start">Início</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="end">Fim</SelectItem><SelectItem value="between">Espaçar</SelectItem><SelectItem value="around">Ao redor</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[10px] uppercase text-muted-foreground">Alinhamento</Label>
                        <Select value={c.align} onValueChange={(val) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, align: val as Column["align"] } : cc))}>
                          <SelectTrigger aria-label="Alinhamento" className="h-7 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="stretch">Esticar</SelectItem><SelectItem value="start">Início</SelectItem><SelectItem value="center">Centro</SelectItem><SelectItem value="end">Fim</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <Select value={c.gap} onValueChange={(val) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, gap: val as Column["gap"] } : cc))}>
                        <SelectTrigger aria-label="Espaço entre widgets" className="h-7 flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="none">Gap: nenhum</SelectItem><SelectItem value="sm">Gap: pequeno</SelectItem><SelectItem value="md">Gap: médio</SelectItem><SelectItem value="lg">Gap: grande</SelectItem></SelectContent>
                      </Select>
                      <label className="flex shrink-0 items-center gap-1 text-xs"><Checkbox checked={c.wrap} onCheckedChange={(v) => setCols(w.columns.map((cc, i) => i === ci ? { ...cc, wrap: v === true } : cc))} /> Quebra</label>
                    </div>
                    {c.widgets.map((sw, wi) => (
                      <details key={wi} className="mt-1 rounded-md border border-border">
                        <summary className="flex cursor-pointer items-center justify-between px-2 py-1 text-sm hover:bg-accent/50">
                          <span className="flex items-center gap-1.5"><ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> {WIDGET_LABEL[sw.type] ?? sw.type}</span>
                          <span className="flex items-center gap-1">
                            <button type="button" aria-label="Mover para cima" onClick={(e) => { e.preventDefault(); moveWidget(wi, -1); }} className="text-muted-foreground hover:text-foreground"><ArrowUp className="size-3.5" /></button>
                            <button type="button" aria-label="Mover para baixo" onClick={(e) => { e.preventDefault(); moveWidget(wi, 1); }} className="text-muted-foreground hover:text-foreground"><ArrowDown className="size-3.5" /></button>
                            <button type="button" aria-label="Remover widget" onClick={(e) => { e.preventDefault(); delWidget(wi); }} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                          </span>
                        </summary>
                        <div className="border-t border-border p-2">
                          <WidgetForm w={sw} onChange={(patch) => updWidget(wi, patch)} />
                        </div>
                      </details>
                    ))}
                    <Select value="" onValueChange={(type) => addWidget(type as WidgetType)}>
                      <SelectTrigger aria-label="Adicionar widget" className="mt-2 w-full"><SelectValue placeholder="+ Adicionar widget" /></SelectTrigger>
                      <SelectContent>{WIDGETS.map((x) => <SelectItem key={x.type} value={x.type}>{x.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                );
              })}
              {w.columns.length < 6 && <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ columns: rebalance([...w.columns, { id: uid(), span: 6, valign: "top", bg: "none", dir: "col", justify: "start", align: "stretch", gap: "sm", wrap: true, widgets: [] }]) } as Partial<Widget>)}><Plus className="size-3.5" /> Adicionar coluna</button>}
            </div>
          </>
        );
      })()}
      {w.type === "divider" && <p className="muted text-sm">Sem opções.</p>}
      <SxControls w={w} onChange={onChange} />
    </div>
  );
}

// Estilo por elemento (estilo Elementor): espaçamento, tamanho, aparência —
// disponível para todo widget. Tudo em escala fechada (enums seguros).
// Valores em px (legíveis) — espelham as classes Tailwind do renderer
// (mt-0/1/2/4/8/12 = 0/4/8/16/32/48px).
const SX_SPACE_OPTS: Array<{ v: string; l: string }> = [
  { v: "none", l: "0" }, { v: "xs", l: "4px" }, { v: "sm", l: "8px" }, { v: "md", l: "16px" }, { v: "lg", l: "32px" }, { v: "xl", l: "48px" },
];
function SxControls({ w, onChange }: { w: Widget; onChange: (patch: Partial<Widget>) => void }) {
  const sx: WidgetSx = (w as { sx?: WidgetSx }).sx ?? {};
  const set = (patch: WidgetSx) => onChange({ sx: { ...sx, ...patch } } as Partial<Widget>);
  const hasStyle = Object.values(sx).some((v) => v !== undefined && v !== "none" && v !== "auto" && v !== false);
  // Abertura controlada por estado local (sincroniza o toggle do usuário). Não
  // pode derivar de `hasStyle` no `open`, senão o <details> "salta" a cada
  // re-render (fechava sozinho ao tentar abrir / ao limpar o estilo).
  const [open, setOpen] = useState(hasStyle);
  const spaceSel = (key: "mt" | "mb" | "px" | "py", label: string) => (
    <div>
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Select value={sx[key] ?? "none"} onValueChange={(val) => set({ [key]: val } as WidgetSx)}>
        <SelectTrigger aria-label={label} className="h-7 w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{SX_SPACE_OPTS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
  return (
    <details className="mt-2 rounded-md border border-border" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary className="flex cursor-pointer items-center gap-1.5 px-2 py-1.5 text-sm font-medium hover:bg-accent/50">
        <Palette className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" /> Estilo do elemento
      </summary>
      <div className="space-y-2 border-t border-border p-2">
        <div className="grid grid-cols-4 gap-2">
          {spaceSel("mt", "Margem ↑")}
          {spaceSel("mb", "Margem ↓")}
          {spaceSel("px", "Pad. X")}
          {spaceSel("py", "Pad. Y")}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Largura</Label>
            <Select value={sx.w ?? "auto"} onValueChange={(val) => set({ w: val as WidgetSx["w"] })}>
              <SelectTrigger aria-label="Largura" className="h-7 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automática</SelectItem>
                <SelectItem value="full">Cheia (100%)</SelectItem>
                <SelectItem value="3/4">75%</SelectItem>
                <SelectItem value="2/3">66%</SelectItem>
                <SelectItem value="1/2">50%</SelectItem>
                <SelectItem value="1/3">33%</SelectItem>
                <SelectItem value="1/4">25%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Alinhar-se</Label>
            <Select value={sx.self ?? "auto"} onValueChange={(val) => set({ self: val as WidgetSx["self"] })}>
              <SelectTrigger aria-label="Alinhar-se" className="h-7 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Padrão</SelectItem>
                <SelectItem value="start">Início</SelectItem>
                <SelectItem value="center">Centro</SelectItem>
                <SelectItem value="end">Fim</SelectItem>
                <SelectItem value="stretch">Esticar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Fundo</Label>
            <Select value={sx.bg ?? "none"} onValueChange={(val) => set({ bg: val as WidgetSx["bg"] })}>
              <SelectTrigger aria-label="Fundo" className="h-7 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="muted">Suave</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="primary">Destaque</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Arredondar</Label>
            <Select value={sx.radius ?? "none"} onValueChange={(val) => set({ radius: val as WidgetSx["radius"] })}>
              <SelectTrigger aria-label="Arredondar" className="h-7 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                <SelectItem value="sm">Pequeno</SelectItem>
                <SelectItem value="md">Médio</SelectItem>
                <SelectItem value="lg">Grande</SelectItem>
                <SelectItem value="full">Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[10px] uppercase text-muted-foreground">Sombra</Label>
            <Select value={sx.shadow ?? "none"} onValueChange={(val) => set({ shadow: val as WidgetSx["shadow"] })}>
              <SelectTrigger aria-label="Sombra" className="h-7 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                <SelectItem value="sm">Leve</SelectItem>
                <SelectItem value="md">Média</SelectItem>
                <SelectItem value="lg">Forte</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm"><Checkbox checked={sx.border ?? false} onCheckedChange={(c) => set({ border: c === true })} /> Borda</label>
        {hasStyle && (
          <button type="button" className="text-xs text-muted-foreground underline hover:text-foreground" onClick={() => onChange({ sx: undefined } as Partial<Widget>)}>Limpar estilo</button>
        )}
      </div>
    </details>
  );
}
