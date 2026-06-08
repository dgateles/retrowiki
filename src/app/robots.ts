import type { MetadataRoute } from "next";

const BASE = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/estudio", "/moderacao", "/notificacoes", "/conta", "/auth/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
