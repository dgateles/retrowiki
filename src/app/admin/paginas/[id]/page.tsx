import { notFound } from "next/navigation";
import { getPageById, validateLayout, EMPTY_LAYOUT } from "@/lib/pages";
import { PageBuilder } from "@/components/admin/page-builder";

export const dynamic = "force-dynamic";

export default async function PageBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await getPageById(Number(id));
  if (!page) notFound();
  const layout = validateLayout(page.layout) ?? EMPTY_LAYOUT;

  return (
    <PageBuilder
      page={{
        id: page.id,
        title: page.title,
        slug: page.slug,
        metaDescription: page.metaDescription ?? "",
        status: page.status,
        showInMenu: page.showInMenu,
        menuOrder: page.menuOrder,
        noindex: page.noindex,
        layout,
      }}
    />
  );
}
