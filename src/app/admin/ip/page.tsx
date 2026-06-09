import Link from "next/link";
import { Search } from "lucide-react";
import { lookupIp, searchMembers } from "@/lib/ip";
import { geoForIps } from "@/lib/geo";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

export default async function IpToolsPage({ searchParams }: { searchParams: Promise<{ ip?: string; member?: string }> }) {
  const sp = await searchParams;
  const ipQuery = sp.ip?.trim() ?? "";
  const memberQuery = sp.member?.trim() ?? "";
  const ipResults = ipQuery ? await lookupIp(ipQuery) : [];
  const memberResults = memberQuery ? await searchMembers(memberQuery) : [];
  const geo = ipResults.length ? await geoForIps(ipResults.map((r) => r.ip)) : new Map<string, string>();

  return (
    <>
      <h1 className="page__title">Ferramentas de IP</h1>
      <p className="page__note">Consulta forense por IP e por membro. Dado pessoal (LGPD): use com responsabilidade.</p>

      <section className="iptool">
        <h2 className="iptool__title">Busca por IP</h2>
        <form method="get" role="search" className="iptool__form">
          <div className="search flex-1">
            <Search className="search__icon" aria-hidden="true" />
            <input type="search" name="ip" defaultValue={ipQuery} placeholder="Ex.: 200.1.2.3 ou 200.1.* (curinga)" aria-label="IP" className="search__input" />
          </div>
          <Button type="submit" size="sm">Buscar</Button>
        </form>
        {ipQuery && (
          ipResults.length === 0 ? (
            <p className="muted mt-3">Nenhum registro para esse IP.</p>
          ) : (
            <div className="iptable iptable--geo mt-3">
              <div className="iptable__head iptable__head--geo">
                <span>IP</span><span>Membro</span><span>Local</span><span>Usos</span><span>Último uso</span>
              </div>
              {ipResults.map((r, i) => (
                <div key={`${r.userId}-${r.ip}-${i}`} className="iptable__row iptable__row--geo">
                  <span className="iptable__ip">{r.ip}</span>
                  <Link href={`/admin/membros/${r.userId}`} className="link-inline">{r.displayName} (@{r.handle})</Link>
                  <span className="muted">{geo.get(r.ip) || "—"}</span>
                  <span>{r.uses}</span>
                  <span className="muted">{fmt(r.lastUsedAt)}</span>
                </div>
              ))}
            </div>
          )
        )}
      </section>

      <section className="iptool">
        <h2 className="iptool__title">Busca por membro</h2>
        <p className="muted">Veja todos os IPs usados por um membro.</p>
        <form method="get" role="search" className="iptool__form">
          <div className="search flex-1">
            <Search className="search__icon" aria-hidden="true" />
            <input type="search" name="member" defaultValue={memberQuery} placeholder="Nome ou @handle" aria-label="Membro" className="search__input" />
          </div>
          <Button type="submit" size="sm">Buscar</Button>
        </form>
        {memberQuery && (
          memberResults.length === 0 ? (
            <p className="muted mt-3">Nenhum membro encontrado.</p>
          ) : (
            <ul className="iptool__members mt-3">
              {memberResults.map((m) => (
                <li key={m.id}>
                  <Link href={`/admin/membros/${m.id}`} className="iptool__member">
                    {m.displayName} <span className="muted">@{m.handle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        )}
      </section>
    </>
  );
}
