import { listBulkMails } from "@/lib/bulk-mail";
import { BulkMailForm } from "@/components/admin/bulk-mail-form";

export const dynamic = "force-dynamic";

const fmt = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
const AUD: Record<string, string> = { all: "Todos", member: "Membros", contributor: "Colaboradores", moderator: "Moderadores", admin: "Administradores" };

export default async function BulkMailPage() {
  const log = await listBulkMails();
  return (
    <>
      <h1 className="page__title">E-mail em massa</h1>
      <p className="page__note">Envie um comunicado por e-mail a um grupo de membros via Resend.</p>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Novo envio</h2>
        <div className="mt-3"><BulkMailForm /></div>
      </section>

      <section className="member-panel mt-6">
        <h2 className="member-panel__title">Envios recentes</h2>
        {log.length === 0 ? (
          <p className="muted mt-3">Nenhum envio ainda.</p>
        ) : (
          <div className="modlog mt-3">
            <div className="modlog__head" style={{ gridTemplateColumns: "1.5fr 1fr auto auto" }}>
              <span>Assunto</span><span>Audiência</span><span>Enviados</span><span>Data</span>
            </div>
            {log.map((m) => (
              <div key={m.id} className="modlog__row" style={{ gridTemplateColumns: "1.5fr 1fr auto auto" }}>
                <span className="truncate">{m.subject}</span>
                <span className="truncate">{AUD[m.audience] ?? m.audience}</span>
                <span className="font-medium">{m.sentCount}</span>
                <span className="muted">{fmt(m.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
