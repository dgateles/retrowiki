import "server-only";
import { listPublishedArticles } from "@/lib/articles";
import { articleHref } from "@/lib/article-url";

const BASE = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Gera um feed RSS 2.0 para um tipo de artigo (blog ou guia). */
export async function rssForKind(kind: "guide" | "blog", meta: { title: string; description: string; path: string }): Promise<string> {
  let items: Awaited<ReturnType<typeof listPublishedArticles>>["items"] = [];
  try {
    items = (await listPublishedArticles({ kind, page: 1 })).items;
  } catch {
    /* feed vazio em caso de erro de banco */
  }

  const entries = items
    .map((a) => {
      const url = `${BASE}${articleHref(kind, a.slug)}`;
      return [
        "    <item>",
        `      <title>${esc(a.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        a.publishedAt ? `      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : "",
        a.summary ? `      <description>${esc(a.summary)}</description>` : "",
        a.authorName ? `      <dc:creator>${esc(a.authorName)}</dc:creator>` : "",
        "    </item>",
      ].filter(Boolean).join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(meta.title)}</title>
    <link>${BASE}${meta.path}</link>
    <description>${esc(meta.description)}</description>
    <language>pt-BR</language>
    <atom:link href="${BASE}${meta.path}/feed.xml" rel="self" type="application/rss+xml" />
${entries}
  </channel>
</rss>`;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=600" },
  });
}
