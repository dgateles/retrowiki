"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveDeletionRequestAction } from "@/lib/actions/privacy-actions";
import type { DeletionRequest } from "@/lib/privacy";
import { useConfirm } from "@/components/admin/confirm-dialog";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export function DeletionRequests({ requests }: { requests: DeletionRequest[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);

  async function resolve(id: number, decision: "completed" | "rejected", name: string) {
    if (decision === "completed" && !(await confirm({ title: "Anonimizar conta", description: `Anonimizar a conta de "${name}"? Os dados pessoais serão apagados e não há como reverter.`, confirmLabel: "Anonimizar", destructive: true }))) return;
    setBusy(true);
    const res = await resolveDeletionRequestAction(id, decision);
    setBusy(false);
    if (res.ok) { toast.success(decision === "completed" ? "Conta anonimizada." : "Pedido recusado."); router.refresh(); } else toast.error(res.error ?? "Falha.");
  }

  if (requests.length === 0) return <p className="muted mt-4">Nenhum pedido de exclusão em aberto.</p>;

  return (
    <ul className="pf-groups mt-4">
      {requests.map((r) => (
        <li key={r.id} className="pf-group">
          <div className="report-row">
            <div className="min-w-0">
              <p className="report-row__title">{r.userHandle ? <Link href={`/u/${r.userHandle}`} className="link-inline" target="_blank">{r.userName}</Link> : r.userName}</p>
              <p className="pf-field__meta">{fmt(r.createdAt)}{r.reason ? ` · "${r.reason.slice(0, 80)}"` : ""}</p>
            </div>
            <div className="report-row__actions">
              <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => resolve(r.id, "rejected", r.userName)}><Ban className="size-4" aria-hidden="true" /> Recusar</Button>
              <Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => resolve(r.id, "completed", r.userName)}><Check className="size-4" aria-hidden="true" /> Anonimizar conta</Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
