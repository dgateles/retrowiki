import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { reputationLevels } from "@/db/schema";

export type RepLevel = { id: number; title: string; points: number; badge: string | null; sortOrder: number };

const DEFAULTS: Omit<RepLevel, "id">[] = [
  { title: "Ruim", points: -20, badge: null, sortOrder: 0 },
  { title: "Fraco", points: -10, badge: null, sortOrder: 1 },
  { title: "Neutro", points: 0, badge: null, sortOrder: 2 },
  { title: "Bom", points: 10, badge: null, sortOrder: 3 },
  { title: "Excelente", points: 20, badge: null, sortOrder: 4 },
];

let seeded = false;

export async function ensureLevels(): Promise<void> {
  if (seeded) return;
  try {
    const [row] = await db.select({ id: reputationLevels.id }).from(reputationLevels).limit(1);
    if (!row) await db.insert(reputationLevels).values(DEFAULTS);
    seeded = true;
  } catch {
    // ignora
  }
}

export async function listLevels(): Promise<RepLevel[]> {
  await ensureLevels();
  try {
    return await db.select().from(reputationLevels).orderBy(asc(reputationLevels.points), asc(reputationLevels.id));
  } catch {
    return [];
  }
}

export async function getLevel(id: number): Promise<RepLevel | null> {
  try {
    const [r] = await db.select().from(reputationLevels).where(eq(reputationLevels.id, id)).limit(1);
    return r ?? null;
  } catch {
    return null;
  }
}

/** Nível correspondente a uma reputação: o de maior limiar <= reputação. */
export async function levelForReputation(rep: number): Promise<RepLevel | null> {
  const levels = await listLevels();
  let match: RepLevel | null = null;
  for (const l of levels) {
    if (rep >= l.points) match = l;
  }
  return match;
}

export type LevelInput = { title: string; points: number; badge: string | null };

export async function createLevel(input: LevelInput): Promise<number | null> {
  try {
    await ensureLevels();
    const all = await db.select({ s: reputationLevels.sortOrder }).from(reputationLevels);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(reputationLevels).values({ ...input, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateLevel(id: number, input: LevelInput): Promise<boolean> {
  try {
    await db.update(reputationLevels).set(input).where(eq(reputationLevels.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteLevel(id: number): Promise<boolean> {
  try {
    await db.delete(reputationLevels).where(eq(reputationLevels.id, id));
    return true;
  } catch {
    return false;
  }
}
