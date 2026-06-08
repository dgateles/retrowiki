import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices, articles, users } from "@/db/schema";

export const dynamic = "force-dynamic";

const BASE = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/consoles`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/guias`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/consoles/comparar`, changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const [devs, arts, authors] = await Promise.all([
      db.select({ slug: devices.slug, updatedAt: devices.updatedAt }).from(devices).where(eq(devices.status, "published")),
      db.select({ slug: articles.slug, updatedAt: articles.updatedAt }).from(articles).where(eq(articles.status, "published")),
      db.selectDistinct({ handle: users.handle }).from(users),
    ]);

    for (const d of devs) routes.push({ url: `${BASE}/consoles/${d.slug}`, lastModified: d.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    for (const a of arts) routes.push({ url: `${BASE}/guias/${a.slug}`, lastModified: a.updatedAt, changeFrequency: "weekly", priority: 0.7 });
    for (const u of authors) routes.push({ url: `${BASE}/u/${u.handle}`, changeFrequency: "monthly", priority: 0.4 });
  } catch {
    // banco indisponível (ex.: build estático) — retorna só as rotas fixas
  }

  return routes;
}
