import Link from "next/link";
import { count, plural } from "@/lib/plural";
import { listIgnored } from "@/lib/ignore";
import { IgnoreButton } from "@/components/social/ignore-button";
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
import { PrivacyTools } from "@/components/account/privacy-tools";
import { hasOpenDeletionRequest } from "@/lib/privacy";
import { MfaSetup } from "@/components/account/mfa-setup";
import { getMfaState, countRemainingRecoveryCodes } from "@/lib/mfa";
import { RecentSessions } from "@/components/account/recent-sessions";
import { listRecentAccess } from "@/lib/sessions";
import { BulkMailOptOut } from "@/components/account/bulk-mail-optout";
import { ChangeEmailForm } from "@/components/account/change-email-form";
import { GalleryManager } from "@/components/account/gallery-manager";
import { listPhotosManage, listAlbums } from "@/lib/gallery";
import { getGallerySettings } from "@/lib/settings";
import { ConnectedAccounts } from "@/components/account/connected-accounts";
import { getLinkedGoogle } from "@/lib/oauth-link";
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
  searchParams: Promise<{ secao?: string; vinculo?: string }>;
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
  const ignoredList = active === "ignorados" ? await listIgnored(Number(user.id)) : [];

  const warnSettings = active === "avisos" ? await getWarningSettings() : null;
  const warnings = active === "avisos" && warnSettings?.membersCanSee ? await listUserWarnings(Number(user.id)) : [];
  const warnPoints = active === "avisos" && warnSettings?.membersCanSee ? await activePoints(Number(user.id)) : 0;
  const needsAck = active === "avisos" && warnSettings?.mustAcknowledge ? await hasUnacknowledgedWarnings(Number(user.id)) : false;
  const openDeletion = active === "seguranca" ? await hasOpenDeletionRequest(Number(user.id)) : false;
  const mfa = active === "seguranca" ? await getMfaState(Number(user.id)) : { enabled: false, hasSecret: false };
  const mfaCodes = active === "seguranca" && mfa.enabled ? await countRemainingRecoveryCodes(Number(user.id)) : 0;
  const recentSessions = active === "seguranca" ? await listRecentAccess(Number(user.id)) : [];
  const linkedGoogle = active === "contas" ? await getLinkedGoogle(Number(user.id)) : null;
  const gallerySettings = active === "galeria" ? await getGallerySettings() : null;
  const photos = active === "galeria" && gallerySettings?.enabled ? await listPhotosManage(Number(user.id)) : [];
  const albums = active === "galeria" && gallerySettings?.enabled ? await listAlbums(Number(user.id)) : [];
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
                  <div className="settings-row__label">Avatar</div>
                  <div className="settings-row__value muted">PNG, JPG, WEBP ou GIF (máx. 5 MB).</div>
                </div>
                <AvatarForm initial={user.avatarUrl ?? ""} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-row__label">Capa do perfil</div>
                  <div className="settings-row__value muted">Imagem larga exibida no topo do seu perfil.</div>
                </div>
                <CoverForm initial={user.coverUrl ?? ""} />
              </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Nome de exibição</div>
                    <div className="settings-row__value">{user.displayName}</div>
                  </div>
                  <Link href="/conta?secao=nome" className="link-inline">Alterar</Link>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Usuário</div>
                    <div className="settings-row__value">
                      <Link href={`/u/${user.handle}`} className="link-inline">@{user.handle}</Link>
                    </div>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">E-mail</div>
                    <div className="settings-row__value">{user.email}</div>
                  </div>
                  <Link href="/conta?secao=email" className="link-inline">Alterar</Link>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Papel</div>
                    <div className="settings-row__value">{roleLabel(user.role)}</div>
                  </div>
                </div>
                <div className="settings-row">
                  <div>
                    <div className="settings-row__label">Membro desde</div>
                    <div className="settings-row__value">{memberSince}</div>
                  </div>
                </div>
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
              <div className="mt-4 border-t border-border/60 pt-4">
                <BulkMailOptOut initial={Boolean((user as { bulkMailOptOut?: boolean }).bulkMailOptOut)} />
              </div>
            </section>
          )}

          {active === "ignorados" && (
            <section aria-labelledby="s-ign" className="settings-section">
              <h2 id="s-ign" className="settings-section__title">Usuários ignorados</h2>
              <p className="settings-section__desc">O conteúdo de quem você ignora fica recolhido no fórum. A equipe não pode ser ignorada.</p>
              {ignoredList.length === 0 ? (
                <p className="empty mt-4">Você não ignora ninguém.</p>
              ) : (
                <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border">
                  {ignoredList.map((u) => (
                    <li key={u.id} className="flex items-center gap-3 bg-card p-3">
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-sm font-semibold text-muted-foreground" aria-hidden="true">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatarUrl} alt="" className="size-full object-cover" />
                        ) : (u.displayName[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link href={`/u/${u.handle}`} className="font-medium link-inline">{u.displayName}</Link>
                        <p className="text-xs text-muted-foreground">@{u.handle}</p>
                      </div>
                      <IgnoreButton targetId={u.id} initialIgnoring />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {active === "galeria" && (
            <section aria-labelledby="s-gal" className="settings-section">
              <h2 id="s-gal" className="settings-section__title">Galeria de fotos</h2>
              {!gallerySettings?.enabled ? (
                <p className="empty mt-4">A galeria de fotos está desativada.</p>
              ) : (
                <>
                  <p className="settings-section__desc">Fotos exibidas no seu perfil público.</p>
                  <div className="mt-4"><GalleryManager photos={photos} albums={albums} max={gallerySettings.maxPhotos} /></div>
                </>
              )}
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
                    {warnPoints > 0 ? `Você tem ${count(warnPoints, "ponto", "pontos")} de advertência ${plural(warnPoints, "ativo", "ativos")}.` : "Você não tem advertências ativas."}
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
              <p className="settings-section__desc">Altere o e-mail da conta com confirmação no novo endereço.</p>
              <div className="mt-4">
                <ChangeEmailForm current={user.email} />
              </div>
            </section>
          )}

          {active === "contas" && (
            <section aria-labelledby="s-contas" className="settings-section">
              <h2 id="s-contas" className="settings-section__title">Contas conectadas</h2>
              <p className="settings-section__desc">Conecte um login social à sua conta. Pedimos sua senha para confirmar.</p>
              <div className="mt-4">
                <ConnectedAccounts
                  connected={linkedGoogle !== null}
                  linkedEmail={linkedGoogle?.email ?? null}
                  hasPassword={user.passwordHash !== ""}
                  status={sp.vinculo}
                />
              </div>
            </section>
          )}

          {active === "seguranca" && (
            <section aria-labelledby="s-seg" className="settings-section">
              <h2 id="s-seg" className="settings-section__title">Segurança e privacidade</h2>
              <p className="settings-section__desc">Seus dados e o controle sobre eles.</p>
              <div className="mt-4">
                <MfaSetup initialEnabled={mfa.enabled} remainingCodes={mfaCodes} />
              </div>
              <div className="mt-6">
                <RecentSessions sessions={recentSessions} />
              </div>
              <div className="mt-6">
                <PrivacyTools hasOpenRequest={openDeletion} />
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
