"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, Heading, Type, ImageIcon, MousePointerClick, Minus, MoveVertical, Video, Megaphone, Rows3, Images, GripVertical, CreditCard, ListChecks, X, Copy, SlidersHorizontal, Monitor, Tablet, Smartphone, FileText, Download, HardDrive, ShoppingCart, Save, LayoutGrid, Undo2, Redo2, Eye, Gamepad2, Hash, ArrowLeftRight, List, Building2 } from "lucide-react";
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
import { WidgetView, PageRenderer, SEC_BG, SEC_PADY, COL_VALIGN, COL_BG } from "@/components/pages/page-renderer";
import { SectionFx } from "@/components/pages/fx-backgrounds";
import { savePageAction, deletePageAction, saveBlockAction, deleteBlockAction } from "@/lib/actions/page-actions";
import type { Layout, Widget, WidgetType, Section } from "@/lib/pages";

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
    case "deviceGrid": return { type: "deviceGrid", title: "Consoles", limit: 0, showAll: true };
    case "numberTicker": return { type: "numberTicker", value: 100, prefix: "", suffix: "+", label: "Membros", align: "center" };
    case "marquee": return { type: "marquee", items: [{ text: "RetroWiki" }, { text: "Emulação" }, { text: "Handhelds" }], reverse: false, pauseOnHover: true };
    case "bento": return { type: "bento", items: [{ icon: "check", title: "Recurso", description: "Descrição do recurso.", href: "", wide: false }] };
    case "animatedList": return { type: "animatedList", items: [{ icon: "check", title: "Notificação", description: "Detalhe da notificação." }] };
    case "logoCloud": return { type: "logoCloud", title: "", display: "grid", size: "lg", grayscale: true, items: [{ image: "", imageDark: "", alt: "", href: "" }] };
    case "download": return { type: "download", items: [{ name: "ArkOS", version: "1.0", url: "", size: "", date: "", changelogUrl: "", checksum: "" }] };
    case "firmware": return { type: "firmware", items: [{ name: "ArkOS", description: "", owner: "", repo: "", website: "", deprecated: false }] };
    case "buyingGuide": return { type: "buyingGuide", consoleName: "Console", priceRange: "", stores: [{ name: "Loja", description: "", href: "", trustLevel: "trusted", badge: "" }], accessories: [], tips: [] };
  }
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
  const dragRef = useRef<Sel | null>(null);
  const secDragRef = useRef<number | null>(null);
  const libDragRef = useRef<WidgetType | null>(null);
  const colDragRef = useRef<{ si: number; ci: number } | null>(null);
  const blockDragRef = useRef<unknown | null>(null);

  // Drop numa coluna: tile da biblioteca → novo widget; senão → reordena.
  function handleDrop(to: Sel) {
    if (libDragRef.current) {
      const type = libDragRef.current;
      libDragRef.current = null;
      mutate((ss) => { ss[to.si].columns[to.ci].widgets.splice(to.wi, 0, newWidget(type)); });
      selectWidget(to);
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

  // Arrastar-e-soltar de widgets (entre colunas e seções).
  function dropWidget(to: { si: number; ci: number; wi: number }) {
    const from = dragRef.current;
    dragRef.current = null;
    if (!from) return;
    if (from.si === to.si && from.ci === to.ci && from.wi === to.wi) return;
    mutate((ss) => {
      const w = ss[from.si].columns[from.ci].widgets.splice(from.wi, 1)[0];
      let ti = to.wi;
      if (from.si === to.si && from.ci === to.ci && from.wi < to.wi) ti -= 1;
      ss[to.si].columns[to.ci].widgets.splice(ti, 0, w);
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
      if (ss.length === 0) ss.push({ id: uid(), bg: "none", fxParams: {}, full: false, padY: "none", anim: "none", gradFrom: "#10b981", gradTo: "#6366f1", columns: [{ id: uid(), span: 12, valign: "top", bg: "none", widgets: [] }] });
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
                        onDragEnd={() => { libDragRef.current = null; }}
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
                  {s.columns.length < 4 && <button type="button" className="pb-mini" title="Adicionar coluna" onClick={() => mutate((ss) => { ss[si].columns.push({ id: uid(), span: 6, valign: "top", bg: "none", widgets: [] }); const sp = evenSpans(ss[si].columns.length); ss[si].columns.forEach((col, idx) => { col.span = sp[idx]; }); })}><Plus className="size-3.5" /></button>}
                  <button type="button" className="pb-mini" title="Duplicar seção" onClick={() => dupSection(si)}><Copy className="size-3.5" /></button>
                  <button type="button" className="pb-mini" title="Mover acima" disabled={si === 0} onClick={() => mutate((ss) => { [ss[si - 1], ss[si]] = [ss[si], ss[si - 1]]; })}><ArrowUp className="size-3.5" /></button>
                  <button type="button" className="pb-mini" title="Mover abaixo" disabled={si === sections.length - 1} onClick={() => mutate((ss) => { [ss[si + 1], ss[si]] = [ss[si], ss[si + 1]]; })}><ArrowDown className="size-3.5" /></button>
                  <button type="button" className="pb-mini pb-mini--danger" title="Excluir seção" onClick={() => mutate((ss) => { ss.splice(si, 1); })}><Trash2 className="size-3.5" /></button>
                </div>

                <div className={cn(SEC_BG[s.bg], SEC_PADY[s.padY])} style={s.bg === "gradient" ? { backgroundImage: `linear-gradient(120deg, ${s.gradFrom ?? "#10b981"}, ${s.gradTo ?? "#6366f1"})` } : undefined}>
                <SectionFx bg={s.bg} params={s.fxParams} />
                <div className="page-section">
                  {s.columns.map((c, ci) => (
                    <div
                      key={c.id}
                      className={cn("page-col pb-colwrap flex flex-col", COL_SPAN[c.span], COL_VALIGN[c.valign], COL_BG[c.bg], selCol?.si === si && selCol?.ci === ci && "pb-colwrap--selected")}
                      onDragOver={(e) => { if (dragRef.current || libDragRef.current || colDragRef.current) e.preventDefault(); }}
                      onDrop={(e) => { e.preventDefault(); if (colDragRef.current) { dropColumn(si, ci); } else { handleDrop({ si, ci, wi: c.widgets.length }); } }}
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
                          <div
                            key={wi}
                            className={cn("pb-el", isSel && "pb-el--selected")}
                            onClick={(e) => { e.stopPropagation(); selectWidget({ si, ci, wi }); }}
                            onDragOver={(e) => { if (dragRef.current || libDragRef.current) e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleDrop({ si, ci, wi }); }}
                          >
                            <span className="pb-el__bar">
                              <span className="pb-el__handle pb-handle" title="Arrastar" draggable onDragStart={(e) => { dragRef.current = { si, ci, wi }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "w"); }}><GripVertical className="size-3" /></span>
                              <button type="button" className="pb-mini" title="Duplicar" onClick={(e) => { e.stopPropagation(); dupWidget(si, ci, wi); }}><Copy className="size-3" /></button>
                              <button type="button" className="pb-mini pb-mini--danger" title="Excluir" onClick={(e) => { e.stopPropagation(); mutate((ss) => { ss[si].columns[ci].widgets.splice(wi, 1); }); if (isSel) deselect(); }}><Trash2 className="size-3" /></button>
                            </span>
                            <div className="pb-el__content"><WidgetView w={w} /></div>
                          </div>
                        );
                      })}

                      {c.widgets.length === 0 && <div className="pb-drop">Solte um elemento aqui</div>}

                      {ci < s.columns.length - 1 && (
                        <span className="pb-resize" title="Arraste para redimensionar" onPointerDown={(e) => startResize(si, ci, e)} onClick={(e) => e.stopPropagation()} />
                      )}
                    </div>
                  ))}
                </div>
                </div>
              </div>
            ))}

            <button type="button" className="pb-addsec" onClick={() => mutate((ss) => { ss.push({ id: uid(), bg: "none", fxParams: {}, full: false, padY: "none", anim: "none", gradFrom: "#10b981", gradTo: "#6366f1", columns: [{ id: uid(), span: 12, valign: "top", bg: "none", widgets: [] }] }); })}>
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
      {w.type === "divider" && <p className="muted text-sm">Sem opções.</p>}
    </div>
  );
}
