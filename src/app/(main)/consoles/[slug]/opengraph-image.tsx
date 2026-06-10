import { ImageResponse } from "next/og";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { devices } from "@/db/schema";

export const runtime = "nodejs";
export const alt = "Console na RetroWiki";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let name = "Console";
  let manufacturer = "";
  try {
    const [d] = await db.select({ name: devices.name, manufacturer: devices.manufacturer }).from(devices).where(eq(devices.slug, slug)).limit(1);
    if (d?.name) {
      name = d.name;
      manufacturer = d.manufacturer ?? "";
    }
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
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {manufacturer ? <div style={{ display: "flex", fontSize: 30, color: "#8b98a5" }}>{manufacturer}</div> : null}
          <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: "90%" }}>{name}</div>
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#8b98a5" }}>
          Ficha técnica, guias e tutoriais
        </div>
      </div>
    ),
    { ...size },
  );
}
