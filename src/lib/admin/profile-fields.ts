import "server-only";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { profileFieldGroups, profileFields, profileFieldValues } from "@/db/schema";
import { FIELD_TYPE_VALUES, type FieldType, type Visibility } from "@/lib/profile-field-types";

export type ProfileField = {
  id: number;
  groupId: number;
  name: string;
  description: string;
  type: FieldType;
  options: string[];
  required: boolean;
  maxLength: number | null;
  regex: string | null;
  showOnRegister: boolean;
  memberEditable: boolean;
  visibility: Visibility;
  pii: boolean;
  sortOrder: number;
};

export type GroupWithFields = { id: number; name: string; sortOrder: number; fields: ProfileField[] };

function asOptions(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function rowToField(r: typeof profileFields.$inferSelect): ProfileField {
  return {
    id: r.id,
    groupId: r.groupId,
    name: r.name,
    description: r.description,
    type: (FIELD_TYPE_VALUES.includes(r.type) ? r.type : "text") as FieldType,
    options: asOptions(r.options),
    required: r.required,
    maxLength: r.maxLength,
    regex: r.regex,
    showOnRegister: r.showOnRegister,
    memberEditable: r.memberEditable,
    visibility: r.visibility as Visibility,
    pii: r.pii,
    sortOrder: r.sortOrder,
  };
}

export async function listGroupsWithFields(): Promise<GroupWithFields[]> {
  try {
    const groups = await db.select().from(profileFieldGroups).orderBy(asc(profileFieldGroups.sortOrder), asc(profileFieldGroups.id));
    if (groups.length === 0) return [];
    const fields = await db.select().from(profileFields).orderBy(asc(profileFields.sortOrder), asc(profileFields.id));
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      sortOrder: g.sortOrder,
      fields: fields.filter((f) => f.groupId === g.id).map(rowToField),
    }));
  } catch {
    return [];
  }
}

export async function getField(id: number): Promise<ProfileField | null> {
  try {
    const [f] = await db.select().from(profileFields).where(eq(profileFields.id, id)).limit(1);
    return f ? rowToField(f) : null;
  } catch {
    return null;
  }
}

// ── Grupos ───────────────────────────────────────────────────────────────

export async function createGroup(name: string): Promise<number | null> {
  try {
    const [max] = await db.select({ m: sql<number>`COALESCE(MAX(${profileFieldGroups.sortOrder}), 0)` }).from(profileFieldGroups);
    const [res] = await db.insert(profileFieldGroups).values({ name, sortOrder: Number(max?.m ?? 0) + 1 });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateGroup(id: number, name: string): Promise<boolean> {
  try {
    await db.update(profileFieldGroups).set({ name }).where(eq(profileFieldGroups.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteGroup(id: number): Promise<boolean> {
  try {
    const fields = await db.select({ id: profileFields.id }).from(profileFields).where(eq(profileFields.groupId, id));
    const ids = fields.map((f) => f.id);
    if (ids.length) {
      await db.delete(profileFieldValues).where(inArray(profileFieldValues.fieldId, ids));
      await db.delete(profileFields).where(eq(profileFields.groupId, id));
    }
    await db.delete(profileFieldGroups).where(eq(profileFieldGroups.id, id));
    return true;
  } catch {
    return false;
  }
}

// ── Campos ───────────────────────────────────────────────────────────────

export type FieldInput = {
  groupId: number;
  name: string;
  description: string;
  type: FieldType;
  options: string[];
  required: boolean;
  maxLength: number | null;
  regex: string | null;
  showOnRegister: boolean;
  memberEditable: boolean;
  visibility: Visibility;
  pii: boolean;
};

export async function createField(input: FieldInput): Promise<number | null> {
  try {
    const [max] = await db.select({ m: sql<number>`COALESCE(MAX(${profileFields.sortOrder}), 0)` }).from(profileFields).where(eq(profileFields.groupId, input.groupId));
    const [res] = await db.insert(profileFields).values({ ...input, options: input.options, sortOrder: Number(max?.m ?? 0) + 1 });
    return (res as unknown as { insertId: number }).insertId;
  } catch {
    return null;
  }
}

export async function updateField(id: number, input: FieldInput): Promise<boolean> {
  try {
    await db.update(profileFields).set({ ...input, options: input.options }).where(eq(profileFields.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function deleteField(id: number): Promise<boolean> {
  try {
    await db.delete(profileFieldValues).where(eq(profileFieldValues.fieldId, id));
    await db.delete(profileFields).where(eq(profileFields.id, id));
    return true;
  } catch {
    return false;
  }
}

export async function copyField(id: number): Promise<number | null> {
  const f = await getField(id);
  if (!f) return null;
  return createField({
    groupId: f.groupId,
    name: `${f.name} (cópia)`,
    description: f.description,
    type: f.type,
    options: f.options,
    required: f.required,
    maxLength: f.maxLength,
    regex: f.regex,
    showOnRegister: f.showOnRegister,
    memberEditable: f.memberEditable,
    visibility: f.visibility,
    pii: f.pii,
  });
}
