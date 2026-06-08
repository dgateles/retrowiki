import "server-only";
import { env } from "@/lib/env";

// Minimal, dependency-light HTML+text templates. (Can migrate to React Email
// components later; the mailer accepts html+text.)
const BRAND = "RetroWiki";

function shell(title: string, bodyHtml: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="font-family:system-ui,sans-serif;background:#0b0f14;color:#e6edf3;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#11161d;border:1px solid #222c38;border-radius:12px;padding:28px">
    <h1 style="font-size:18px;margin:0 0 16px;color:#34d399">${BRAND}</h1>
    <h2 style="font-size:16px;margin:0 0 12px">${title}</h2>
    ${bodyHtml}
    <p style="font-size:12px;color:#8b98a5;margin-top:24px">Se você não solicitou isto, ignore este e-mail.</p>
  </div></body></html>`;
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#34d399;color:#0b0f14;font-weight:600;text-decoration:none;padding:10px 18px;border-radius:8px;margin:8px 0">${label}</a>`;
}

export function verifyEmail(handle: string, raw: string) {
  const url = `${env.APP_URL}/auth/verificar?token=${raw}`;
  return {
    subject: "Confirme seu e-mail — RetroWiki",
    html: shell(
      "Confirme seu e-mail",
      `<p>Olá, @${handle}! Confirme seu e-mail para ativar sua conta.</p>${button(url, "Confirmar e-mail")}<p style="font-size:12px;color:#8b98a5">O link expira em 24 horas.</p>`,
    ),
    text: `Olá, @${handle}! Confirme seu e-mail: ${url} (expira em 24h).`,
  };
}

export function resetPassword(raw: string) {
  const url = `${env.APP_URL}/auth/redefinir?token=${raw}`;
  return {
    subject: "Redefinição de senha — RetroWiki",
    html: shell(
      "Redefinir senha",
      `<p>Recebemos um pedido para redefinir sua senha.</p>${button(url, "Redefinir senha")}<p style="font-size:12px;color:#8b98a5">O link expira em 1 hora. Se não foi você, ignore.</p>`,
    ),
    text: `Redefina sua senha: ${url} (expira em 1h). Se não foi você, ignore.`,
  };
}

export function passwordChanged() {
  return {
    subject: "Sua senha foi alterada — RetroWiki",
    html: shell(
      "Senha alterada",
      `<p>Sua senha na RetroWiki foi alterada com sucesso.</p><p style="font-size:12px;color:#8b98a5">Se não foi você, redefina a senha imediatamente e contate o suporte.</p>`,
    ),
    text: "Sua senha na RetroWiki foi alterada. Se não foi você, redefina-a imediatamente.",
  };
}
