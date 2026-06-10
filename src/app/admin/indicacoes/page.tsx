import Link from "next/link";
import { listTopReferrers, getTotalReferrals } from "@/lib/referrals";

export const dynamic = "force-dynamic";

export default async function ReferralsAdminPage() {
  const [referrers, total] = await Promise.all([listTopReferrers(), getTotalReferrals()]);
  return (
    <>
      <h1 className="page__title">Indicações</h1>
      <p className="page__note">Membros que trouxeram novos cadastros pelo link de indicação. Total: {total}.</p>

      {referrers.length === 0 ? (
        <p className="empty mt-6">Nenhuma indicação registrada ainda.</p>
      ) : (
        <div className="modlog mt-6">
          <div className="modlog__head" style={{ gridTemplateColumns: "1fr auto" }}>
            <span>Membro</span><span>Indicações</span>
          </div>
          {referrers.map((r) => (
            <div key={r.id} className="modlog__row" style={{ gridTemplateColumns: "1fr auto" }}>
              <span className="truncate"><Link href={`/u/${r.handle}`} className="link-inline">{r.name}</Link></span>
              <span className="font-medium">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
