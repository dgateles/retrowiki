"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { recalculateBadgesAction, awardBadgeAction, revokeBadgeAction } from "@/lib/actions/badge-actions";

type Opt = { slug: string; name: string };

export function GamificationTools({ badges }: { badges: Opt[] }) {
  const router = useRouter();
  const [recalcPending, startRecalc] = useTransition();
  const [handle, setHandle] = useState("");
  const [slug, setSlug] = useState(badges[0]?.slug ?? "");
  const [pending, setPending] = useState(false);

  function recalc() {
    startRecalc(async () => {
      const res = await recalculateBadgesAction();
      if (res.ok) {
        toast.success(res.message ?? "Recalculado.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Falha.");
      }
    });
  }

  async function run(fn: () => Promise<{ ok: boolean; error?: string; message?: string }>) {
    if (!handle.trim()) {
      toast.error("Informe o usuário.");
      return;
    }
    setPending(true);
    const res = await fn();
    setPending(false);
    if (res.ok) {
      toast.success(res.message ?? "Feito.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Falha.");
    }
  }

  return (
    <div className="gami-tools">
      <div className="gami-tools__recalc">
        <div>
          <p className="gami-tools__title">Recalcular conquistas</p>
          <p className="muted">Concede a cada usuário as badges automáticas que ele já merece.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={recalc} disabled={recalcPending}>
          <RefreshCw className="size-4" aria-hidden="true" /> {recalcPending ? "Recalculando…" : "Recalcular"}
        </Button>
      </div>

      <form className="gami-tools__manual" onSubmit={(e) => e.preventDefault()}>
        <p className="gami-tools__title">Conceder ou remover manualmente</p>
        <div className="gami-tools__row">
          <div className="field">
            <Label htmlFor="gami-handle">Usuário (@)</Label>
            <Input id="gami-handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="handle" />
          </div>
          <div className="field">
            <Label htmlFor="gami-badge">Badge</Label>
            <Select value={slug} onValueChange={setSlug}>
              <SelectTrigger id="gami-badge" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {badges.map((b) => <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="gami-tools__actions">
            <Button type="button" size="sm" disabled={pending} onClick={() => run(() => awardBadgeAction(handle, slug))}>
              Conceder
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(() => revokeBadgeAction(handle, slug))}>
              Remover
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
