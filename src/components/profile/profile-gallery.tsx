"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EyeOff, Eye } from "lucide-react";
import { ReportButton } from "@/components/moderation/report-button";
import { setPhotoHiddenAction } from "@/lib/actions/gallery-actions";
import type { MemberPhoto, MemberAlbum } from "@/lib/gallery";

type ReportTypeOpt = { id: number; title: string };

/** Galeria do perfil: agrupa por álbum, permite denunciar (membros) e
 *  ocultar/reexibir (staff). */
export function ProfileGallery({
  photos, albums, reportTypes, canReport, isStaff, messageMandatory,
}: {
  photos: MemberPhoto[];
  albums: MemberAlbum[];
  reportTypes: ReportTypeOpt[];
  canReport: boolean;
  isStaff: boolean;
  messageMandatory: boolean;
}) {
  const router = useRouter();

  async function toggleHidden(id: number, hidden: boolean) {
    const res = await setPhotoHiddenAction(id, hidden);
    if (res.ok) { toast.success(hidden ? "Foto ocultada." : "Foto reexibida."); router.refresh(); }
    else toast.error(res.error ?? "Falha.");
  }

  // Agrupa: cada álbum na ordem, depois "Geral" (sem álbum).
  const groups: { key: string; title: string | null; items: MemberPhoto[] }[] = [];
  for (const a of albums) {
    const items = photos.filter((p) => p.albumId === a.id);
    if (items.length) groups.push({ key: `a${a.id}`, title: a.title, items });
  }
  const general = photos.filter((p) => !p.albumId);
  if (general.length) groups.push({ key: "general", title: albums.length ? "Geral" : null, items: general });

  if (photos.length === 0) return null;

  return (
    <section aria-labelledby="p-gallery">
      <h2 id="p-gallery" className="comments__title">Galeria</h2>
      {groups.map((g) => (
        <div key={g.key} className="mt-4">
          {g.title && <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{g.title}</h3>}
          <ul className="gallery-grid gallery-grid--view">
            {g.items.map((p) => (
              <li key={p.id} className={`gallery-grid__item${p.hidden ? " opacity-50" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption} className="gallery-grid__img" loading="lazy" />
                {p.caption && <span className="gallery-grid__cap">{p.caption}</span>}
                {p.hidden && isStaff && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-destructive/90 px-1.5 py-0.5 text-[10px] font-medium text-white"><EyeOff className="size-3" /> Oculta</span>
                )}
                <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                  {canReport && <ReportButton targetType="photo" targetId={p.id} reportTypes={reportTypes} messageMandatory={messageMandatory} variant="icon" />}
                  {isStaff && (
                    <button type="button" className="report-trigger" title={p.hidden ? "Reexibir" : "Ocultar"} onClick={() => toggleHidden(p.id, !p.hidden)}>
                      {p.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                      <span className="sr-only">{p.hidden ? "Reexibir" : "Ocultar"}</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
