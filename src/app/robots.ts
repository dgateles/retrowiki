import type { MetadataRoute } from "next";

const BASE = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Áreas privadas (UI logada/admin/interno) — nunca expor a crawler nenhum.
const PRIVATE = ["/api/", "/estudio", "/moderacao", "/notificacoes", "/conta", "/auth/", "/admin", "/construtor"];

// Crawlers de busca por IA que devem ter acesso TOTAL ao conteúdo público
// (citação em tempo real no ChatGPT/SearchGPT, Perplexity, AI Overviews, Copilot).
const AI_SEARCH = [
  "GPTBot", "OAI-SearchBot", "ChatGPT-User", // OpenAI
  "ClaudeBot", "Claude-SearchBot", // Anthropic
  "PerplexityBot", "Perplexity-User", // Perplexity
  "Google-Extended", // Gemini / AI Overviews (separado do Googlebot)
  "Amazonbot", "Applebot", "Applebot-Extended", "meta-externalagent", "YouBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Regra padrão (Googlebot, Bingbot e todos os demais).
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Crawlers de IA: liberados no conteúdo público, bloqueados no privado.
      ...AI_SEARCH.map((ua) => ({ userAgent: ua, allow: "/", disallow: PRIVATE })),
      // Crawlers só de treinamento em massa: bloqueados (não afeta citação por IA).
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "anthropic-ai", disallow: "/" },
      { userAgent: "cohere-ai", disallow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
