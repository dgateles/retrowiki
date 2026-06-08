import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { roleLabel } from "@/lib/ranks";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DisplayNameForm } from "@/components/account/display-name-form";
import {
  SettingsNav,
  SETTINGS_SECTIONS,
  type SettingsSection,
} from "@/components/account/settings-nav";

export const metadata: Metadata = { title: "Configurações", robots: { index: false } };
export const dynamic = "force-dynamic";

function isSection(v: string | undefined): v is SettingsSection {
  return SETTINGS_SECTIONS.some((s) => s.key === v);
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ secao?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/entrar");

  const sp = await searchParams;
  const active: SettingsSection = isSection(sp.secao) ? sp.secao : "geral";
  const memberSince = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(user.createdAt),
  );

  return (
    <main id="main" className="page">
      <h1 className="page__title">Configurações</h1>
      <p className="page__note">Gerencie os dados da sua conta.</p>

      <div className="settings">
        <SettingsNav active={active} />

        <div className="settings__panel">
          {active === "geral" && (
            <section aria-labelledby="s-geral" className="settings-section">
              <h2 id="s-geral" className="settings-section__title">Visão geral</h2>
              <dl>
                <div className="settings-row">
                  <div>
                    <dt className="settings-row__label">Nome de exibição</dt>
                    <dd className="settings-row__value">{user.displayName}</dd>
                  </div>
                  <Link href="/conta?secao=nome" className="link-inline">Alterar</Link>
                </div>
                <div className="settings-row">
                  <div>
                    <dt className="settings-row__label">Usuário</dt>
                    <dd className="settings-row__value">
                      <Link href={`/u/${user.handle}`} className="link-inline">@{user.handle}</Link>
                    </dd>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <dt className="settings-row__label">E-mail</dt>
                    <dd className="settings-row__value">{user.email}</dd>
                  </div>
                  <Link href="/conta?secao=email" className="link-inline">Alterar</Link>
                </div>
                <div className="settings-row">
                  <div>
                    <dt className="settings-row__label">Papel</dt>
                    <dd className="settings-row__value">{roleLabel(user.role)}</dd>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <dt className="settings-row__label">Membro desde</dt>
                    <dd className="settings-row__value">{memberSince}</dd>
                  </div>
                </div>
              </dl>
            </section>
          )}

          {active === "nome" && (
            <section aria-labelledby="s-nome" className="settings-section">
              <h2 id="s-nome" className="settings-section__title">Nome de exibição</h2>
              <p className="settings-section__desc">Como seu nome aparece na comunidade.</p>
              <div className="mt-4">
                <DisplayNameForm initial={user.displayName} />
              </div>
            </section>
          )}

          {active === "senha" && (
            <section aria-labelledby="s-senha" className="settings-section">
              <h2 id="s-senha" className="settings-section__title">Senha</h2>
              <p className="settings-section__desc">Use uma senha forte e exclusiva.</p>
              <div className="mt-4">
                <ChangePasswordForm />
              </div>
            </section>
          )}

          {active === "email" && (
            <section aria-labelledby="s-email" className="settings-section">
              <h2 id="s-email" className="settings-section__title">E-mail</h2>
              <p className="settings-section__desc">Seu e-mail atual é {user.email}.</p>
              <p className="empty mt-4">A troca de e-mail com confirmação está em desenvolvimento.</p>
            </section>
          )}

          {active === "seguranca" && (
            <section aria-labelledby="s-seg" className="settings-section">
              <h2 id="s-seg" className="settings-section__title">Segurança e privacidade</h2>
              <p className="empty mt-4">Dispositivos e sessões aparecerão aqui em breve.</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
