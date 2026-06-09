import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRankRows, getRankMemberCounts } from "@/lib/admin/ranks-db";
import { RankIcon } from "@/components/admin/rank-icon";
import { RankDelete } from "@/components/admin/rank-delete";

export const dynamic = "force-dynamic";

export default async function RanksPage() {
  const rows = await getRankRows();
  const counts = await getRankMemberCounts(rows);

  return (
    <>
      <div className="page__head">
        <div>
          <h1 className="page__title">Ranks</h1>
          <p className="page__note">Níveis alcançados por reputação. Os pontos vêm das Regras de conquista.</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/ranks/novo"><Plus className="size-4" aria-hidden="true" /> Novo rank</Link>
        </Button>
      </div>

      <ul className="rank-list">
        {rows.map((r) => (
          <li key={r.id} className="rank-row">
            <span className="rank-badge" aria-hidden="true"><RankIcon name={r.icon} className="size-5" /></span>
            <div className="min-w-0">
              <p className="rank-row__name">{r.title}</p>
              <p className="rank-row__meta">{counts[r.id] ?? 0} membro(s) · {r.points} pontos</p>
            </div>
            <Link href={`/admin/ranks/${r.id}`} className="rule-row__edit" aria-label={`Editar ${r.title}`}>
              <Pencil className="size-4" aria-hidden="true" /> Editar
            </Link>
            <RankDelete id={r.id} title={r.title} />
          </li>
        ))}
      </ul>
    </>
  );
}
