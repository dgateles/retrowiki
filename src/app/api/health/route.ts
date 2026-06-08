import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Liveness probe usado pelo healthcheck do Docker/Coolify.
export async function GET() {
  return NextResponse.json({ status: "ok", ts: Date.now() });
}
