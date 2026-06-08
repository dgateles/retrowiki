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
    <main id="main" className="page">
      <h1 className="page__title">Minha conta</h1>

      <section aria-labelledby="perfil" className="account__section">
        <h2 id="perfil" className="font-semibold">Perfil</h2>
        <dl className="account__dl">
          <div className="account__row">
            <dt className="account__label">Usuário:</dt>
            <dd>
              <Link href={`/u/${session.user.handle}`} className="underline">@{session.user.handle}</Link>
            </dd>
          </div>
          <div className="account__row">
            <dt className="account__label">E-mail:</dt>
            <dd>{session.user.email}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="senha" className="account__section">
        <h2 id="senha" className="account__heading">Alterar senha</h2>
        <ChangePasswordForm />
      </section>
    </main>
  );
}
