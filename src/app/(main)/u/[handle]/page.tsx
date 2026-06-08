import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UserRound } from "lucide-react";
import { getProfile } from "@/lib/profiles";
import { typeLabel } from "@/lib/articles";

const ROLE_LABEL: Record<string, string> = {
  member: "Membro",
  contributor: "Colaborador",
  moderator: "Moderador",
  admin: "Equipe",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) return {};
  return { title: `@${profile.handle}`, description: `Perfil de ${profile.displayName} na RetroWiki.` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getProfile(handle);
  if (!profile) notFound();

  return (
    <main id="main" className="page">
      <header className="flex items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted" aria-hidden="true">
          <UserRound className="size-8 text-muted-foreground" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">
            @{profile.handle} · {ROLE_LABEL[profile.role] ?? profile.role} ·{" "}
            <span title="Reputação">{profile.reputation} pts</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Na comunidade desde{" "}
            <time dateTime={new Date(profile.createdAt).toISOString()}>
              {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))}
            </time>
          </p>
        </div>
      </header>

      <section aria-labelledby="contrib" className="mt-8">
        <h2 id="contrib" className="text-lg font-semibold">
          Publicações ({profile.articles.length})
        </h2>
        {profile.articles.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {profile.articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/guias/${a.slug}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">{typeLabel(a.type)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
