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
  if (!a || a.kind !== "guide") return {};
  return articleMetadata(a);
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a || a.kind !== "guide") notFound();
  return <ArticleView a={a} />;
}
