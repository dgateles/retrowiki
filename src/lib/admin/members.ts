import "server-only";
import { and, or, like, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const MEMBERS_PAGE_SIZE = 20;

const ROLES = ["member", "contributor", "moderator", "admin"] as const;
type Role = (typeof ROLES)[number];

export async function listMembers({ page = 1, q, role }: { page?: number; q?: string; role?: string }) {
  const offset = (Math.max(1, page) - 1) * MEMBERS_PAGE_SIZE;
  const term = q && q.trim().length >= 2 ? `%${q.trim().replace(/[%_]/g, "\\$&")}%` : null;
  const roleFilter = ROLES.includes(role as Role) ? (role as Role) : null;
  const conds = [
    term ? or(like(users.handle, term), like(users.displayName, term), like(users.email, term)) : undefined,
    roleFilter ? eq(users.role, roleFilter) : undefined,
  ].filter(Boolean);
  try {
    const rows = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
        reputation: users.reputation,
        trusted: users.trusted,
        isSuspended: users.isSuspended,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(MEMBERS_PAGE_SIZE + 1)
      .offset(offset);
    return { items: rows.slice(0, MEMBERS_PAGE_SIZE), hasMore: rows.length > MEMBERS_PAGE_SIZE };
  } catch {
    return { items: [], hasMore: false };
  }
}
