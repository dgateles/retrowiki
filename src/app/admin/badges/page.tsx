import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBadgesWithCounts } from "@/lib/badges";
import { BadgeIcon } from "@/components/admin/badge-icon";
import { BadgeDelete } from "@/components/admin/badge-delete";

export const dynamic = "force-dynamic";

const TIER_LABEL: Record<string, string> = { bronze: "Bronze", silver: "Prata", gold: "Ouro" };

export default async function BadgesPage() {
  const badges = await listBadgesWithCounts();

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Badges</h1>
          <p className="page__note">Catálogo de conquistas. Atribua-as nas Regras ou conceda manualmente.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/badges/nova"><Plus className="size-4" aria-hidden="true" /> Nova badge</Link>
        </Button>
      </div>

      <ul className="rank-list">
        {badges.map((b) => (
          <li key={b.id} className="rank-row">
            <span className={`badge-chip badge-chip--${b.tier}`} aria-hidden="true"><BadgeIcon name={b.icon} image={b.image} className="size-5" /></span>
            <div className="min-w-0">
              <p className="rank-row__name">{b.name}</p>
              <p className="rank-row__meta">
                {b.count} membro(s) · {TIER_LABEL[b.tier]}
                {b.manuallyAwardable && " · manual"}
              </p>
            </div>
            <Link href={`/admin/badges/${b.id}`} className="rule-row__edit" aria-label={`Editar ${b.name}`}>
              <Pencil className="size-4" aria-hidden="true" /> Editar
            </Link>
            <BadgeDelete id={b.id} name={b.name} />
          </li>
        ))}
      </ul>
    </>
  );
}
