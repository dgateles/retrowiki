"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, Heading, Type, ImageIcon, MousePointerClick, Minus, MoveVertical, Video, Megaphone, Rows3, Images, GripVertical, CreditCard, ListChecks, X } from "lucide-react";
import { ICON_KEYS, ICON_LABELS } from "@/lib/page-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/admin/image-upload";
import { WidgetView } from "@/components/pages/page-renderer";
import { savePageAction, deletePageAction } from "@/lib/actions/page-actions";
import type { Layout, Widget, WidgetType, Section } from "@/lib/pages";

const uid = () => Math.random().toString(36).slice(2, 10);

const WIDGETS: { type: WidgetType; label: string; icon: typeof Heading }[] = [
  { type: "heading", label: "Título", icon: Heading },
  { type: "text", label: "Texto", icon: Type },
  { type: "image", label: "Imagem", icon: ImageIcon },
  { type: "button", label: "Botão", icon: MousePointerClick },
  { type: "video", label: "Vídeo", icon: Video },
  { type: "callout", label: "Destaque", icon: Megaphone },
  { type: "accordion", label: "Acordeão", icon: Rows3 },
  { type: "gallery", label: "Galeria", icon: Images },
  { type: "card", label: "Cartão", icon: CreditCard },
  { type: "iconList", label: "Lista de ícones", icon: ListChecks },
  { type: "divider", label: "Divisor", icon: Minus },
  { type: "spacer", label: "Espaçador", icon: MoveVertical },
];

function newWidget(type: WidgetType): Widget {
  switch (type) {
    case "heading": return { type: "heading", level: 2, text: "Novo título", align: "left" };
    case "text": return { type: "text", text: "Escreva aqui o texto…", align: "left" };
    case "image": return { type: "image", url: "", alt: "", caption: "" };
    case "button": return { type: "button", label: "Saiba mais", href: "/", variant: "primary", align: "left" };
    case "divider": return { type: "divider" };
    case "spacer": return { type: "spacer", size: "md" };
    case "video": return { type: "video", url: "" };
    case "callout": return { type: "callout", tone: "info", text: "Texto em destaque." };
    case "accordion": return { type: "accordion", items: [{ title: "Pergunta", body: "Resposta." }] };
    case "gallery": return { type: "gallery", columns: 3, images: [{ url: "", alt: "" }] };
    case "card": return { type: "card", image: "", title: "Título do cartão", text: "Descrição do cartão.", href: "", buttonLabel: "" };
    case "iconList": return { type: "iconList", items: [{ icon: "check", text: "Item da lista" }] };
  }
}

type PageInput = {
  id: number; title: string; slug: string; metaDescription: string;
  status: "draft" | "published"; showInMenu: boolean; menuOrder: number; noindex: boolean; layout: Layout;
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

export function PageBuilder({ page }: { page: PageInput }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [metaDescription, setMeta] = useState(page.metaDescription);
  const [showInMenu, setShowInMenu] = useState(page.showInMenu);
  const [menuOrder, setMenuOrder] = useState(page.menuOrder);
  const [noindex, setNoindex] = useState(page.noindex);
  const [sections, setSections] = useState<Section[]>(page.layout.sections);
  const [selected, setSelected] = useState<Sel | null>(null);
  const [leftTab, setLeftTab] = useState<"elements" | "page">("elements");
  const [pending, setPending] = useState(false);
  const [resizing, setResizing] = useState(false);
  const dragRef = useRef<Sel | null>(null);
  const secDragRef = useRef<number | null>(null);

  function mutate(fn: (s: Section[]) => void) {
    setSections((prev) => {
      const next = structuredClone(prev) as Section[];
      fn(next);
      return next;
    });
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
    const move = (ev: PointerEvent) => {
      const deltaUnits = Math.round((ev.clientX - startX) / unit);
      const left = Math.max(1, Math.min(total - 1, startSpan + deltaUnits));
      mutate((ss) => { ss[si].columns[ci].span = left; ss[si].columns[ci + 1].span = total - left; });
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
      showInMenu, menuOrder, noindex,
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
    if (!confirm("Excluir esta página? Esta ação não pode ser desfeita.")) return;
    const res = await deletePageAction(page.id);
    if (res.ok) { toast.success("Página excluída."); router.push("/admin/paginas"); }
    else toast.error(res.error ?? "Falha.");
  }

  // Adiciona um widget na coluna ativa (a do widget selecionado, ou a última) e
  // já o seleciona para edição no painel.
  function addWidget(type: WidgetType) {
    let target: Sel | null = null;
    setSections((prev) => {
      const ss = structuredClone(prev) as Section[];
      if (ss.length === 0) ss.push({ id: uid(), columns: [{ id: uid(), span: 12, widgets: [] }] });
      const si = selected && ss[selected.si] ? selected.si : ss.length - 1;
      const ci = selected && ss[si].columns[selected.ci] ? selected.ci : ss[si].columns.length - 1;
      const wi = ss[si].columns[ci].widgets.length;
      ss[si].columns[ci].widgets.push(newWidget(type));
      target = { si, ci, wi };
      return ss;
    });
    if (target) setSelected(target);
  }

  const selWidget = selected && sections[selected.si]?.columns[selected.ci]?.widgets[selected.wi];

  return (
    <div className={cn("pb-fs", resizing && "pb-fs--resizing")}>
      {/* Painel flutuante: biblioteca / edição do widget / configurações */}
      <aside className="pb-fs__panel">
          {selWidget ? (
            <div className="pb-panel__edit">
              <div className="pb-panel__head">
                <button type="button" className="pb-panel__back" onClick={() => setSelected(null)}>← Elementos</button>
                <span className="pb-panel__title">{WIDGETS.find((x) => x.type === selWidget.type)?.label}</span>
              </div>
              <div className="pb-panel__scroll">
                <WidgetForm w={selWidget} onChange={(patch) => mutate((ss) => { Object.assign(ss[selected!.si].columns[selected!.ci].widgets[selected!.wi], patch); })} />
                <Button type="button" variant="ghost" size="sm" className="mt-3 w-full text-destructive" onClick={() => { mutate((ss) => { ss[selected!.si].columns[selected!.ci].widgets.splice(selected!.wi, 1); }); setSelected(null); }}>
                  <Trash2 className="size-4" /> Excluir elemento
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="pb-panel__tabs">
                <button type="button" className={cn("pb-panel__tab", leftTab === "elements" && "pb-panel__tab--active")} onClick={() => setLeftTab("elements")}>Elementos</button>
                <button type="button" className={cn("pb-panel__tab", leftTab === "page" && "pb-panel__tab--active")} onClick={() => setLeftTab("page")}>Página</button>
              </div>
              <div className="pb-panel__scroll">
                {leftTab === "elements" ? (
                  <div className="pb-lib">
                    {WIDGETS.map((wt) => (
                      <button key={wt.type} type="button" className="pb-lib__tile" title={`Adicionar ${wt.label}`} onClick={() => addWidget(wt.type)}>
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
                    <label className="pb-check"><input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} /> Mostrar no menu</label>
                    {showInMenu && <div className="field"><Label htmlFor="pg-order">Ordem no menu</Label><Input id="pg-order" type="number" value={menuOrder} onChange={(e) => setMenuOrder(Number(e.target.value) || 0)} className="w-24" /></div>}
                    <label className="pb-check"><input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} /> Não indexar (noindex)</label>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Canvas (backdrop tela cheia) */}
        <div className="pb-fs__stage" onClick={() => setSelected(null)}>
          <div className="pb-fs__page page" onClick={(e) => e.stopPropagation()}>
            {sections.length === 0 && (
              <div className="pb-stage__empty">
                <p>Comece adicionando um elemento pelo painel à esquerda.</p>
              </div>
            )}

            {sections.map((s, si) => (
              <div
                key={s.id}
                className="pb-sec"
                onDragOver={(e) => { if (secDragRef.current !== null) e.preventDefault(); }}
                onDrop={(e) => { if (secDragRef.current !== null) { e.preventDefault(); dropSection(si); } }}
              >
                <div className="pb-sec__bar">
                  <span className="pb-sec__handle pb-handle" title="Arrastar seção" draggable onDragStart={(e) => { secDragRef.current = si; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "s"); }}><GripVertical className="size-3.5" /></span>
                  {s.columns.length < 4 && <button type="button" className="pb-mini" title="Adicionar coluna" onClick={() => mutate((ss) => { ss[si].columns.push({ id: uid(), span: 6, widgets: [] }); const sp = evenSpans(ss[si].columns.length); ss[si].columns.forEach((col, idx) => { col.span = sp[idx]; }); })}><Plus className="size-3.5" /></button>}
                  <button type="button" className="pb-mini" title="Mover acima" disabled={si === 0} onClick={() => mutate((ss) => { [ss[si - 1], ss[si]] = [ss[si], ss[si - 1]]; })}><ArrowUp className="size-3.5" /></button>
                  <button type="button" className="pb-mini" title="Mover abaixo" disabled={si === sections.length - 1} onClick={() => mutate((ss) => { [ss[si + 1], ss[si]] = [ss[si], ss[si + 1]]; })}><ArrowDown className="size-3.5" /></button>
                  <button type="button" className="pb-mini pb-mini--danger" title="Excluir seção" onClick={() => mutate((ss) => { ss.splice(si, 1); })}><Trash2 className="size-3.5" /></button>
                </div>

                <div className="page-section">
                  {s.columns.map((c, ci) => (
                    <div
                      key={c.id}
                      className={cn("page-col pb-colwrap", COL_SPAN[c.span])}
                      onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }}
                      onDrop={(e) => { e.preventDefault(); dropWidget({ si, ci, wi: c.widgets.length }); }}
                    >
                      <div className="pb-colwrap__bar">
                        <span className="pb-colwrap__span" title="Largura na grade de 12">{c.span}/12</span>
                        {s.columns.length > 1 && <button type="button" className="pb-mini pb-mini--danger" title="Excluir coluna" onClick={() => mutate((ss) => { ss[si].columns.splice(ci, 1); const sp = evenSpans(ss[si].columns.length); ss[si].columns.forEach((col, idx) => { col.span = sp[idx]; }); })}><Trash2 className="size-3" /></button>}
                      </div>

                      {c.widgets.map((w, wi) => {
                        const isSel = selected?.si === si && selected?.ci === ci && selected?.wi === wi;
                        return (
                          <div
                            key={wi}
                            className={cn("pb-el", isSel && "pb-el--selected")}
                            onClick={(e) => { e.stopPropagation(); setSelected({ si, ci, wi }); }}
                            onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }}
                            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropWidget({ si, ci, wi }); }}
                          >
                            <span className="pb-el__bar">
                              <span className="pb-el__handle pb-handle" title="Arrastar" draggable onDragStart={(e) => { dragRef.current = { si, ci, wi }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "w"); }}><GripVertical className="size-3" /></span>
                              <button type="button" className="pb-mini pb-mini--danger" title="Excluir" onClick={(e) => { e.stopPropagation(); mutate((ss) => { ss[si].columns[ci].widgets.splice(wi, 1); }); if (isSel) setSelected(null); }}><Trash2 className="size-3" /></button>
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
            ))}

            <button type="button" className="pb-addsec" onClick={() => mutate((ss) => { ss.push({ id: uid(), columns: [{ id: uid(), span: 12, widgets: [] }] }); })}>
              <Plus className="size-4" aria-hidden="true" /> Adicionar seção
            </button>
          </div>
        </div>

        {/* Barra flutuante superior */}
        <div className="pb-fs__bar">
          <Link href="/admin/paginas" className="pb-fs__exit" title="Sair do editor"><X className="size-4" aria-hidden="true" /></Link>
          <span className="pb-fs__bartitle">{title || "Sem título"}</span>
          <span className={`status-pill status-pill--${page.status === "published" ? "published" : "draft"}`}>{page.status === "published" ? "Publicada" : "Rascunho"}</span>
          <span className="ml-1 flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={remove}>Excluir</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => save(false)} disabled={pending}>Salvar</Button>
            <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>{pending ? "…" : "Publicar"}</Button>
          </span>
        </div>
      </div>
  );
}

function WidgetForm({ w, onChange }: { w: Widget; onChange: (patch: Partial<Widget>) => void }) {
  const align = (
    <div className="field">
      <Label>Alinhamento</Label>
      <select className="pb-select" value={(w as { align?: string }).align ?? "left"} onChange={(e) => onChange({ align: e.target.value } as Partial<Widget>)}>
        <option value="left">Esquerda</option>
        <option value="center">Centro</option>
        <option value="right">Direita</option>
      </select>
    </div>
  );

  return (
    <div className="pb-form">
      {w.type === "heading" && (
        <>
          <div className="field"><Label>Texto</Label><Input value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Nível</Label>
            <select className="pb-select" value={w.level} onChange={(e) => onChange({ level: Number(e.target.value) as 2 | 3 | 4 })}>
              <option value={2}>Título (H2)</option><option value={3}>Subtítulo (H3)</option><option value={4}>Menor (H4)</option>
            </select>
          </div>
          {align}
        </>
      )}
      {w.type === "text" && (
        <>
          <div className="field"><Label>Texto</Label><textarea className="pb-textarea" value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={5000} rows={5} /></div>
          {align}
        </>
      )}
      {w.type === "image" && (
        <>
          <div className="field"><Label>Imagem</Label><ImageUpload value={w.url} onChange={(url) => onChange({ url })} folder="pages" /></div>
          <div className="field"><Label>Texto alternativo</Label><Input value={w.alt} onChange={(e) => onChange({ alt: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Legenda</Label><Input value={w.caption} onChange={(e) => onChange({ caption: e.target.value })} maxLength={200} /></div>
        </>
      )}
      {w.type === "button" && (
        <>
          <div className="field"><Label>Texto do botão</Label><Input value={w.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={80} /></div>
          <div className="field"><Label>Link (URL ou /caminho)</Label><Input value={w.href} onChange={(e) => onChange({ href: e.target.value })} maxLength={500} /></div>
          <div className="field"><Label>Estilo</Label>
            <select className="pb-select" value={w.variant} onChange={(e) => onChange({ variant: e.target.value as "primary" | "outline" })}>
              <option value="primary">Preenchido</option><option value="outline">Contorno</option>
            </select>
          </div>
          {align}
        </>
      )}
      {w.type === "spacer" && (
        <div className="field"><Label>Tamanho</Label>
          <select className="pb-select" value={w.size} onChange={(e) => onChange({ size: e.target.value as "sm" | "md" | "lg" })}>
            <option value="sm">Pequeno</option><option value="md">Médio</option><option value="lg">Grande</option>
          </select>
        </div>
      )}
      {w.type === "video" && (
        <div className="field"><Label>URL do YouTube ou Vimeo</Label><Input value={w.url} onChange={(e) => onChange({ url: e.target.value })} placeholder="https://youtu.be/…" maxLength={500} /></div>
      )}
      {w.type === "callout" && (
        <>
          <div className="field"><Label>Tom</Label>
            <select className="pb-select" value={w.tone} onChange={(e) => onChange({ tone: e.target.value as "info" | "warn" | "success" })}>
              <option value="info">Informação</option><option value="warn">Atenção</option><option value="success">Sucesso</option>
            </select>
          </div>
          <div className="field"><Label>Texto</Label><textarea className="pb-textarea" value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={2000} rows={3} /></div>
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
              <textarea className="pb-textarea mt-1" value={it.body} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, body: e.target.value } : x) })} placeholder="Conteúdo" maxLength={3000} rows={2} />
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
            <select className="pb-select" value={w.columns} onChange={(e) => onChange({ columns: Number(e.target.value) as 2 | 3 | 4 })}>
              <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
            </select>
          </div>
          {w.images.map((im, i) => (
            <div key={i} className="pb-acc-item">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs">Imagem {i + 1}</Label>
                {w.images.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Remover" onClick={() => onChange({ images: w.images.filter((_, j) => j !== i) })}><Trash2 className="size-3.5" /></button>}
              </div>
              <ImageUpload value={im.url} onChange={(url) => onChange({ images: w.images.map((x, j) => j === i ? { ...x, url } : x) })} folder="pages" />
              <Input className="mt-1" value={im.alt} onChange={(e) => onChange({ images: w.images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} placeholder="Texto alternativo" maxLength={200} />
            </div>
          ))}
          {w.images.length < 24 && (
            <button type="button" className="pb-addwidget__btn mt-2" onClick={() => onChange({ images: [...w.images, { url: "", alt: "" }] })}><Plus className="size-3.5" /> Adicionar imagem</button>
          )}
        </>
      )}
      {w.type === "card" && (
        <>
          <div className="field"><Label>Imagem (opcional)</Label><ImageUpload value={w.image} onChange={(image) => onChange({ image })} folder="pages" /></div>
          <div className="field"><Label>Título</Label><Input value={w.title} onChange={(e) => onChange({ title: e.target.value })} maxLength={200} /></div>
          <div className="field"><Label>Texto</Label><textarea className="pb-textarea" value={w.text} onChange={(e) => onChange({ text: e.target.value })} maxLength={2000} rows={3} /></div>
          <div className="field"><Label>Link do botão (opcional)</Label><Input value={w.href} onChange={(e) => onChange({ href: e.target.value })} placeholder="/guias" maxLength={500} /></div>
          <div className="field"><Label>Texto do botão (opcional)</Label><Input value={w.buttonLabel} onChange={(e) => onChange({ buttonLabel: e.target.value })} maxLength={80} /></div>
        </>
      )}
      {w.type === "iconList" && (
        <div className="field">
          <Label>Itens</Label>
          {w.items.map((it, i) => (
            <div key={i} className="pb-acc-item">
              <div className="flex items-center gap-2">
                <select className="pb-select" value={it.icon} onChange={(e) => onChange({ items: w.items.map((x, j) => j === i ? { ...x, icon: e.target.value as typeof ICON_KEYS[number] } : x) })}>
                  {ICON_KEYS.map((k) => <option key={k} value={k}>{ICON_LABELS[k]}</option>)}
                </select>
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
      {w.type === "divider" && <p className="muted text-sm">Sem opções.</p>}
    </div>
  );
}
