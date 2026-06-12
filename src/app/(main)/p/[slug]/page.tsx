import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedPage, validateLayout, EMPTY_LAYOUT } from "@/lib/pages";
import { PageRenderer } from "@/components/pages/page-renderer";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublishedPage(slug);
  if (!p) return {};
  return {
    title: p.title,
    description: p.metaDescription ?? undefined,
    robots: p.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedPage(slug);
  if (!p) notFound();
  // A página inicial mora em "/", não duplica em /p/slug.
  if (p.isHome) redirect("/");
  const layout = validateLayout(p.layout) ?? EMPTY_LAYOUT;

  return (
    <main id="main" className="page">
      <h1 className="page__title">{p.title}</h1>
      <div className="mt-6">
        <PageRenderer layout={layout} />
      </div>
    </main>
  );
}
