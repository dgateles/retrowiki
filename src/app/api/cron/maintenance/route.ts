import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { purgeOldIps } from "@/lib/ip";
import { pruneAuditLog } from "@/lib/panel";
import { autoCloseIdleAssignments } from "@/lib/assignments";
import { getStaffSettings, getAssignmentSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

// Retenção de IP (LGPD). IP é dado pessoal: expurga registros antigos.
const IP_RETENTION_DAYS = 365;

function authorized(req: NextRequest): boolean {
  if (!env.CRON_SECRET) return false;
  const got = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${env.CRON_SECRET}`;
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Tarefas periódicas de manutenção (protegido por CRON_SECRET):
 *  - Expurga IPs antigos (retenção LGPD).
 *  - Expurga o log de moderação conforme a configuração de staff.
 *  - Fecha atribuições ociosas conforme a configuração de atribuições.
 */
export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [staff, assign] = await Promise.all([getStaffSettings(), getAssignmentSettings()]);

  const purgedIps = await purgeOldIps(IP_RETENTION_DAYS);
  await pruneAuditLog(staff.logPruneDays);
  const closedAssignments = await autoCloseIdleAssignments(assign.autoCloseDays);

  return NextResponse.json({
    ok: true,
    purgedIps,
    auditLogPrunedAfterDays: staff.logPruneDays || null,
    assignmentsAutoClosedAfterDays: assign.autoCloseDays || null,
    closedAssignments,
  });
}
