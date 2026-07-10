"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FolderPlus, Lock, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { saveForumCategoryAction, deleteForumCategoryAction, saveForumAction, deleteForumAction } from "@/lib/actions/forum-admin-actions";
import type { AdminForumCategory, AdminForum } from "@/lib/admin/forum-admin";

type UserRole = "member" | "contributor" | "moderator" | "admin";
const ROLE_LABEL: Record<UserRole, string> = { member: "Membro", contributor: "Colaborador", moderator: "Moderador", admin: "Admin" };

type CatDraft = { id?: number; title: string; description: string; visible: boolean; sortOrder: number };
type ForumDraft = { id?: number; categoryId: number; parentId: number | null; title: string; description: string; icon: string; visible: boolean; locked: boolean; minReadRole: UserRole; minPostRole: UserRole; sortOrder: number };
const NO_PARENT = "none";

export function ForumManager({ categories }: { categories: AdminForumCategory[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cat, setCat] = useState<CatDraft | null>(null);
  const [forum, setForum] = useState<ForumDraft | null>(null);
  const [del, setDel] = useState<{ kind: "cat" | "forum"; id: number; name: string } | null>(null);

  const newCat = (): CatDraft => ({ title: "", description: "", visible: true, sortOrder: 0 });
  const newForum = (categoryId: number): ForumDraft => ({ categoryId, parentId: null, title: "", description: "", icon: "", visible: true, locked: false, minReadRole: "member", minPostRole: "member", sortOrder: 0 });

  function saveCat() {
    if (!cat || cat.title.trim().length < 2) return;
    start(async () => {
      const res = await saveForumCategoryAction(cat);
      if (res.ok) { toast.success("Categoria salva."); setCat(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }
  function saveForum() {
    if (!forum || forum.title.trim().length < 2) return;
    start(async () => {
      const res = await saveForumAction(forum);
      if (res.ok) { toast.success("Fórum salvo."); setForum(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }
  function confirmDelete() {
    if (!del) return;
    start(async () => {
      const res = del.kind === "cat" ? await deleteForumCategoryAction(del.id) : await deleteForumAction(del.id);
      if (res.ok) { toast.success("Excluído."); setDel(null); router.refresh(); }
      else toast.error(res.error ?? "Falha.");
    });
  }

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Fórum</h1>
          <p className="page__note">Categorias e fóruns. A ordem e a visibilidade controlam o que aparece em /forum.</p>
        </div>
        <Button size="sm" onClick={() => setCat(newCat())}><FolderPlus className="size-4" aria-hidden="true" /> Nova categoria</Button>
      </div>

      {categories.length === 0 ? (
        <Empty className="mt-6">
          <EmptyHeader>
            <EmptyMedia variant="icon"><FolderPlus aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nenhuma categoria</EmptyTitle>
            <EmptyDescription>Crie uma categoria e depois adicione fóruns dentro dela.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Button size="sm" onClick={() => setCat(newCat())}><FolderPlus className="size-4" aria-hidden="true" /> Nova categoria</Button></EmptyContent>
        </Empty>
      ) : (
        <div className="mt-4 flex flex-col gap-6">
          {categories.map((c) => (
            <section key={c.id} className="rounded-lg border border-border">
              <header className="flex items-center gap-2 border-b border-border p-3">
                <h2 className="font-semibold">{c.title}</h2>
                {!c.visible && <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"><EyeOff className="inline size-3" aria-hidden="true" /> oculta</span>}
                <span className="ml-auto flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar categoria ${c.title}`} onClick={() => setCat({ id: c.id, title: c.title, description: c.description ?? "", visible: c.visible, sortOrder: c.sortOrder })}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={`Excluir categoria ${c.title}`} onClick={() => setDel({ kind: "cat", id: c.id, name: c.title })}><Trash2 className="size-4" /></Button>
                </span>
              </header>
              <ul className="divide-y divide-border">
                {c.forums.length === 0 && <li className="p-3 text-sm text-muted-foreground">Nenhum fórum nesta categoria.</li>}
                {c.forums.map((f: AdminForum) => (
                  <li key={f.id} className={`flex items-center gap-3 p-3${f.parentId != null ? " pl-8" : ""}`}>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        {f.parentId != null && <span className="text-xs text-muted-foreground" aria-hidden="true">↳</span>}
                        {f.title}
                        {f.parentId != null && <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">sub de {c.forums.find((o) => o.id === f.parentId)?.title ?? "?"}</span>}
                        {!f.visible && <EyeOff className="size-3.5 text-muted-foreground" aria-label="Oculto" />}
                        {f.locked && <Lock className="size-3.5 text-muted-foreground" aria-label="Trancado" />}
                      </p>
                      <p className="text-xs text-muted-foreground">/{f.slug} · {f.topicsCount} tópico(s) · ler: {ROLE_LABEL[f.minReadRole]} · postar: {ROLE_LABEL[f.minPostRole]}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" aria-label={`Editar ${f.title}`} onClick={() => setForum({ id: f.id, categoryId: f.categoryId, parentId: f.parentId, title: f.title, description: f.description ?? "", icon: f.icon ?? "", visible: f.visible, locked: f.locked, minReadRole: f.minReadRole, minPostRole: f.minPostRole, sortOrder: f.sortOrder })}><Pencil className="size-4" /></Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive" aria-label={`Excluir ${f.title}`} onClick={() => setDel({ kind: "forum", id: f.id, name: f.title })}><Trash2 className="size-4" /></Button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border p-3">
                <Button variant="outline" size="sm" onClick={() => setForum(newForum(c.id))}><Plus className="size-4" aria-hidden="true" /> Novo fórum</Button>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Dialog: categoria */}
      <Dialog open={!!cat} onOpenChange={(o) => !o && setCat(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{cat?.id ? "Editar categoria" : "Nova categoria"}</DialogTitle>
          {cat && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="field"><Label htmlFor="cat-title">Título</Label><Input id="cat-title" value={cat.title} onChange={(e) => setCat({ ...cat, title: e.target.value })} maxLength={120} /></div>
              <div className="field"><Label htmlFor="cat-desc">Descrição</Label><Textarea id="cat-desc" value={cat.description} onChange={(e) => setCat({ ...cat, description: e.target.value })} maxLength={300} rows={2} /></div>
              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm"><Switch checked={cat.visible} onCheckedChange={(v) => setCat({ ...cat, visible: v })} /> Visível</label>
                <div className="flex items-center gap-2"><Label htmlFor="cat-order" className="text-sm">Ordem</Label><Input id="cat-order" type="number" className="w-20" value={cat.sortOrder} onChange={(e) => setCat({ ...cat, sortOrder: Number(e.target.value) || 0 })} /></div>
              </div>
              <div className="modal-actions">
                <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
                <Button size="sm" disabled={pending || cat.title.trim().length < 2} onClick={saveCat}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: fórum */}
      <Dialog open={!!forum} onOpenChange={(o) => !o && setForum(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{forum?.id ? "Editar fórum" : "Novo fórum"}</DialogTitle>
          {forum && (
            <div className="mt-3 flex flex-col gap-3">
              <div className="field"><Label htmlFor="f-title">Título</Label><Input id="f-title" value={forum.title} onChange={(e) => setForum({ ...forum, title: e.target.value })} maxLength={120} /></div>
              <div className="field"><Label htmlFor="f-desc">Descrição</Label><Textarea id="f-desc" value={forum.description} onChange={(e) => setForum({ ...forum, description: e.target.value })} maxLength={300} rows={2} /></div>
              <div className="field"><Label htmlFor="f-icon">Ícone (chave, opcional)</Label><Input id="f-icon" value={forum.icon} onChange={(e) => setForum({ ...forum, icon: e.target.value })} maxLength={40} placeholder="gamepad, info, download…" /></div>
              {(() => {
                const parents = categories.find((c) => c.id === forum.categoryId)?.forums.filter((o) => o.parentId == null && o.id !== forum.id) ?? [];
                return parents.length > 0 ? (
                  <div className="field"><Label>Fórum pai (sub-fórum)</Label>
                    <Select value={forum.parentId == null ? NO_PARENT : String(forum.parentId)} onValueChange={(v) => setForum({ ...forum, parentId: v === NO_PARENT ? null : Number(v) })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_PARENT}>Nenhum (fórum de topo)</SelectItem>
                        {parents.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null;
              })()}
              <div className="grid grid-cols-2 gap-3">
                <div className="field"><Label>Quem pode ler</Label>
                  <Select value={forum.minReadRole} onValueChange={(v) => setForum({ ...forum, minReadRole: v as UserRole })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}+</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="field"><Label>Quem pode postar</Label>
                  <Select value={forum.minPostRole} onValueChange={(v) => setForum({ ...forum, minPostRole: v as UserRole })}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>{(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}+</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm"><Switch checked={forum.visible} onCheckedChange={(v) => setForum({ ...forum, visible: v })} /> Visível</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={forum.locked} onCheckedChange={(v) => setForum({ ...forum, locked: v })} /> Trancado</label>
                <div className="flex items-center gap-2"><Label htmlFor="f-order" className="text-sm">Ordem</Label><Input id="f-order" type="number" className="w-20" value={forum.sortOrder} onChange={(e) => setForum({ ...forum, sortOrder: Number(e.target.value) || 0 })} /></div>
              </div>
              <div className="modal-actions">
                <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
                <Button size="sm" disabled={pending || forum.title.trim().length < 2} onClick={saveForum}>Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: excluir */}
      <Dialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Excluir {del?.kind === "cat" ? "categoria" : "fórum"}</DialogTitle>
          <p className="muted mt-1">Excluir &ldquo;{del?.name}&rdquo;? Esta ação não pode ser desfeita.</p>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant="destructive" size="sm" disabled={pending} onClick={confirmDelete}>Excluir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
