import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser, can } from "@/lib/auth-helpers";
import { getPageById, validateLayout, EMPTY_LAYOUT, listBlocks } from "@/lib/pages";
import { PageBuilder } from "@/components/admin/page-builder";

export const metadata: Metadata = { title: "Construtor de página", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BuilderFullscreen({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!can.admin(user)) redirect("/");

  const { id } = await params;
  const page = await getPageById(Number(id));
  if (!page) notFound();
  const layout = validateLayout(page.layout) ?? EMPTY_LAYOUT;
  const blocks = await listBlocks();

  return (
    <PageBuilder
      blocks={blocks.map((b) => ({ id: b.id, name: b.name, layout: b.layout }))}
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        metaDescription: page.metaDescription ?? "",
        status: page.status,
        showInMenu: page.showInMenu,
        menuOrder: page.menuOrder,
        noindex: page.noindex,
        isHome: page.isHome,
        layout,
      }}
    />
  );
}
