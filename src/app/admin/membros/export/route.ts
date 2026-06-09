import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";

function csvCell(v: unknown): string {
  let s = String(v ?? "");
  // Anti-injeção de fórmula: planilhas executam células iniciadas por estes
  // caracteres. Prefixa com apóstrofo para neutralizar.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  try {
    await requireRole("admin");
  } catch {
    return new Response("Acesso restrito.", { status: 403 });
  }

  const rows = await db
    .select({
      handle: users.handle,
      displayName: users.displayName,
      email: users.email,
      role: users.role,
      reputation: users.reputation,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.id));

  const header = ["handle", "nome", "email", "papel", "reputacao", "entrou_em"];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push([
      csvCell(r.handle),
      csvCell(r.displayName),
      csvCell(r.email),
      csvCell(r.role),
      csvCell(r.reputation),
      csvCell(new Date(r.createdAt).toISOString()),
    ].join(","));
  }
  const body = "﻿" + lines.join("\r\n"); // BOM para Excel abrir UTF-8

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membros.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
