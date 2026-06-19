// Construtores de JSON-LD (Schema.org). Funções puras — recebem `base` (APP_URL)
// e os dados do domínio. Renderizados via <JsonLd>. Mantêm os @id consistentes
// para o Google resolver as referências entre Organization/WebSite/Article.

const trim = (s: string) => s.replace(/\/$/, "");
const abs = (base: string, url: string) => (url.startsWith("http") ? url : `${trim(base)}${url}`);

const SECTION_LABELS: Record<string, string> = {
  tutorial: "Tutorial",
  buying_guide: "Guia de compra",
  troubleshooting: "Solução de problemas",
  firmware: "Firmware",
  general: "Geral",
};

export function orgNode(base: string, logoPath = "/icon", sameAs: string[] = []) {
  const b = trim(base);
  return {
    "@type": "Organization",
    "@id": `${b}/#organization`,
    name: "RetroWiki",
    url: b,
    description: "Wiki comunitária de handhelds retrô: catálogo de consoles, tutoriais, guias de compra e firmware.",
    logo: { "@type": "ImageObject", "@id": `${b}/#logo`, url: `${b}${logoPath}`, caption: "RetroWiki" },
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteNode(base: string) {
  const b = trim(base);
  return {
    "@type": "WebSite",
    "@id": `${b}/#website`,
    url: b,
    name: "RetroWiki",
    inLanguage: "pt-BR",
    publisher: { "@id": `${b}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${b}/buscar?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

/** Grafo único do site (Organization + WebSite) para o layout raiz. */
export function siteGraph(base: string, opts: { logoPath?: string; sameAs?: string[] } = {}) {
  return { "@context": "https://schema.org", "@graph": [orgNode(base, opts.logoPath, opts.sameAs), websiteNode(base)] };
}

export type ArticleInput = {
  base: string;
  canonicalPath: string; // ex.: /blog/slug ou /guias/slug
  title: string;
  summary: string | null;
  kind: "guide" | "blog";
  type: string;
  coverImage: string | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  authorName: string;
  authorHandle: string;
};

export function articleSchema(i: ArticleInput) {
  const b = trim(i.base);
  const url = `${b}${i.canonicalPath}`;
  const s: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": i.kind === "blog" ? "BlogPosting" : "TechArticle",
    "@id": url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: i.title,
    inLanguage: "pt-BR",
    url,
    author: { "@type": "Person", name: i.authorName, url: `${b}/u/${i.authorHandle}` },
    publisher: { "@type": "Organization", "@id": `${b}/#organization`, name: "RetroWiki", logo: { "@type": "ImageObject", url: `${b}/icon` } },
    articleSection: SECTION_LABELS[i.type] ?? i.type,
  };
  if (i.summary) s.description = i.summary;
  if (i.coverImage) s.image = abs(b, i.coverImage);
  if (i.publishedAt) s.datePublished = new Date(i.publishedAt).toISOString();
  if (i.updatedAt) s.dateModified = new Date(i.updatedAt).toISOString();
  return s;
}

export type Crumb = { name: string; path: string };
export function breadcrumbSchema(base: string, items: Crumb[]) {
  const b = trim(base);
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({ "@type": "ListItem", position: idx + 1, name: it.name, item: abs(b, it.path) })),
  };
}

export type ProductInput = {
  base: string;
  slug: string;
  name: string;
  manufacturer: string;
  releaseYear: number | null;
  priceUsd: number | null;
  description: string | null;
  images: { url: string; alt?: string }[];
};

export function productSchema(i: ProductInput) {
  const b = trim(i.base);
  const url = `${b}/consoles/${i.slug}`;
  const s: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": url,
    url,
    name: i.name,
    brand: { "@type": "Brand", name: i.manufacturer },
    category: "Handheld game console",
  };
  if (i.description) s.description = i.description;
  if (i.images.length) s.image = i.images.map((img) => abs(b, img.url));
  if (i.releaseYear) s.releaseDate = String(i.releaseYear);
  if (i.priceUsd != null) {
    s.offers = {
      "@type": "Offer",
      priceCurrency: "USD",
      price: i.priceUsd,
      availability: "https://schema.org/InStock",
      url,
      seller: { "@type": "Organization", "@id": `${b}/#organization`, name: "RetroWiki" },
    };
  }
  return s;
}
