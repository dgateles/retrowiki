import type { Metadata } from "next";
import { articleHref } from "@/lib/article-url";

// Builders de Metadata do Next. O canonical é relativo — o `metadataBase` do
// layout raiz (APP_URL = domínio canônico) o resolve para absoluto, fixando o
// conteúdo no retro.wiki.br e evitando duplicate content entre os dois domínios.
// A imagem de OG vem do `opengraph-image.tsx` da rota (Next injeta sozinho).

type ArticleSeo = {
  slug: string;
  title: string;
  summary: string | null;
  kind: "guide" | "blog";
  type?: string;
  publishedAt?: Date | null;
  updatedAt?: Date | null;
  authorName?: string;
};

/** Metadata completa e automática de um artigo (blog ou guia). */
export function articleMetadata(a: ArticleSeo): Metadata {
  const path = articleHref(a.kind, a.slug);
  const description = a.summary ?? undefined;
  return {
    title: a.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: a.title,
      description,
      url: path,
      publishedTime: a.publishedAt ? new Date(a.publishedAt).toISOString() : undefined,
      modifiedTime: a.updatedAt ? new Date(a.updatedAt).toISOString() : undefined,
      authors: a.authorName ? [a.authorName] : undefined,
      section: a.type,
    },
    twitter: { card: "summary_large_image", title: a.title, description },
  };
}

/** Metadata de uma página de listagem/estática (canonical + OG website + feed). */
export function pageMetadata(opts: { title: string; description?: string; path: string; feed?: string }): Metadata {
  const { title, description, path, feed } = opts;
  return {
    title,
    description,
    alternates: {
      canonical: path,
      ...(feed ? { types: { "application/rss+xml": feed } } : {}),
    },
    openGraph: { type: "website", title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}
