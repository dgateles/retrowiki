import { rssForKind, rssResponse } from "@/lib/seo/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = await rssForKind("guide", {
    title: "RetroWiki — Guias e tutoriais",
    description: "Tutoriais, guias de compra e soluções de problemas escritos pela comunidade.",
    path: "/guias",
  });
  return rssResponse(xml);
}
