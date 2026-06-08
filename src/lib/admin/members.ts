import "server-only";
import { or, like, desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const MEMBERS_PAGE_SIZE = 20;

export async function listMembers({ page = 1, q }: { page?: number; q?: string }) {
  const offset = (Math.max(1, page) - 1) * MEMBERS_PAGE_SIZE;
  const term = q && q.trim().length >= 2 ? `%${q.trim().replace(/[%_]/g, "\\$&")}%` : null;
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
      .where(term ? or(like(users.handle, term), like(users.displayName, term), like(users.email, term)) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(MEMBERS_PAGE_SIZE + 1)
      .offset(offset);
    return { items: rows.slice(0, MEMBERS_PAGE_SIZE), hasMore: rows.length > MEMBERS_PAGE_SIZE };
  } catch {
    return { items: [], hasMore: false };
  }
}
