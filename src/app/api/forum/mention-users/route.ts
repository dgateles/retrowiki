import { NextRequest, NextResponse } from "next/server";
import { and, isNull, or, like } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/** Autocomplete de @menção: usuários por handle ou nome. Só para logados. */
export async function GET(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ users: [] }, { status: 401 });

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 1) return NextResponse.json({ users: [] });

  const rl = await checkRateLimit(`mention:${me.id}`, 60, 60_000);
  if (!rl.ok) return NextResponse.json({ users: [] }, { status: 429 });

  const term = `%${q.replace(/[%_]/g, "\\$&")}%`;
  try {
    const rows = await db
      .select({ id: users.handle, label: users.displayName, avatar: users.avatarUrl })
      .from(users)
      .where(and(isNull(users.deletedAt), or(like(users.handle, term), like(users.displayName, term))))
      .limit(6);
    return NextResponse.json({ users: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ users: [] });
  }
}
