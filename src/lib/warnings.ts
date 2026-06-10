import "server-only";
import { and, asc, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { warningReasons, warningActions, userWarnings, users } from "@/db/schema";
import { getWarningSettings } from "@/lib/settings";

// ── Motivos ────────────────────────────────────────────────────────────────

export type WarningReason = {
  id: number;
  name: string;
  points: number;
  removeAfterHours: number | null;
  deductReputation: number;
  defaultNote: string;
  sortOrder: number;
};

const DEFAULT_REASONS = [
  { name: "Spam", points: 2, sortOrder: 1 },
  { name: "Linguagem inapropriada", points: 1, sortOrder: 2 },
  { name: "Comportamento abusivo", points: 3, sortOrder: 3 },
  { name: "Off-topic", points: 1, sortOrder: 4 },
];

let seeded = false;
export async function ensureReasons(): Promise<void> {
  if (seeded) return;
  try {
    const [row] = await db.select({ id: warningReasons.id }).from(warningReasons).limit(1);
    if (!row) await db.insert(warningReasons).values(DEFAULT_REASONS);
    seeded = true;
  } catch {
    // ignora
  }
}

function rowToReason(r: typeof warningReasons.$inferSelect): WarningReason {
  return { id: r.id, name: r.name, points: r.points, removeAfterHours: r.removeAfterHours, deductReputation: r.deductReputation, defaultNote: r.defaultNote, sortOrder: r.sortOrder };
}

export async function listReasons(): Promise<WarningReason[]> {
  await ensureReasons();
  try {
    const rows = await db.select().from(warningReasons).orderBy(asc(warningReasons.sortOrder), asc(warningReasons.id));
    return rows.map(rowToReason);
  } catch {
    return [];
  }
}

export async function getReason(id: number): Promise<WarningReason | null> {
  try {
    const [r] = await db.select().from(warningReasons).where(eq(warningReasons.id, id)).limit(1);
    return r ? rowToReason(r) : null;
  } catch {
    return null;
  }
}

export type ReasonInput = { name: string; points: number; removeAfterHours: number | null; deductReputation: number; defaultNote: string };

export async function createReason(input: ReasonInput): Promise<number | null> {
  try {
    await ensureReasons();
    const all = await db.select({ s: warningReasons.sortOrder }).from(warningReasons);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(warningReasons).values({ ...input, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateReason(id: number, input: ReasonInput): Promise<boolean> {
  try {
    await db.update(warningReasons).set(input).where(eq(warningReasons.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteReason(id: number): Promise<boolean> {
  try {
    await db.delete(warningReasons).where(eq(warningReasons.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Ações ────────────────────────────────────────────────────────────────

export type WarningAction = { id: number; points: number; restrictHours: number; banHours: number; moderateHours: number };

export async function listActions(): Promise<WarningAction[]> {
  try {
    const rows = await db.select().from(warningActions).orderBy(asc(warningActions.points));
    return rows.map((r) => ({ id: r.id, points: r.points, restrictHours: r.restrictHours, banHours: r.banHours, moderateHours: r.moderateHours }));
  } catch {
    return [];
  }
}

export type ActionInput = { points: number; restrictHours: number; banHours: number; moderateHours: number };

export async function createAction(input: ActionInput): Promise<number | null> {
  try {
    const [res] = await db.insert(warningActions).values(input).onDuplicateKeyUpdate({ set: { restrictHours: input.restrictHours, banHours: input.banHours, moderateHours: input.moderateHours } });
    return (res as unknown as { insertId: number }).insertId || 0;
  } catch {
    return null;
  }
}

export async function deleteAction(id: number): Promise<boolean> {
  try {
    await db.delete(warningActions).where(eq(warningActions.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Registros e enforcement ──────────────────────────────────────────────

export type UserWarning = { id: number; reasonName: string; points: number; note: string; acknowledged: boolean; expiresAt: Date | null; createdAt: Date };

export async function listUserWarnings(userId: number): Promise<UserWarning[]> {
  try {
    const rows = await db.select().from(userWarnings).where(eq(userWarnings.userId, userId)).orderBy(desc(userWarnings.createdAt));
    return rows.map((r) => ({ id: r.id, reasonName: r.reasonName, points: r.points, note: r.note, acknowledged: r.acknowledged, expiresAt: r.expiresAt, createdAt: r.createdAt }));
  } catch {
    return [];
  }
}

/** Pontos de advertência ativos (não expirados) de um membro. */
export async function activePoints(userId: number): Promise<number> {
  try {
    const [row] = await db
      .select({ n: sql<number>`COALESCE(SUM(${userWarnings.points}), 0)` })
      .from(userWarnings)
      .where(and(eq(userWarnings.userId, userId), or(isNull(userWarnings.expiresAt), gt(userWarnings.expiresAt, new Date()))));
    return Number(row?.n ?? 0);
  } catch {
    return 0;
  }
}

const FAR_FUTURE = new Date("9999-12-31T00:00:00Z");

/** Aplica a ação correspondente aos pontos ativos do membro. */
export async function applyActions(userId: number): Promise<void> {
  try {
    const points = await activePoints(userId);
    const actions = await listActions();
    let chosen: WarningAction | null = null;
    for (const a of actions) {
      if (points >= a.points) chosen = a; // a maior cujo limiar foi atingido
    }
    if (!chosen) return;

    const patch: { postingRestrictedUntil?: Date; contentModeratedUntil?: Date; isSuspended?: boolean } = {};
    if (chosen.restrictHours !== 0) {
      patch.postingRestrictedUntil = chosen.restrictHours < 0 ? FAR_FUTURE : new Date(Date.now() + chosen.restrictHours * 3600_000);
    }
    if (chosen.moderateHours !== 0) {
      patch.contentModeratedUntil = chosen.moderateHours < 0 ? FAR_FUTURE : new Date(Date.now() + chosen.moderateHours * 3600_000);
    }
    if (chosen.banHours !== 0) {
      patch.isSuspended = true;
    }
    if (Object.keys(patch).length) {
      await db.update(users).set(patch).where(eq(users.id, userId));
    }
  } catch {
    // nunca bloquear
  }
}

/** Emite uma advertência: registra, deduz reputação e aplica ações. */
export async function issueWarning(userId: number, reasonId: number, points: number, note: string, issuedById: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const reason = await getReason(reasonId);
    if (!reason) return { ok: false, error: "Motivo inválido." };
    const expiresAt = reason.removeAfterHours && reason.removeAfterHours > 0 ? new Date(Date.now() + reason.removeAfterHours * 3600_000) : null;
    await db.insert(userWarnings).values({
      userId,
      reasonId,
      reasonName: reason.name,
      points: Math.max(0, Math.floor(points)),
      note: note.slice(0, 500),
      issuedById,
      expiresAt,
    });
    if (reason.deductReputation > 0) {
      await db.update(users).set({ reputation: sql`GREATEST(${users.reputation} - ${reason.deductReputation}, 0)` }).where(eq(users.id, userId));
    }
    await applyActions(userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao emitir." };
  }
}

/** Há advertências não confirmadas pelo membro? */
export async function hasUnacknowledgedWarnings(userId: number): Promise<boolean> {
  try {
    const [row] = await db.select({ id: userWarnings.id }).from(userWarnings).where(and(eq(userWarnings.userId, userId), eq(userWarnings.acknowledged, false))).limit(1);
    return Boolean(row);
  } catch {
    return false;
  }
}

/** Marca todas as advertências do membro como confirmadas. */
export async function acknowledgeAllWarnings(userId: number): Promise<void> {
  try {
    await db.update(userWarnings).set({ acknowledged: true }).where(and(eq(userWarnings.userId, userId), eq(userWarnings.acknowledged, false)));
  } catch {
    // best-effort
  }
}

/** O membro está com a postagem restrita? */
export async function isPostingRestricted(userId: number): Promise<boolean> {
  try {
    const [u] = await db.select({ until: users.postingRestrictedUntil }).from(users).where(eq(users.id, userId)).limit(1);
    return Boolean(u?.until && new Date(u.until) > new Date());
  } catch {
    return false;
  }
}

/** O conteúdo novo do membro deve ir à revisão (advertência "moderar conteúdo")? */
export async function isContentModerated(userId: number): Promise<boolean> {
  try {
    const [u] = await db.select({ until: users.contentModeratedUntil }).from(users).where(eq(users.id, userId)).limit(1);
    return Boolean(u?.until && new Date(u.until) > new Date());
  } catch {
    return false;
  }
}

/** Gate de postagem: restrição + confirmação obrigatória. */
export async function postingGate(userId: number): Promise<{ ok: boolean; error?: string }> {
  if (await isPostingRestricted(userId)) {
    return { ok: false, error: "Sua conta está com a postagem restrita por advertências." };
  }
  const settings = await getWarningSettings();
  if (settings.mustAcknowledge && (await hasUnacknowledgedWarnings(userId))) {
    return { ok: false, error: "Confirme suas advertências em Configurações › Advertências antes de publicar." };
  }
  return { ok: true };
}
