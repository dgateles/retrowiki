import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getPublishedArticle, typeLabel } from "@/lib/articles";
import { ArticleBody } from "@/lib/blocks/render";
import { Button } from "@/components/ui/button";

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

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getPublishedArticle(slug);
  if (!a) notFound();

  return (
    <main id="main" className="mx-auto max-w-3xl px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href="/guias">
          <ChevronLeft className="size-4" aria-hidden="true" /> Guias
        </Link>
      </Button>

      <article>
        <header className="mb-6">
          <span className="text-xs font-medium text-primary">{typeLabel(a.type)}</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{a.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            por @{a.authorHandle}
            {a.deviceSlug && (
              <>
                {" · "}
                <Link href={`/consoles/${a.deviceSlug}`} className="hover:text-foreground underline">
                  {a.deviceSlug}
                </Link>
              </>
            )}
            {a.publishedAt && (
              <>
                {" · "}
                <time dateTime={new Date(a.publishedAt).toISOString()}>
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(a.publishedAt))}
                </time>
              </>
            )}
          </p>
        </header>

        <div className="text-[15px]">
          <ArticleBody body={a.body} />
        </div>
      </article>
    </main>
  );
}
