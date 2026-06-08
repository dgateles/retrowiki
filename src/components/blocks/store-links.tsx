import { inArray } from "drizzle-orm";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { stores } from "@/db/schema";

const TRUST = {
  verified: { label: "Verificado", mod: "store__trust--verified" },
  trusted: { label: "Confiável", mod: "store__trust--trusted" },
  caution: { label: "Cautela", mod: "store__trust--caution" },
} as const;

export async function StoreLinksBlock({ storeIds }: { storeIds: number[] }) {
  let rows: (typeof stores.$inferSelect)[] = [];
  try {
    rows = await db.select().from(stores).where(inArray(stores.id, storeIds));
  } catch {
    rows = [];
  }
  if (rows.length === 0) return null;

  return (
    <section aria-label="Onde comprar" className="stores">
      {rows.map((s) => {
        const t = TRUST[s.trust];
        return (
          <a
            key={s.id}
            href={`https://${s.domain}`}
            target="_blank"
            rel={s.affiliate ? "sponsored nofollow noopener" : "nofollow noopener"}
            className="store"
          >
            <span className="store__name">{s.name}</span>
            <span className={`store__trust ${t.mod}`}>
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              {t.label}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </span>
          </a>
        );
      })}
    </section>
  );
}
