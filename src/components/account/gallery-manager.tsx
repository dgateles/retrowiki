"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { ImageUpload } from "@/components/admin/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPhotoAction, deletePhotoAction } from "@/lib/actions/gallery-actions";
import type { MemberPhoto } from "@/lib/gallery";

export function GalleryManager({ photos, max }: { photos: MemberPhoto[]; max: number }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [pending, setPending] = useState(false);

  const full = photos.length >= max;

  async function add() {
    if (!url) { toast.error("Envie uma imagem primeiro."); return; }
    setPending(true);
    const res = await addPhotoAction(url, caption);
    setPending(false);
    if (res.ok) { toast.success("Foto adicionada."); setUrl(""); setCaption(""); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }
  async function remove(id: number) {
    if (!window.confirm("Remover esta foto?")) return;
    const res = await deletePhotoAction(id);
    if (res.ok) { toast.success("Foto removida."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  return (
    <div>
      <p className="muted text-sm">{photos.length} de {max} fotos.</p>

      {photos.length > 0 && (
        <ul className="gallery-grid mt-4">
          {photos.map((p) => (
            <li key={p.id} className="gallery-grid__item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption} className="gallery-grid__img" loading="lazy" />
              {p.caption && <span className="gallery-grid__cap">{p.caption}</span>}
              <button type="button" className="gallery-grid__del" title="Remover" onClick={() => remove(p.id)}><X className="size-4" aria-hidden="true" /></button>
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
          <div>
            <Button type="button" size="sm" onClick={add} disabled={pending || !url}>{pending ? "Adicionando…" : "Adicionar à galeria"}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
