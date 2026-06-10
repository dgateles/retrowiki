import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticle } from "@/lib/articles";
import { ArticleView } from "@/components/article/article-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) return {};
  return { title: a.title, description: a.summary ?? undefined };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a || a.kind !== "blog") notFound();
  return <ArticleView a={a} />;
}
