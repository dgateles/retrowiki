import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChangePasswordForm } from "@/components/account/change-password-form";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/entrar");

  return (
    <main id="main" className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-bold">Minha conta</h1>

      <section aria-labelledby="perfil" className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 id="perfil" className="font-semibold">Perfil</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex gap-2">
            <dt className="text-muted-foreground">Usuário:</dt>
            <dd>
              <Link href={`/u/${session.user.handle}`} className="underline">@{session.user.handle}</Link>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground">E-mail:</dt>
            <dd>{session.user.email}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="senha" className="mt-6 rounded-lg border border-border bg-card p-5">
        <h2 id="senha" className="mb-4 font-semibold">Alterar senha</h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
