import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listRules } from "@/lib/admin/promotions";
import { ROLE_LABEL, type Role } from "@/lib/admin/role-permissions";
import { RunPromotionsButton, RuleDeleteButton } from "@/components/admin/promotion-list-actions";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const rules = await listRules();

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Promoção de grupos</h1>
          <p className="page__note">Regras que movem o membro de papel ao atingir critérios.</p>
        </div>
        <div className="flex items-center gap-2">
          <RunPromotionsButton />
          <Button asChild size="sm">
            <Link href="/admin/promocoes/nova"><Plus className="size-4" aria-hidden="true" /> Nova regra</Link>
          </Button>
        </div>
      </div>

      {rules.length === 0 ? (
        <p className="empty mt-6">Nenhuma regra ainda.</p>
      ) : (
        <ul className="rule-list">
          {rules.map((r) => (
            <li key={r.id} className="rule-row">
              <span className={`rule-row__status${r.enabled ? " rule-row__status--on" : ""}`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="rule-row__name">{r.name}</p>
                <p className="rule-row__meta">
                  Move para {ROLE_LABEL[r.targetRole as Role]} · ordem {r.sortOrder}
                  {!r.enabled && " · desativada"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="ml-auto">
                <Link href={`/admin/promocoes/${r.id}`} aria-label={`Editar ${r.name}`}>
                  <Pencil className="size-4" aria-hidden="true" /> Editar
                </Link>
              </Button>
              <RuleDeleteButton id={r.id} name={r.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
