import { NextResponse } from "next/server";
import { listDevices } from "@/lib/devices";

export const dynamic = "force-dynamic";

/** Lista pública de consoles publicados (campos mínimos para os cartões).
 *  Usada pelo widget dinâmico "deviceGrid" do construtor de páginas. */
export async function GET() {
  const devices = await listDevices();
  const data = devices.map((d) => ({
    slug: d.slug,
    name: d.name,
    manufacturer: d.manufacturer,
    frontImage: d.frontImage ?? null,
  }));
  return NextResponse.json({ devices: data }, { headers: { "Cache-Control": "public, max-age=60" } });
}
