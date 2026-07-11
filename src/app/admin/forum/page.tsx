import { getForumAdminData } from "@/lib/admin/forum-admin";
import { ForumManager } from "@/components/admin/forum-manager";
import { ForumPrefixesManager } from "@/components/admin/forum-prefixes-manager";
import { listPrefixes } from "@/lib/forum-prefixes";

export const dynamic = "force-dynamic";

export default async function AdminForumPage() {
  const [categories, prefixes] = await Promise.all([getForumAdminData(), listPrefixes()]);
  return (
    <>
      <ForumManager categories={categories} />
      <ForumPrefixesManager prefixes={prefixes} />
    </>
  );
}
