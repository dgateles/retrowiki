"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowUp, ArrowDown, Trash2, Plus, Pencil, Check, Heading, Type, ImageIcon, MousePointerClick, Minus, MoveVertical, Video, Megaphone, Rows3, Images, GripVertical, CreditCard, ListChecks } from "lucide-react";
import { ICON_KEYS, ICON_LABELS } from "@/lib/page-icons";
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

const WIDTHS = [
  { v: "full", label: "100%" },
  { v: "1/2", label: "1/2" },
  { v: "1/3", label: "1/3" },
  { v: "2/3", label: "2/3" },
  { v: "1/4", label: "1/4" },
  { v: "3/4", label: "3/4" },
] as const;

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

export function PageBuilder({ page }: { page: PageInput }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [metaDescription, setMeta] = useState(page.metaDescription);
  const [showInMenu, setShowInMenu] = useState(page.showInMenu);
  const [menuOrder, setMenuOrder] = useState(page.menuOrder);
  const [noindex, setNoindex] = useState(page.noindex);
  const [sections, setSections] = useState<Section[]>(page.layout.sections);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const dragRef = useRef<{ si: number; ci: number; wi: number } | null>(null);
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

  return (
    <>
      <div className="page__head">
        <h1 className="page__title">Construtor de página</h1>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={remove}>Excluir</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => save(false)} disabled={pending}>Salvar rascunho</Button>
          <Button type="button" size="sm" onClick={() => save(true)} disabled={pending}>Publicar</Button>
        </div>
      </div>

      <div className="pb">
        {/* Configurações da página */}
        <section className="pb-settings">
          <div className="field">
            <Label htmlFor="pg-title">Título</Label>
            <Input id="pg-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
          </div>
          <div className="field">
            <Label htmlFor="pg-slug">Slug (URL: /p/…)</Label>
            <Input id="pg-slug" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={120} />
          </div>
          <div className="field">
            <Label htmlFor="pg-meta">Meta description (SEO)</Label>
            <Input id="pg-meta" value={metaDescription} onChange={(e) => setMeta(e.target.value)} maxLength={320} />
          </div>
          <label className="pb-check"><input type="checkbox" checked={showInMenu} onChange={(e) => setShowInMenu(e.target.checked)} /> Mostrar no menu do header</label>
          {showInMenu && (
            <div className="field">
              <Label htmlFor="pg-order">Ordem no menu</Label>
              <Input id="pg-order" type="number" value={menuOrder} onChange={(e) => setMenuOrder(Number(e.target.value) || 0)} className="w-28" />
            </div>
          )}
          <label className="pb-check"><input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} /> Não indexar (noindex)</label>
        </section>

        {/* Canvas */}
        <section className="pb-canvas">
          {sections.length === 0 && <p className="empty">Página vazia. Adicione a primeira seção.</p>}

          {sections.map((s, si) => (
            <div
              key={s.id}
              className="pb-section"
              onDragOver={(e) => { if (secDragRef.current !== null) e.preventDefault(); }}
              onDrop={(e) => { if (secDragRef.current !== null) { e.preventDefault(); dropSection(si); } }}
            >
              <div className="pb-section__bar">
                <span className="flex items-center gap-2">
                  <span
                    className="pb-icon pb-handle"
                    title="Arrastar seção"
                    draggable
                    onDragStart={(e) => { secDragRef.current = si; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "s"); }}
                  ><GripVertical className="size-4" /></span>
                  <span className="pb-section__label">Seção {si + 1}</span>
                </span>
                <span className="pb-toolbar">
                  <button type="button" className="pb-icon" title="Mover acima" disabled={si === 0} onClick={() => mutate((ss) => { [ss[si - 1], ss[si]] = [ss[si], ss[si - 1]]; })}><ArrowUp className="size-4" /></button>
                  <button type="button" className="pb-icon" title="Mover abaixo" disabled={si === sections.length - 1} onClick={() => mutate((ss) => { [ss[si + 1], ss[si]] = [ss[si], ss[si + 1]]; })}><ArrowDown className="size-4" /></button>
                  {s.columns.length < 4 && <button type="button" className="pb-icon" title="Adicionar coluna" onClick={() => mutate((ss) => { ss[si].columns.push({ id: uid(), width: "1/2", widgets: [] }); })}><Plus className="size-4" /></button>}
                  <button type="button" className="pb-icon pb-icon--danger" title="Excluir seção" onClick={() => mutate((ss) => { ss.splice(si, 1); })}><Trash2 className="size-4" /></button>
                </span>
              </div>

              <div className="pb-cols">
                {s.columns.map((c, ci) => (
                  <div
                    key={c.id}
                    className="pb-col"
                    onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }}
                    onDrop={(e) => { e.preventDefault(); dropWidget({ si, ci, wi: c.widgets.length }); }}
                  >
                    <div className="pb-col__bar">
                      <select aria-label="Largura da coluna" className="pb-select" value={c.width} onChange={(e) => mutate((ss) => { ss[si].columns[ci].width = e.target.value as Section["columns"][number]["width"]; })}>
                        {WIDTHS.map((w) => <option key={w.v} value={w.v}>{w.label}</option>)}
                      </select>
                      {s.columns.length > 1 && <button type="button" className="pb-icon pb-icon--danger" title="Excluir coluna" onClick={() => mutate((ss) => { ss[si].columns.splice(ci, 1); })}><Trash2 className="size-3.5" /></button>}
                    </div>

                    {c.widgets.map((w, wi) => {
                      const key = `${si}.${ci}.${wi}`;
                      return (
                        <div
                          key={wi}
                          className="pb-widget group"
                          onDragOver={(e) => { if (dragRef.current) e.preventDefault(); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropWidget({ si, ci, wi }); }}
                        >
                          <div className="pb-widget__tools">
                            <span
                              className="pb-icon pb-handle"
                              title="Arrastar para mover"
                              draggable
                              onDragStart={(e) => { dragRef.current = { si, ci, wi }; e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", "w"); }}
                            ><GripVertical className="size-3.5" /></span>
                            <button type="button" className="pb-icon" title="Mover acima" disabled={wi === 0} onClick={() => mutate((ss) => { const ws = ss[si].columns[ci].widgets; [ws[wi - 1], ws[wi]] = [ws[wi], ws[wi - 1]]; })}><ArrowUp className="size-3.5" /></button>
                            <button type="button" className="pb-icon" title="Mover abaixo" disabled={wi === c.widgets.length - 1} onClick={() => mutate((ss) => { const ws = ss[si].columns[ci].widgets; [ws[wi + 1], ws[wi]] = [ws[wi], ws[wi + 1]]; })}><ArrowDown className="size-3.5" /></button>
                            <button type="button" className="pb-icon" title={editing === key ? "Fechar" : "Editar"} onClick={() => setEditing(editing === key ? null : key)}>{editing === key ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}</button>
                            <button type="button" className="pb-icon pb-icon--danger" title="Excluir" onClick={() => mutate((ss) => { ss[si].columns[ci].widgets.splice(wi, 1); })}><Trash2 className="size-3.5" /></button>
                          </div>
                          <div className="pb-widget__preview"><WidgetView w={w} /></div>
                          {editing === key && (
                            <WidgetForm w={w} onChange={(patch) => mutate((ss) => { Object.assign(ss[si].columns[ci].widgets[wi], patch); })} />
                          )}
                        </div>
                      );
                    })}

                    <div className="pb-addwidget">
                      {WIDGETS.map((wt) => (
                        <button key={wt.type} type="button" className="pb-addwidget__btn" onClick={() => mutate((ss) => { ss[si].columns[ci].widgets.push(newWidget(wt.type)); })}>
                          <wt.icon className="size-3.5" aria-hidden="true" /> {wt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => mutate((ss) => { ss.push({ id: uid(), columns: [{ id: uid(), width: "full", widgets: [] }] }); })}>
            <Plus className="size-4" aria-hidden="true" /> Adicionar seção
          </Button>
        </section>
      </div>
    </>
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
