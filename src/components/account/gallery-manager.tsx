"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus, FolderPlus, Pencil, Trash2, EyeOff } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useConfirm } from "@/components/admin/confirm-dialog";
import {
  addPhotoAction, deletePhotoAction, movePhotoAction,
  createAlbumAction, renameAlbumAction, deleteAlbumAction,
} from "@/lib/actions/gallery-actions";
import type { MemberPhoto, MemberAlbum } from "@/lib/gallery";

const NONE = "__none__";

export function GalleryManager({ photos, albums, max }: { photos: MemberPhoto[]; albums: MemberAlbum[]; max: number }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [albumId, setAlbumId] = useState<string>(NONE);
  const [newAlbum, setNewAlbum] = useState("");
  const [pending, setPending] = useState(false);

  const full = photos.length >= max;
  const albumName = (id: number | null) => albums.find((a) => a.id === id)?.title ?? "Geral";

  async function add() {
    if (!url) { toast.error("Envie uma imagem primeiro."); return; }
    setPending(true);
    const res = await addPhotoAction(url, caption, albumId === NONE ? null : Number(albumId));
    setPending(false);
    if (res.ok) { toast.success("Foto adicionada."); setUrl(""); setCaption(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function remove(id: number) {
    if (!(await confirm({ description: "Remover esta foto?", confirmLabel: "Remover", destructive: true }))) return;
    const res = await deletePhotoAction(id);
    if (res.ok) { toast.success("Foto removida."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function move(id: number, value: string) {
    const res = await movePhotoAction(id, value === NONE ? null : Number(value));
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }
  async function addAlbum() {
    if (!newAlbum.trim()) return;
    const res = await createAlbumAction(newAlbum.trim());
    if (res.ok) { toast.success("Álbum criado."); setNewAlbum(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function rename(a: MemberAlbum) {
    const name = window.prompt("Novo nome do álbum:", a.title);
    if (name == null) return;
    const res = await renameAlbumAction(a.id, name.trim());
    if (res.ok) router.refresh(); else toast.error(res.error ?? "Falha.");
  }
  async function removeAlbum(a: MemberAlbum) {
    if (!(await confirm({ description: `Excluir o álbum "${a.title}"? As fotos voltam para Geral.`, confirmLabel: "Excluir", destructive: true }))) return;
    const res = await deleteAlbumAction(a.id);
    if (res.ok) { toast.success("Álbum excluído."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div>
      <p className="muted text-sm">{photos.length} de {max} fotos.</p>

      {/* Álbuns */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {albums.map((a) => (
          <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm">
            {a.title}
            <button type="button" className="text-muted-foreground hover:text-foreground" title="Renomear" onClick={() => rename(a)}><Pencil className="size-3" /></button>
            <button type="button" className="text-muted-foreground hover:text-destructive" title="Excluir álbum" onClick={() => removeAlbum(a)}><Trash2 className="size-3" /></button>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <Input value={newAlbum} onChange={(e) => setNewAlbum(e.target.value)} placeholder="Novo álbum" maxLength={120} className="h-8 w-36" />
          <Button type="button" variant="outline" size="sm" onClick={addAlbum} disabled={!newAlbum.trim()}><FolderPlus className="size-4" /> Criar</Button>
        </span>
      </div>

      {photos.length > 0 && (
        <ul className="gallery-grid mt-4">
          {photos.map((p) => (
            <li key={p.id} className={`gallery-grid__item${p.hidden ? " opacity-50" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption} className="gallery-grid__img" loading="lazy" />
              {p.caption && <span className="gallery-grid__cap">{p.caption}</span>}
              {p.hidden && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-white"><EyeOff className="size-3" /> Oculta</span>}
              <button type="button" className="gallery-grid__del" title="Remover" onClick={() => remove(p.id)}><X className="size-4" aria-hidden="true" /></button>
              {albums.length > 0 && (
                <div className="mt-1 px-1">
                  <Select value={p.albumId ? String(p.albumId) : NONE} onValueChange={(v) => move(p.id, v)}>
                    <SelectTrigger aria-label="Álbum" className="h-7 w-full text-xs"><SelectValue>{albumName(p.albumId)}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Geral</SelectItem>
                      {albums.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {full ? (
        <p className="muted mt-4 text-sm">Limite de fotos atingido. Remova uma para enviar outra.</p>
      ) : (
        <div className="member-create mt-5 border-t border-border/60 pt-4">
          <Label>Nova foto</Label>
          <ImageUpload value={url} onChange={setUrl} folder="gallery" />
          <div className="field">
            <Label htmlFor="ph-cap">Legenda (opcional)</Label>
            <Input id="ph-cap" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} />
          </div>
          {albums.length > 0 && (
            <div className="field">
              <Label>Álbum</Label>
              <Select value={albumId} onValueChange={setAlbumId}>
                <SelectTrigger aria-label="Álbum" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Geral</SelectItem>
                  {albums.map((a) => <SelectItem key={a.id} value={String(a.id)}>{a.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Button type="button" size="sm" onClick={add} disabled={pending || !url}><Plus className="size-4" /> {pending ? "Adicionando…" : "Adicionar à galeria"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
