"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { createBadgeAction, updateBadgeAction } from "@/lib/actions/badge-actions";
import { BadgeIcon, BADGE_ICON_NAMES } from "@/components/admin/badge-icon";
import { ImageUpload } from "@/components/admin/image-upload";

type Tier = "bronze" | "silver" | "gold";

export function BadgeForm({
  mode,
  badgeId,
  initial,
}: {
  mode: "create" | "edit";
  badgeId?: number;
  initial: { name: string; description: string; icon: string; image: string; tier: Tier; manuallyAwardable: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [icon, setIcon] = useState(initial.icon);
  const [image, setImage] = useState(initial.image);
  const [tier, setTier] = useState<Tier>(initial.tier);
  const [manual, setManual] = useState(initial.manuallyAwardable);
  const [pending, setPending] = useState(false);

  async function save() {
    if (name.trim().length < 2) {
      toast.error("Dê um nome à badge.");
      return;
    }
    setPending(true);
    const body = JSON.stringify({ name, description, icon, image, tier, manuallyAwardable: manual });
    const res = mode === "create" ? await createBadgeAction(body) : await updateBadgeAction(badgeId!, body);
    setPending(false);
    if (res.ok) {
      toast.success(mode === "create" ? "Badge criada." : "Badge salva.");
      router.push("/admin/badges");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="rule-form">
      <section className={`rule-form__section badge-preview badge-preview--${tier}`}>
        <span className="badge-preview__icon" aria-hidden="true"><BadgeIcon name={icon} image={image} className="size-6" /></span>
        <div className="min-w-0">
          <p className="badge-preview__name">{name || "Nome da badge"}</p>
          <p className="badge-preview__desc">{description || "Descrição"}</p>
        </div>
      </section>

      <section className="rule-form__section">
        <div className="field">
          <Label htmlFor="bd-name">Nome</Label>
          <Input id="bd-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="field">
          <Label htmlFor="bd-desc">Descrição</Label>
          <Input id="bd-desc" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} />
        </div>
        <div className="field">
          <Label htmlFor="bd-icon">Ícone</Label>
          <div className="rank-icon-pick">
            <span className={`badge-preview__icon badge-preview__icon--${tier}`} aria-hidden="true"><BadgeIcon name={icon} className="size-5" /></span>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger id="bd-icon" className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {BADGE_ICON_NAMES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="field">
          <Label>Imagem custom (opcional, substitui o ícone)</Label>
          <ImageUpload value={image} onChange={setImage} folder="badges" />
        </div>
        <div className="field">
          <Label htmlFor="bd-tier">Nível</Label>
          <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
            <SelectTrigger id="bd-tier" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Prata</SelectItem>
              <SelectItem value="gold">Ouro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="bd-manual" checked={manual} onCheckedChange={setManual} />
          <Label htmlFor="bd-manual" className="font-normal">Concedível manualmente (por moderador/admin)</Label>
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
