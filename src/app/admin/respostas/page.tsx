import { db } from "@/db";
import { stockReplies as tbl } from "@/db/schema";
import { asc } from "drizzle-orm";
import { StockRepliesManager } from "@/components/admin/stock-replies-manager";

export const dynamic = "force-dynamic";

export default async function AdminStockRepliesPage() {
  const replies = await db.select().from(tbl).orderBy(asc(tbl.sortOrder), asc(tbl.id)).catch(() => []);
  return <StockRepliesManager replies={replies.map((r) => ({ id: r.id, title: r.title, body: r.body, sortOrder: r.sortOrder }))} />;
}
