import { inArray } from "drizzle-orm";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { db } from "@/db";
import { stores } from "@/db/schema";

const TRUST = {
  verified: { label: "Verificado", cls: "text-emerald-600 dark:text-emerald-400" },
  trusted: { label: "Confiável", cls: "text-sky-600 dark:text-sky-400" },
  caution: { label: "Cautela", cls: "text-amber-600 dark:text-amber-400" },
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
    <section aria-label="Onde comprar" className="my-6 grid gap-3 sm:grid-cols-2">
      {rows.map((s) => {
        const t = TRUST[s.trust];
        return (
          <a
            key={s.id}
            href={`https://${s.domain}`}
            target="_blank"
            rel={s.affiliate ? "sponsored nofollow noopener" : "nofollow noopener"}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-2"
          >
            <span className="font-medium">{s.name}</span>
            <span className={`inline-flex items-center gap-1 text-xs ${t.cls}`}>
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
