import "server-only";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { modTeams, modTeamMembers, assignments, articles, users } from "@/db/schema";

// ── Equipes ────────────────────────────────────────────────────────────────

export type ModTeam = { id: number; name: string; memberCount: number; memberIds: number[] };

export async function listTeams(): Promise<ModTeam[]> {
  try {
    const teams = await db.select().from(modTeams).orderBy(modTeams.name);
    if (teams.length === 0) return [];
    const members = await db.select().from(modTeamMembers).where(inArray(modTeamMembers.teamId, teams.map((t) => t.id)));
    return teams.map((t) => {
      const ids = members.filter((m) => m.teamId === t.id).map((m) => m.userId);
      return { id: t.id, name: t.name, memberCount: ids.length, memberIds: ids };
    });
  } catch {
    return [];
  }
}

export async function createTeam(name: string, memberIds: number[]): Promise<number | null> {
  try {
    const [res] = await db.insert(modTeams).values({ name });
    const teamId = (res as unknown as { insertId: number }).insertId;
    const ids = [...new Set(memberIds)].filter((n) => n > 0);
    if (ids.length) await db.insert(modTeamMembers).values(ids.map((userId) => ({ teamId, userId })));
    return teamId;
  } catch {
    return null;
  }
}

export async function updateTeam(id: number, name: string, memberIds: number[]): Promise<boolean> {
  try {
    await db.update(modTeams).set({ name }).where(eq(modTeams.id, id));
    await db.delete(modTeamMembers).where(eq(modTeamMembers.teamId, id));
    const ids = [...new Set(memberIds)].filter((n) => n > 0);
    if (ids.length) await db.insert(modTeamMembers).values(ids.map((userId) => ({ teamId: id, userId })));
    return true;
  } catch {
    return false;
  }
}

export async function deleteTeam(id: number): Promise<boolean> {
  try {
    await db.delete(modTeamMembers).where(eq(modTeamMembers.teamId, id));
    await db.delete(modTeams).where(eq(modTeams.id, id));
    return true;
  } catch {
    return false;
  }
}

/** Opções de atribuição: moderadores/admins + equipes. */
export async function getAssigneeOptions(): Promise<{ users: { id: number; name: string }[]; teams: { id: number; name: string }[] }> {
  try {
    const mods = await db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.role, ["moderator", "admin"]));
    const teams = await db.select({ id: modTeams.id, name: modTeams.name }).from(modTeams).orderBy(modTeams.name);
    return { users: mods, teams };
  } catch {
    return { users: [], teams: [] };
  }
}

// ── Atribuições ────────────────────────────────────────────────────────────

export type AssignmentRow = {
  id: number;
  targetId: number;
  contentTitle: string;
  contentLink: string | null;
  assigneeType: "user" | "team";
  assigneeName: string;
  note: string;
  status: "open" | "closed";
  createdAt: Date;
};

export async function createAssignment(targetId: number, assigneeType: "user" | "team", assigneeId: number, note: string, assignedById: number): Promise<{ ok: boolean; error?: string }> {
  try {
    const [a] = await db.select({ id: articles.id }).from(articles).where(eq(articles.id, targetId)).limit(1);
    if (!a) return { ok: false, error: "Conteúdo não encontrado." };
    await db.insert(assignments).values({ targetType: "article", targetId, assigneeType, assigneeId, note: note.slice(0, 500), assignedById, status: "open" });
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atribuir." };
  }
}

export async function closeAssignment(id: number): Promise<boolean> {
  try {
    await db.update(assignments).set({ status: "closed", closedAt: new Date() }).where(eq(assignments.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function listAssignments(status: "open" | "closed" = "open"): Promise<AssignmentRow[]> {
  try {
    const rows = await db.select().from(assignments).where(eq(assignments.status, status)).orderBy(desc(assignments.createdAt));
    if (rows.length === 0) return [];

    const artIds = [...new Set(rows.map((r) => r.targetId))];
    const arts = await db.select({ id: articles.id, slug: articles.slug, title: articles.title }).from(articles).where(inArray(articles.id, artIds));
    const artMap = new Map(arts.map((a) => [a.id, a]));

    const userIds = rows.filter((r) => r.assigneeType === "user").map((r) => r.assigneeId);
    const teamIds = rows.filter((r) => r.assigneeType === "team").map((r) => r.assigneeId);
    const userMap = new Map<number, string>();
    const teamMap = new Map<number, string>();
    if (userIds.length) (await db.select({ id: users.id, name: users.displayName }).from(users).where(inArray(users.id, userIds))).forEach((u) => userMap.set(u.id, u.name));
    if (teamIds.length) (await db.select({ id: modTeams.id, name: modTeams.name }).from(modTeams).where(inArray(modTeams.id, teamIds))).forEach((t) => teamMap.set(t.id, t.name));

    return rows.map((r) => {
      const art = artMap.get(r.targetId);
      return {
        id: r.id,
        targetId: r.targetId,
        contentTitle: art?.title ?? `Guia #${r.targetId}`,
        contentLink: art ? `/guias/${art.slug}` : null,
        assigneeType: r.assigneeType as "user" | "team",
        assigneeName: r.assigneeType === "user" ? userMap.get(r.assigneeId) ?? "—" : teamMap.get(r.assigneeId) ?? "—",
        note: r.note,
        status: r.status as "open" | "closed",
        createdAt: r.createdAt,
      };
    });
  } catch {
    return [];
  }
}

/** Atribuições abertas de um conteúdo (para mostrar no guia). */
export async function assignmentsForContent(targetId: number): Promise<{ assigneeType: "user" | "team"; assigneeName: string }[]> {
  try {
    const rows = await db.select().from(assignments).where(and(eq(assignments.targetType, "article"), eq(assignments.targetId, targetId), eq(assignments.status, "open")));
    if (rows.length === 0) return [];
    const out: { assigneeType: "user" | "team"; assigneeName: string }[] = [];
    for (const r of rows) {
      if (r.assigneeType === "user") {
        const [u] = await db.select({ name: users.displayName }).from(users).where(eq(users.id, r.assigneeId)).limit(1);
        out.push({ assigneeType: "user", assigneeName: u?.name ?? "—" });
      } else {
        const [t] = await db.select({ name: modTeams.name }).from(modTeams).where(eq(modTeams.id, r.assigneeId)).limit(1);
        out.push({ assigneeType: "team", assigneeName: t?.name ?? "—" });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function getOpenAssignmentCount(): Promise<number> {
  try {
    const [c] = await db.select({ n: sql<number>`COUNT(*)` }).from(assignments).where(eq(assignments.status, "open"));
    return Number(c?.n ?? 0);
  } catch {
    return 0;
  }
}
