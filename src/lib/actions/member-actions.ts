"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users, auditLog } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { hashPassword } from "@/lib/password";
import { slugify } from "@/lib/utils";
import { createToken } from "@/lib/tokens";
import { resetPassword as resetTpl } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/mailer";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

async function audit(actorId: number, action: string, userId: number, meta?: unknown) {
  await db.insert(auditLog).values({ actorId, action, target: `user:${userId}`, meta: meta ?? null });
}

const RoleSchema = z.enum(["member", "contributor", "moderator", "admin"]);

export async function setUserRoleAction(userId: number, role: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (Number(actor.id) === userId) return { ok: false, error: "Você não pode mudar o próprio papel." };

  const parsed = RoleSchema.safeParse(role);
  if (!parsed.success) return { ok: false, error: "Papel inválido." };

  try {
    await db.update(users).set({ role: parsed.data }).where(eq(users.id, userId));
    await audit(Number(actor.id), "user_set_role", userId, { role: parsed.data });
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao alterar o papel." };
  }
}

export async function setUserSuspendedAction(userId: number, suspended: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (Number(actor.id) === userId) return { ok: false, error: "Você não pode suspender a própria conta." };

  try {
    await db.update(users).set({ isSuspended: suspended }).where(eq(users.id, userId));
    await audit(Number(actor.id), suspended ? "user_suspend" : "user_unsuspend", userId);
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atualizar." };
  }
}

export async function setUserTrustedAction(userId: number, trusted: boolean): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };

  try {
    await db.update(users).set({ trusted }).where(eq(users.id, userId));
    await audit(Number(actor.id), trusted ? "user_trust" : "user_untrust", userId);
    revalidatePath("/admin/membros");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atualizar." };
  }
}

export async function setUserReputationAction(userId: number, reputation: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const value = Math.max(0, Math.min(1_000_000, Math.floor(Number(reputation))));
  if (!Number.isFinite(value)) return { ok: false, error: "Valor inválido." };

  try {
    await db.update(users).set({ reputation: value }).where(eq(users.id, userId));
    await audit(Number(actor.id), "user_set_reputation", userId, { reputation: value });
    revalidatePath("/admin/membros");
    revalidatePath(`/admin/membros/${userId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao atualizar." };
  }
}

async function uniqueHandle(base: string): Promise<string> {
  const root = (slugify(base).slice(0, 50) || "membro").replace(/-+$/, "");
  let handle = root;
  for (let i = 2; i < 1000; i++) {
    const [hit] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
    if (!hit) return handle;
    handle = `${root}-${i}`;
  }
  return `${root}-${Math.floor(Date.now() % 100000)}`;
}

const CreateSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  email: z.email(),
  role: RoleSchema,
  setPassword: z.boolean().optional(),
  password: z.string().max(200).optional(),
});

export async function createMemberAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  let parsed;
  try {
    parsed = CreateSchema.parse(JSON.parse(body));
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  const email = parsed.email.toLowerCase();
  if (parsed.setPassword && (parsed.password ?? "").length < 8) {
    return { ok: false, error: "A senha deve ter ao menos 8 caracteres." };
  }
  try {
    const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists) return { ok: false, error: "Já existe uma conta com esse e-mail." };

    const handle = await uniqueHandle(parsed.displayName || email.split("@")[0]);
    const rawPwd = parsed.setPassword && parsed.password ? parsed.password : `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const passwordHash = await hashPassword(rawPwd);

    const [res] = await db.insert(users).values({
      email,
      handle,
      displayName: parsed.displayName,
      passwordHash,
      role: parsed.role,
      emailVerifiedAt: new Date(),
    });
    const id = (res as unknown as { insertId: number }).insertId;
    await audit(Number(actor.id), "user_create", id, { role: parsed.role });

    // Sem senha definida: envia o e-mail para o usuário criar a própria senha.
    if (!parsed.setPassword) {
      const raw = await createToken("password_reset", email, id);
      try {
        await sendEmail({ to: email, ...resetTpl(raw) });
      } catch {
        /* silencioso */
      }
    }
    revalidatePath("/admin/membros");
    return { ok: true, data: { id } };
  } catch {
    return { ok: false, error: "Falha ao criar o membro." };
  }
}

const ROLES_SET = new Set(["member", "contributor", "moderator", "admin"]);

/** Importa membros de um CSV (colunas: email, nome, papel?). Cria os que não
 * existem com senha aleatória e envia o e-mail para definirem a senha. */
export async function importMembersAction(csv: string): Promise<Result<{ created: number; skipped: number; errors: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };

  const lines = String(csv ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 200);
  if (lines.length === 0) return { ok: false, error: "CSV vazio." };
  // Ignora um possível cabeçalho.
  if (/e-?mail/i.test(lines[0]) && /nome|name/i.test(lines[0])) lines.shift();

  let created = 0, skipped = 0, errors = 0;
  for (const line of lines) {
    const [rawEmail, rawName, rawRole] = line.split(/[,;]/).map((s) => (s ?? "").trim());
    const email = (rawEmail || "").toLowerCase();
    const name = rawName || email.split("@")[0];
    const role = ROLES_SET.has(rawRole) ? rawRole : "member";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || name.length < 2) { errors++; continue; }
    try {
      const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
      if (exists) { skipped++; continue; }
      const handle = await uniqueHandle(name);
      const passwordHash = await hashPassword(`${crypto.randomUUID()}${crypto.randomUUID()}`);
      const [res] = await db.insert(users).values({ email, handle, displayName: name, passwordHash, role: role as "member", emailVerifiedAt: new Date() });
      const id = (res as unknown as { insertId: number }).insertId;
      const raw = await createToken("password_reset", email, id);
      try { await sendEmail({ to: email, ...resetTpl(raw) }); } catch { /* silencioso */ }
      created++;
    } catch {
      errors++;
    }
  }
  await audit(Number(actor.id), "members_import", 0, { created, skipped, errors });
  revalidatePath("/admin/membros");
  return { ok: true, data: { created, skipped, errors } };
}

/** Marca um membro como spammer: aplica as ações configuradas (suspender,
 * ocultar conteúdo, banir e-mail). */
export async function flagSpammerAction(userId: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const { getSpamSettings } = await import("@/lib/settings");
    const settings = await getSpamSettings();
    const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!u) return { ok: false, error: "Usuário não encontrado." };

    if (settings.flagRestrict) {
      await db.update(users).set({ isSuspended: true }).where(eq(users.id, userId));
    }
    if (settings.flagHide) {
      const { articles, comments } = await import("@/db/schema");
      await db.update(articles).set({ status: "archived" }).where(eq(articles.authorId, userId));
      await db.update(comments).set({ status: "hidden" }).where(eq(comments.authorId, userId));
    }
    if (settings.flagBan && u.email) {
      const { createBanFilter } = await import("@/lib/admin/ban-filters");
      await createBanFilter("email", u.email, "Spammer", Number(actor.id));
    }
    await audit(Number(actor.id), "flag_spammer", userId);
    revalidatePath("/admin/membros");
    revalidatePath(`/admin/membros/${userId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha." };
  }
}

export async function forcePasswordResetAction(userId: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const [u] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!u) return { ok: false, error: "Usuário não encontrado." };
    const raw = await createToken("password_reset", u.email, u.id);
    try {
      await sendEmail({ to: u.email, ...resetTpl(raw) });
    } catch {
      /* silencioso */
    }
    await audit(Number(actor.id), "user_force_reset", userId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha." };
  }
}
