"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRankAction, updateRankAction } from "@/lib/actions/rank-actions";
import { RankIcon, RANK_ICON_NAMES } from "@/components/admin/rank-icon";
import { ImageUpload } from "@/components/admin/image-upload";

export function RankForm({
  mode,
  rankId,
  initial,
}: {
  mode: "create" | "edit";
  rankId?: number;
  initial: { title: string; points: number; icon: string; image: string };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [points, setPoints] = useState(initial.points);
  const [icon, setIcon] = useState(initial.icon);
  const [image, setImage] = useState(initial.image);
  const [pending, setPending] = useState(false);

  async function save() {
    if (title.trim().length < 2) {
      toast.error("Dê um título ao rank.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ title, points, icon, image });
    const res = mode === "create" ? await createRankAction(body) : await updateRankAction(rankId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Rank criado." : "Rank salvo.");
      router.push("/admin/ranks");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className="rule-form__section">
        <div className="field">
          <Label htmlFor="rk-title">Título</Label>
          <Input id="rk-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
        </div>
        <div className="field">
          <Label htmlFor="rk-points">Número de pontos (limiar de reputação)</Label>
          <Input id="rk-points" type="number" min={0} value={String(points)} onChange={(e) => setPoints(Math.max(0, Math.floor(Number(e.target.value) || 0)))} className="w-32" />
        </div>
        <div className="field">
          <Label htmlFor="rk-icon">Ícone</Label>
          <div className="rank-icon-pick">
            <span className="rank-badge" aria-hidden="true"><RankIcon name={icon} image={image} className="size-5" /></span>
            <select id="rk-icon" className="rte__select" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {RANK_ICON_NAMES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <Label>Imagem custom (opcional, substitui o ícone)</Label>
          <ImageUpload value={image} onChange={setImage} folder="ranks" shape="round" />
        </div>
      </section>

      <div className="rule-form__foot">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
