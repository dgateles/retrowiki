import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedArticle } from "@/lib/articles";
import { ArticleView } from "@/components/article/article-view";
import { articleMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a || a.kind !== "blog") return {};
  return articleMetadata(a);
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
