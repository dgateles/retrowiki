"use client";

import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Monitor, LogOut, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { signOutEverywhereAction } from "@/lib/actions/session-actions";
import { count } from "@/lib/plural";
import type { RecentAccess } from "@/lib/sessions";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(d));

/** Acessos recentes por dispositivo/IP + encerrar todas as sessões. */
export function RecentSessions({ sessions }: { sessions: RecentAccess[] }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  async function signOutAll() {
    setPending(true);
    const res = await signOutEverywhereAction();
    if (!res.ok) { setPending(false); toast.error(res.error ?? "Falha."); return; }
    toast.success("Todas as sessões foram encerradas. Faça login novamente.");
    // O JWT atual também foi invalidado — desloga de fato.
    await signOut({ callbackUrl: "/auth/entrar" });
  }

  return (
    <div className="rsess">
      <div className="rsess__head">
        <span className="rsess__icon" aria-hidden="true"><Monitor className="size-5" /></span>
        <div>
          <h3 className="rsess__title">Acessos recentes</h3>
          <p className="rsess__desc">Dispositivos e locais que acessaram sua conta.</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto shrink-0 text-destructive" onClick={() => setConfirm(true)}>
          <LogOut className="size-4" aria-hidden="true" /> Sair de todos
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="rsess__empty">Nenhum acesso registrado ainda.</p>
      ) : (
        <ul className="rsess__list">
          {sessions.map((s) => (
            <li key={s.id} className="rsess__item">
              <span className="rsess__item-icon" aria-hidden="true"><Monitor className="size-4" /></span>
              <div className="rsess__item-main">
                <p className="rsess__item-device">{s.device}</p>
                <p className="rsess__item-meta">
                  <MapPin className="inline size-3.5" aria-hidden="true" /> {s.location} · {s.ip}
                </p>
              </div>
              <div className="rsess__item-when">
                <span>{fmt(s.lastUsedAt)}</span>
                <span className="rsess__item-uses">{count(s.uses, "acesso", "acessos")}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent aria-describedby="soa-desc">
          <DialogTitle>Sair de todos os aparelhos</DialogTitle>
          <DialogDescription id="soa-desc">
            Isso encerra a sessão em todos os dispositivos, inclusive este. Você precisará entrar de novo.
          </DialogDescription>
          <div className="modal-actions">
            <DialogClose asChild><Button variant="ghost" size="sm">Cancelar</Button></DialogClose>
            <Button variant="destructive" size="sm" disabled={pending} onClick={signOutAll}>
              {pending ? "Encerrando…" : "Sair de todos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
