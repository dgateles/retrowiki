import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { staffCategories, staffEntries, users } from "@/db/schema";
import { roleLabel } from "@/lib/ranks";

export type Layout = "grid" | "list" | "twocol";

export type StaffCard = {
  handle: string | null;
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
};

export type StaffCategory = { id: number; title: string; layout: Layout; cards: StaffCard[] };

// ── Admin: categorias ──────────────────────────────────────────────────────

export type CategoryRow = { id: number; title: string; layout: Layout; sortOrder: number };

export async function listCategories(): Promise<CategoryRow[]> {
  try {
    const rows = await db.select().from(staffCategories).orderBy(asc(staffCategories.sortOrder), asc(staffCategories.id));
    return rows.map((r) => ({ id: r.id, title: r.title, layout: r.layout as Layout, sortOrder: r.sortOrder }));
  } catch {
    return [];
  }
}

export async function createCategory(title: string, layout: Layout): Promise<number | null> {
  try {
    const all = await db.select({ s: staffCategories.sortOrder }).from(staffCategories);
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(staffCategories).values({ title, layout, sortOrder });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateCategory(id: number, title: string, layout: Layout): Promise<boolean> {
  try {
    await db.update(staffCategories).set({ title, layout }).where(eq(staffCategories.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    await db.delete(staffEntries).where(eq(staffEntries.categoryId, id));
    await db.delete(staffCategories).where(eq(staffCategories.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Troca a ordem de uma categoria com a vizinha (dir: -1 sobe, 1 desce). */
export async function moveCategory(id: number, dir: -1 | 1): Promise<boolean> {
  try {
    const cats = await db.select().from(staffCategories).orderBy(asc(staffCategories.sortOrder), asc(staffCategories.id));
    const i = cats.findIndex((c) => c.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cats.length) return false;
    await db.update(staffCategories).set({ sortOrder: cats[j].sortOrder }).where(eq(staffCategories.id, cats[i].id));
    await db.update(staffCategories).set({ sortOrder: cats[i].sortOrder }).where(eq(staffCategories.id, cats[j].id));
    return true;
  } catch {
    return false;
  }
}

/** Troca a ordem de uma entrada com a vizinha na mesma categoria. */
export async function moveEntry(id: number, dir: -1 | 1): Promise<boolean> {
  try {
    const [entry] = await db.select().from(staffEntries).where(eq(staffEntries.id, id)).limit(1);
    if (!entry) return false;
    const siblings = await db.select().from(staffEntries).where(eq(staffEntries.categoryId, entry.categoryId)).orderBy(asc(staffEntries.sortOrder), asc(staffEntries.id));
    const i = siblings.findIndex((e) => e.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= siblings.length) return false;
    await db.update(staffEntries).set({ sortOrder: siblings[j].sortOrder }).where(eq(staffEntries.id, siblings[i].id));
    await db.update(staffEntries).set({ sortOrder: siblings[i].sortOrder }).where(eq(staffEntries.id, siblings[j].id));
    return true;
  } catch {
    return false;
  }
}

// ── Admin: entradas ────────────────────────────────────────────────────────

export type EntryRow = {
  id: number;
  categoryId: number;
  type: "member" | "group";
  memberId: number | null;
  memberName: string | null;
  groupRole: string | null;
  customName: string;
  customTitle: string;
  bio: string | null;
};

export async function listEntries(categoryId: number): Promise<EntryRow[]> {
  try {
    const rows = await db.select().from(staffEntries).where(eq(staffEntries.categoryId, categoryId)).orderBy(asc(staffEntries.sortOrder), asc(staffEntries.id));
    const memberIds = rows.filter((r) => r.type === "member" && r.memberId).map((r) => r.memberId as number);
    const names = new Map<number, string>();
    if (memberIds.length) (await db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.id, memberIds))).forEach((u) => names.set(u.id, u.name));
    return rows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      type: r.type as "member" | "group",
      memberId: r.memberId,
      memberName: r.memberId ? names.get(r.memberId) ?? null : null,
      groupRole: r.groupRole,
      customName: r.customName,
      customTitle: r.customTitle,
      bio: r.bio,
    }));
  } catch {
    return [];
  }
}

export type EntryInput = { type: "member" | "group"; memberId: number | null; groupRole: string | null; customName: string; customTitle: string; bio: string };

export async function addEntry(categoryId: number, input: EntryInput): Promise<number | null> {
  try {
    const all = await db.select({ s: staffEntries.sortOrder }).from(staffEntries).where(eq(staffEntries.categoryId, categoryId));
    const sortOrder = Math.max(0, ...all.map((r) => r.s)) + 1;
    const [res] = await db.insert(staffEntries).values({
      categoryId,
      type: input.type,
      memberId: input.type === "member" ? input.memberId : null,
      groupRole: input.type === "group" ? input.groupRole : null,
      customName: input.customName.slice(0, 120),
      customTitle: input.customTitle.slice(0, 160),
      bio: input.bio.slice(0, 2000) || null,
      sortOrder,
    });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateEntry(id: number, input: EntryInput): Promise<boolean> {
  try {
    await db.update(staffEntries).set({
      type: input.type,
      memberId: input.type === "member" ? input.memberId : null,
      groupRole: input.type === "group" ? input.groupRole : null,
      customName: input.customName.slice(0, 120),
      customTitle: input.customTitle.slice(0, 160),
      bio: input.bio.slice(0, 2000) || null,
    }).where(eq(staffEntries.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteEntry(id: number): Promise<boolean> {
  try {
    await db.delete(staffEntries).where(eq(staffEntries.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Público: diretório resolvido ───────────────────────────────────────────

export async function getDirectory(): Promise<StaffCategory[]> {
  try {
    const cats = await db.select().from(staffCategories).orderBy(asc(staffCategories.sortOrder), asc(staffCategories.id));
    if (cats.length === 0) return [];
    const allEntries = await db.select().from(staffEntries).where(inArray(staffEntries.categoryId, cats.map((c) => c.id))).orderBy(asc(staffEntries.sortOrder), asc(staffEntries.id));

    // Pré-carrega membros referenciados e papéis de grupo.
    const memberIds = allEntries.filter((e) => e.type === "member" && e.memberId).map((e) => e.memberId as number);
    const groupRoles = [...new Set(allEntries.filter((e) => e.type === "group" && e.groupRole).map((e) => e.groupRole as string))];
    const memberMap = new Map<number, { handle: string; displayName: string; avatarUrl: string | null; role: string }>();
    if (memberIds.length) (await db.select({ id: users.id, handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(inArray(users.id, memberIds))).forEach((u) => memberMap.set(u.id, u));
    const roleMembers = new Map<string, { handle: string; displayName: string; avatarUrl: string | null; role: string }[]>();
    if (groupRoles.length) {
      const rows = await db.select({ handle: users.handle, displayName: users.displayName, avatarUrl: users.avatarUrl, role: users.role }).from(users).where(inArray(users.role, groupRoles as ("member" | "contributor" | "moderator" | "admin")[])).orderBy(asc(users.displayName));
      for (const role of groupRoles) roleMembers.set(role, rows.filter((u) => u.role === role));
    }

    return cats.map((c) => {
      const cards: StaffCard[] = [];
      // Dedup por handle na categoria: a entrada de membro (custom) tem precedência
      // sobre a mesma pessoa vinda de um grupo.
      const seen = new Set<string>();
      const push = (card: StaffCard) => {
        if (card.handle && seen.has(card.handle)) return;
        if (card.handle) seen.add(card.handle);
        cards.push(card);
      };
      for (const e of allEntries.filter((x) => x.categoryId === c.id)) {
        if (e.type === "member" && e.memberId) {
          const u = memberMap.get(e.memberId);
          if (u) push({ handle: u.handle, name: e.customName || u.displayName, title: e.customTitle || roleLabel(u.role), bio: e.bio, avatarUrl: u.avatarUrl });
        } else if (e.type === "group" && e.groupRole) {
          for (const u of roleMembers.get(e.groupRole) ?? []) {
            push({ handle: u.handle, name: u.displayName, title: roleLabel(u.role), bio: null, avatarUrl: u.avatarUrl });
          }
        }
      }
      return { id: c.id, title: c.title, layout: c.layout as Layout, cards };
    }).filter((c) => c.cards.length > 0);
  } catch {
    return [];
  }
}
