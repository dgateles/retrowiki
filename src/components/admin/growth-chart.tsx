import type { GrowthSeries } from "@/lib/panel";

/** Mini gráfico de barras (CSS) do crescimento por dia. */
export function GrowthChart({ data }: { data: GrowthSeries }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => Math.max(d.members, d.guides)));
  const totalMembers = data.reduce((s, d) => s + d.members, 0);
  const totalGuides = data.reduce((s, d) => s + d.guides, 0);

  return (
    <section className="member-panel mt-6" aria-labelledby="growth-title">
      <div className="page__head">
        <h2 id="growth-title" className="member-panel__title">Crescimento ({data.length} dias)</h2>
        <p className="growth__legend">
          <span className="growth__key growth__key--members">Membros: {totalMembers}</span>
          <span className="growth__key growth__key--guides">Guias: {totalGuides}</span>
        </p>
      </div>
      <div className="growth mt-4" role="img" aria-label={`Novos membros (${totalMembers}) e guias (${totalGuides}) por dia nos últimos ${data.length} dias`}>
        {data.map((d, i) => (
          <div key={i} className="growth__col" title={`${d.label}: ${d.members} membros, ${d.guides} guias`}>
            <div className="growth__bars">
              <span className="growth__bar growth__bar--members" style={{ height: `${(d.members / max) * 100}%` }} />
              <span className="growth__bar growth__bar--guides" style={{ height: `${(d.guides / max) * 100}%` }} />
            </div>
            <span className="growth__label">{d.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
