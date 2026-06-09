"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { auditLog } from "@/db/schema";
import { requireRole, requireUser } from "@/lib/auth-helpers";
import {
  createGroup,
  updateGroup,
  deleteGroup,
  createField,
  updateField,
  deleteField,
  copyField,
  type FieldInput,
} from "@/lib/admin/profile-fields";
import { saveValues } from "@/lib/profile-fields";
import { setSetting, sanitizeProfileSettings } from "@/lib/settings";
import { FIELD_TYPE_VALUES, TYPES_WITH_OPTIONS, VISIBILITY, type FieldType, type Visibility } from "@/lib/profile-field-types";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

async function asAdmin(): Promise<{ id: string } | null> {
  try {
    return await requireRole("admin");
  } catch {
    return null;
  }
}

const VIS_VALUES = VISIBILITY.map((v) => v.value) as readonly string[];

function parseField(body: string): FieldInput | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const name = String(p.name ?? "").trim();
    if (name.length < 1 || name.length > 120) return null;
    const groupId = Math.floor(Number(p.groupId) || 0);
    if (groupId <= 0) return null;
    const type = (FIELD_TYPE_VALUES.includes(String(p.type)) ? String(p.type) : "text") as FieldType;
    const options = TYPES_WITH_OPTIONS.has(type) && Array.isArray(p.options)
      ? p.options.map((o) => String(o).trim()).filter((o) => o.length > 0).slice(0, 100)
      : [];
    const visibility = (VIS_VALUES.includes(String(p.visibility)) ? String(p.visibility) : "all") as Visibility;
    const maxRaw = Math.floor(Number(p.maxLength) || 0);
    const regexRaw = String(p.regex ?? "").trim().slice(0, 255);
    return {
      groupId,
      name,
      description: String(p.description ?? "").trim().slice(0, 300),
      type,
      options,
      required: Boolean(p.required),
      maxLength: maxRaw > 0 ? maxRaw : null,
      regex: regexRaw || null,
      showOnRegister: Boolean(p.showOnRegister),
      memberEditable: p.memberEditable === undefined ? true : Boolean(p.memberEditable),
      visibility,
      pii: Boolean(p.pii),
    };
  } catch {
    return null;
  }
}

// ── Grupos ───────────────────────────────────────────────────────────────

export async function createGroupAction(name: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const clean = String(name ?? "").trim();
  if (clean.length < 1 || clean.length > 120) return { ok: false, error: "Nome inválido." };
  const id = await createGroup(clean);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "pfgroup_create", target: `pfgroup:${id}` });
  revalidatePath("/admin/perfis");
  return { ok: true, data: { id } };
}

export async function updateGroupAction(id: number, name: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const clean = String(name ?? "").trim();
  if (clean.length < 1 || clean.length > 120) return { ok: false, error: "Nome inválido." };
  if (!(await updateGroup(id, clean))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/perfis");
  return { ok: true };
}

export async function deleteGroupAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteGroup(id))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "pfgroup_delete", target: `pfgroup:${id}` });
  revalidatePath("/admin/perfis");
  return { ok: true };
}

// ── Campos ───────────────────────────────────────────────────────────────

export async function createFieldAction(body: string): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseField(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  const id = await createField(input);
  if (!id) return { ok: false, error: "Falha ao criar." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "pfield_create", target: `pfield:${id}` });
  revalidatePath("/admin/perfis");
  return { ok: true, data: { id } };
}

export async function updateFieldAction(id: number, body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const input = parseField(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateField(id, input))) return { ok: false, error: "Falha." };
  revalidatePath("/admin/perfis");
  return { ok: true };
}

export async function deleteFieldAction(id: number): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteField(id))) return { ok: false, error: "Falha ao excluir." };
  await db.insert(auditLog).values({ actorId: Number(actor.id), action: "pfield_delete", target: `pfield:${id}` });
  revalidatePath("/admin/perfis");
  return { ok: true };
}

export async function copyFieldAction(id: number): Promise<Result<{ id: number }>> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  const newId = await copyField(id);
  if (!newId) return { ok: false, error: "Falha ao copiar." };
  revalidatePath("/admin/perfis");
  return { ok: true, data: { id: newId } };
}

// ── Configurações de perfil ───────────────────────────────────────────────

export async function saveProfileSettingsAction(body: string): Promise<Result> {
  const actor = await asAdmin();
  if (!actor) return { ok: false, error: "Acesso restrito." };
  try {
    const settings = sanitizeProfileSettings(JSON.parse(body));
    await setSetting("profile", settings);
    revalidatePath("/admin/perfis");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

// ── Membro: salvar valores ────────────────────────────────────────────────

export async function saveProfileFieldsAction(body: string): Promise<Result> {
  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, error: "Faça login." };
  }
  let input: Record<string, string>;
  try {
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return { ok: false, error: "Dados inválidos." };
    input = Object.fromEntries(Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]));
  } catch {
    return { ok: false, error: "Dados inválidos." };
  }
  const res = await saveValues(Number(user.id), input);
  if (!res.ok) return res;
  revalidatePath("/conta");
  revalidatePath(`/u/${user.handle}`);
  return { ok: true };
}
