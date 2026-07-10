import Link from "next/link";
import { Check } from "lucide-react";
import { RichContent } from "@/components/blocks/rich-content";
import type { RichDoc } from "@/lib/blocks/rich-schema";
import { forumDocFromBody, type ForumPostItem } from "@/lib/forum";
import { roleLabel } from "@/lib/ranks";
import { cn } from "@/lib/utils";

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase();
}
const joined = (d: Date) => new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(d);
const posted = (d: Date) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(d);

/** Post do fórum com "postbit" (cartão do autor) à esquerda — visual estilo IPB. */
export function ForumPostCard({ post, reactions, actions, bestAnswer = false, solutionControl, quoteControl }: { post: ForumPostItem; reactions?: React.ReactNode; actions?: React.ReactNode; bestAnswer?: boolean; solutionControl?: React.ReactNode; quoteControl?: React.ReactNode }) {
  const isStaff = post.authorRole === "moderator" || post.authorRole === "admin";
  return (
    <article id={`post-${post.id}`} className={cn("fpost", bestAnswer && "fpost--best")}>
      <div className="fpost__bit">
        <span className="fpost__avatar" aria-hidden="true">
          {post.authorAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.authorAvatar} alt="" className="fpost__avatar-img" />
          ) : (
            initials(post.authorName)
          )}
        </span>
        <Link href={`/u/${post.authorHandle}`} className="fpost__author">{post.authorName}</Link>
        <span className={cn("fpost__role", isStaff && "fpost__role--staff")}>{roleLabel(post.authorRole)}</span>
        <dl className="fpost__stats">
          <div><dd className="tabular-nums">{post.authorPostCount}</dd><dt>posts</dt></div>
          <div><dd className="tabular-nums">{post.authorReputation}</dd><dt>rep.</dt></div>
        </dl>
        <span className="fpost__since">Desde {joined(post.authorJoinedAt)}</span>
      </div>

      <div className="fpost__main">
        <header className="fpost__head">
          <div className="fpost__head-meta">
            <time dateTime={post.createdAt.toISOString()}>{posted(post.createdAt)}</time>
            {bestAnswer && <span className="fpost__solution"><Check className="size-3.5" aria-hidden="true" /> Melhor resposta</span>}
            {post.isFirst && <span className="fpost__badge">Autor do tópico</span>}
            {post.editedAt && <span className="fpost__edited">editado</span>}
          </div>
          {actions && <div className="fpost__head-actions">{actions}</div>}
        </header>
        <div className="fpost__content page-w__rich">
          <RichContent doc={forumDocFromBody(post.body) as RichDoc} />
        </div>
        {(reactions || solutionControl || quoteControl) && (
          <footer className="fpost__foot">
            {(quoteControl || solutionControl) && (
              <div className="fpost__foot-left">
                {quoteControl}
                {solutionControl}
              </div>
            )}
            {reactions}
          </footer>
        )}
      </div>
    </article>
  );
}
