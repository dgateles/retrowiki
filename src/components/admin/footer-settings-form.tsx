"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveFooterSettingsAction } from "@/lib/actions/menu-actions";
import type { FooterSettings } from "@/lib/settings";

export function FooterSettingsForm({ initial }: { initial: FooterSettings }) {
  const router = useRouter();
  const [tagline, setTagline] = useState(initial.tagline);
  const [copyright, setCopyright] = useState(initial.copyright);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    const res = await saveFooterSettingsAction(JSON.stringify({ tagline, copyright }));
    setPending(false);
    if (res.ok) { toast.success("Rodapé atualizado."); router.refresh(); }
    else toast.error(res.error ?? "Falha ao salvar.");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="text-base font-semibold">Texto do rodapé</h2>
      <p className="muted mt-1 text-sm">Descrição e direitos exibidos no fim de todas as páginas.</p>
      <div className="mt-4 flex flex-col gap-3">
        <div className="field">
          <Label htmlFor="ft-tagline">Descrição</Label>
          <Textarea id="ft-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} maxLength={300} />
        </div>
        <div className="field">
          <Label htmlFor="ft-copy">Direitos (rodapé)</Label>
          <Input id="ft-copy" value={copyright} onChange={(e) => setCopyright(e.target.value)} maxLength={200} placeholder="© {year} RetroWiki" />
          <p className="muted text-xs">Use <code>{"{year}"}</code> para inserir o ano atual automaticamente.</p>
        </div>
        <div>
          <Button type="button" size="sm" onClick={save} disabled={pending}>{pending ? "Salvando…" : "Salvar rodapé"}</Button>
        </div>
      </div>
    </div>
  );
}
