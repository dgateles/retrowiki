import { NextRequest, NextResponse } from "next/server";
import { searchAll, type SearchScope } from "@/lib/search";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function parseScope(v: string | null): SearchScope {
  return v === "consoles" || v === "guias" ? v : "tudo";
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ devices: [], articles: [] });

  const rl = await checkRateLimit(`search:${clientIp(req)}`, 40, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });

  const results = await searchAll(q, parseScope(req.nextUrl.searchParams.get("escopo")));
  return NextResponse.json(results, { headers: { "Cache-Control": "no-store" } });
}
