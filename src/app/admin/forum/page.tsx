import { getForumAdminData } from "@/lib/admin/forum-admin";
import { ForumManager } from "@/components/admin/forum-manager";

export const dynamic = "force-dynamic";

export default async function AdminForumPage() {
  const categories = await getForumAdminData();
  return <ForumManager categories={categories} />;
}
