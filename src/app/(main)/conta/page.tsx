import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { roleLabel } from "@/lib/ranks";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { DisplayNameForm } from "@/components/account/display-name-form";
import { AvatarForm } from "@/components/account/avatar-form";
import { CoverForm } from "@/components/account/cover-form";
import { ProfileFieldsForm } from "@/components/account/profile-fields-form";
import { getEditableFields } from "@/lib/profile-fields";
import { NotificationPrefsForm } from "@/components/account/notification-prefs-form";
import { getMemberPrefs } from "@/lib/notifications-prefs";
import { AcknowledgeWarnings } from "@/components/account/acknowledge-warnings";
import { listUserWarnings, activePoints, hasUnacknowledgedWarnings } from "@/lib/warnings";
import { getWarningSettings } from "@/lib/settings";
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
  const profileFieldGroups = active === "perfil" ? await getEditableFields(Number(user.id)) : [];
  const notifPrefs = active === "notificacoes" ? await getMemberPrefs(Number(user.id)) : [];

  const warnSettings = active === "avisos" ? await getWarningSettings() : null;
  const warnings = active === "avisos" && warnSettings?.membersCanSee ? await listUserWarnings(Number(user.id)) : [];
  const warnPoints = active === "avisos" && warnSettings?.membersCanSee ? await activePoints(Number(user.id)) : 0;
  const needsAck = active === "avisos" && warnSettings?.mustAcknowledge ? await hasUnacknowledgedWarnings(Number(user.id)) : false;
  const fmtWarn = (d: Date) => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));

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
              <div className="settings-row">
                <div>
                  <dt className="settings-row__label">Avatar</dt>
                  <dd className="settings-row__value muted">PNG, JPG, WEBP ou GIF (máx. 5 MB).</dd>
                </div>
                <AvatarForm initial={user.avatarUrl ?? ""} />
              </div>
              <div className="settings-row">
                <div>
                  <dt className="settings-row__label">Capa do perfil</dt>
                  <dd className="settings-row__value muted">Imagem larga exibida no topo do seu perfil.</dd>
                </div>
                <CoverForm initial={user.coverUrl ?? ""} />
              </div>
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

          {active === "perfil" && (
            <section aria-labelledby="s-perfil" className="settings-section">
              <h2 id="s-perfil" className="settings-section__title">Perfil</h2>
              <p className="settings-section__desc">Informações exibidas no seu perfil público.</p>
              <div className="mt-4">
                {profileFieldGroups.length === 0 ? (
                  <p className="muted">Nenhum campo de perfil disponível.</p>
                ) : (
                  <ProfileFieldsForm groups={profileFieldGroups} />
                )}
              </div>
            </section>
          )}

          {active === "notificacoes" && (
            <section aria-labelledby="s-notif" className="settings-section">
              <h2 id="s-notif" className="settings-section__title">Notificações</h2>
              <p className="settings-section__desc">Escolha como quer ser avisado.</p>
              <div className="mt-4">
                <NotificationPrefsForm prefs={notifPrefs} />
              </div>
            </section>
          )}

          {active === "avisos" && (
            <section aria-labelledby="s-avisos" className="settings-section">
              <h2 id="s-avisos" className="settings-section__title">Advertências</h2>
              {!warnSettings?.membersCanSee ? (
                <p className="empty mt-4">As advertências não são visíveis para os membros nesta comunidade.</p>
              ) : (
                <>
                  <p className="settings-section__desc">
                    {warnPoints > 0 ? `Você tem ${warnPoints} ponto(s) de advertência ativo(s).` : "Você não tem advertências ativas."}
                  </p>
                  {needsAck && (
                    <div className="mt-4"><AcknowledgeWarnings /></div>
                  )}
                  {warnings.length > 0 && (
                    <ul className="warn-list mt-4">
                      {warnings.map((w) => (
                        <li key={w.id} className="warn-list__item">
                          <div className="min-w-0">
                            <span className="warn-list__reason">{w.reasonName} · {w.points} pt</span>
                            {w.note && <span className="warn-list__note">{w.note}</span>}
                          </div>
                          <span className="muted shrink-0 text-xs">{fmtWarn(w.createdAt)}{w.acknowledged ? "" : " · não confirmada"}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
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
