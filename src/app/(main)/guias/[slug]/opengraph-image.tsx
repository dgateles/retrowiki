import { ImageResponse } from "next/og";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";

export const runtime = "nodejs";
export const alt = "Guia da RetroWiki";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let title = "Guia";
  try {
    const [a] = await db.select({ title: articles.title }).from(articles).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).limit(1);
    if (a?.title) title = a.title;
  } catch {
    /* usa o fallback */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b0f14 0%, #11161d 100%)",
          padding: "64px",
          color: "#e6edf3",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 32, fontWeight: 700, color: "#34d399" }}>
          RetroWiki
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: "90%" }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8b98a5" }}>
          Guias e tutoriais de consoles retro
        </div>
      </div>
    ),
    { ...size },
  );
}
