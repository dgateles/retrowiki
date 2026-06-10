import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { profileFieldValues } from "@/db/schema";
import { listGroupsWithFields, type ProfileField, type GroupWithFields } from "@/lib/admin/profile-fields";

const STAFF = new Set(["moderator", "admin"]);

export type FieldWithValue = ProfileField & { value: string };
export type GroupWithValues = { id: number; name: string; fields: FieldWithValue[] };

async function valuesFor(userId: number): Promise<Map<number, string>> {
  const rows = await db.select({ fieldId: profileFieldValues.fieldId, value: profileFieldValues.value }).from(profileFieldValues).where(eq(profileFieldValues.userId, userId));
  return new Map(rows.map((r) => [r.fieldId, r.value ?? ""]));
}

/** Avalia a conclusão de perfil conforme a configuração do admin. */
export async function getProfileCompletion(userId: number, hasAvatar: boolean): Promise<{ complete: boolean; missingFields: number; needsAvatar: boolean }> {
  try {
    const { getProfileCompletionSettings } = await import("@/lib/settings");
    const settings = await getProfileCompletionSettings();
    if (!settings.enabled) return { complete: true, missingFields: 0, needsAvatar: false };

    const groups = await getEditableFields(userId);
    const editable = groups.flatMap((g) => g.fields);
    const missingFields = settings.requireFields ? editable.filter((f) => !f.value || f.value.trim() === "").length : 0;
    const needsAvatar = settings.requireAvatar && !hasAvatar;
    return { complete: missingFields === 0 && !needsAvatar, missingFields, needsAvatar };
  } catch {
    return { complete: true, missingFields: 0, needsAvatar: false };
  }
}

/** Campos que o membro pode editar, com os valores atuais. */
export async function getEditableFields(userId: number): Promise<GroupWithValues[]> {
  try {
    const groups = await listGroupsWithFields();
    const vals = await valuesFor(userId);
    return groups
      .map((g) => ({ id: g.id, name: g.name, fields: g.fields.filter((f) => f.memberEditable).map((f) => ({ ...f, value: vals.get(f.id) ?? "" })) }))
      .filter((g) => g.fields.length > 0);
  } catch {
    return [];
  }
}

/** Campos visíveis de um perfil, conforme quem está olhando. */
export async function getVisibleFields(profileUserId: number, viewer: { id: number; role: string } | null): Promise<GroupWithValues[]> {
  try {
    const isStaff = viewer ? STAFF.has(viewer.role) : false;
    const isOwner = viewer ? viewer.id === profileUserId : false;
    const canSee = (f: ProfileField): boolean => {
      switch (f.visibility) {
        case "all": return true;
        case "staff": return isStaff;
        case "staff_owner": return isStaff || isOwner;
        default: return false;
      }
    };
    const groups = await listGroupsWithFields();
    const vals = await valuesFor(profileUserId);
    return groups
      .map((g) => ({
        id: g.id,
        name: g.name,
        fields: g.fields.filter(canSee).map((f) => ({ ...f, value: vals.get(f.id) ?? "" })).filter((f) => f.value !== ""),
      }))
      .filter((g) => g.fields.length > 0);
  } catch {
    return [];
  }
}

function validate(field: ProfileField, raw: string): { ok: true; value: string } | { ok: false; error: string } {
  const value = raw.trim();
  if (!value) {
    if (field.required) return { ok: false, error: `"${field.name}" é obrigatório.` };
    return { ok: true, value: "" };
  }
  if (field.maxLength && field.type !== "checkboxset" && value.length > field.maxLength) {
    return { ok: false, error: `"${field.name}" excede ${field.maxLength} caracteres.` };
  }
  switch (field.type) {
    case "url": {
      let u: URL;
      try { u = new URL(value); } catch { return { ok: false, error: `"${field.name}": URL inválida.` }; }
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return { ok: false, error: `"${field.name}": use apenas URLs http(s).` };
      }
      break;
    }
    case "number":
      if (Number.isNaN(Number(value))) return { ok: false, error: `"${field.name}": número inválido.` };
      break;
    case "yesno":
      return { ok: true, value: value === "1" || value === "true" ? "1" : "0" };
    case "select":
    case "radio":
      if (!field.options.includes(value)) return { ok: false, error: `"${field.name}": opção inválida.` };
      break;
    case "checkboxset": {
      let arr: unknown;
      try { arr = JSON.parse(value); } catch { return { ok: false, error: `"${field.name}": valor inválido.` }; }
      if (!Array.isArray(arr)) return { ok: false, error: `"${field.name}": valor inválido.` };
      const filtered = arr.filter((x): x is string => typeof x === "string" && field.options.includes(x));
      return { ok: true, value: JSON.stringify(filtered) };
    }
    case "color":
      if (!/^#[0-9a-fA-F]{6}$/.test(value)) return { ok: false, error: `"${field.name}": cor inválida.` };
      break;
  }
  if (field.regex) {
    try {
      if (!new RegExp(field.regex).test(value)) return { ok: false, error: `"${field.name}": formato inválido.` };
    } catch {
      // regex inválida cadastrada → ignora a checagem
    }
  }
  return { ok: true, value };
}

/** Valida e grava os valores de um conjunto de campos (transação lógica). */
async function persistValues(userId: number, fields: ProfileField[], input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const resolved: { fieldId: number; value: string }[] = [];
  for (const field of fields) {
    const res = validate(field, input[String(field.id)] ?? "");
    if (!res.ok) return { ok: false, error: res.error };
    resolved.push({ fieldId: field.id, value: res.value });
  }
  for (const { fieldId, value } of resolved) {
    if (value === "") {
      await db.delete(profileFieldValues).where(and(eq(profileFieldValues.userId, userId), eq(profileFieldValues.fieldId, fieldId)));
    } else {
      await db.insert(profileFieldValues).values({ userId, fieldId, value }).onDuplicateKeyUpdate({ set: { value } });
    }
  }
  return { ok: true };
}

/** Salva os valores enviados pelo membro (só campos editáveis). */
export async function saveValues(userId: number, input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  try {
    const editable = (await getEditableFields(userId)).flatMap((g) => g.fields);
    return await persistValues(userId, editable, input);
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

/** Campos exibidos no cadastro (definições, sem valores). */
export async function getRegisterFields(): Promise<GroupWithValues[]> {
  try {
    const groups = await listGroupsWithFields();
    return groups
      .map((g) => ({ id: g.id, name: g.name, fields: g.fields.filter((f) => f.showOnRegister).map((f) => ({ ...f, value: "" })) }))
      .filter((g) => g.fields.length > 0);
  } catch {
    return [];
  }
}

/** Valida e grava os campos de cadastro de um novo usuário. */
export async function saveRegistrationValues(userId: number, input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  try {
    const fields = (await getRegisterFields()).flatMap((g) => g.fields);
    if (fields.length === 0) return { ok: true };
    return await persistValues(userId, fields, input);
  } catch {
    return { ok: false, error: "Falha ao salvar os campos." };
  }
}

/** Valida os campos de cadastro sem gravar (para checar antes de criar o usuário). */
export async function validateRegistrationValues(input: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  try {
    const fields = (await getRegisterFields()).flatMap((g) => g.fields);
    for (const field of fields) {
      const res = validate(field, input[String(field.id)] ?? "");
      if (!res.ok) return { ok: false, error: res.error };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export type { GroupWithFields };
