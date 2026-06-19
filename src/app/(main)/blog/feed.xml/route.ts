import { rssForKind, rssResponse } from "@/lib/seo/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const xml = await rssForKind("blog", {
    title: "RetroWiki — Blog",
    description: "Novidades, bastidores e artigos da equipe e da comunidade RetroWiki.",
    path: "/blog",
  });
  return rssResponse(xml);
}
