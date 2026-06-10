"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { createCategory, updateCategory, deleteCategory, moveCategory, addEntry, updateEntry, deleteEntry, moveEntry, type Layout, type EntryInput } from "@/lib/staff-directory";

type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const LAYOUTS = ["grid", "list", "twocol"];
const ROLES = ["member", "contributor", "moderator", "admin"];

async function asAdmin(): Promise<boolean> {
  try {
    await requireRole("admin");
    return true;
  } catch {
    return false;
  }
}

function revalidate() {
  revalidatePath("/admin/diretorio");
  revalidatePath("/equipe");
}

// ── Categorias ─────────────────────────────────────────────────────────────

function parseCategory(body: string): { title: string; layout: Layout } | null {
  try {
    const p = JSON.parse(body) as Record<string, unknown>;
    const title = String(p.title ?? "").trim();
    if (title.length < 1 || title.length > 120) return null;
    const layout = LAYOUTS.includes(String(p.layout)) ? (String(p.layout) as Layout) : "grid";
    return { title, layout };
  } catch {
    return null;
  }
}

export async function createCategoryAction(body: string): Promise<Result<{ id: number }>> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  const input = parseCategory(body);
  if (!input) return { ok: false, error: "Informe o título." };
  const id = await createCategory(input.title, input.layout);
  if (!id) return { ok: false, error: "Falha ao criar." };
  revalidate();
  return { ok: true, data: { id } };
}

export async function updateCategoryAction(id: number, body: string): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  const input = parseCategory(body);
  if (!input) return { ok: false, error: "Dados inválidos." };
  if (!(await updateCategory(id, input.title, input.layout))) return { ok: false, error: "Falha." };
  revalidate();
  return { ok: true };
}

export async function deleteCategoryAction(id: number): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteCategory(id))) return { ok: false, error: "Falha." };
  revalidate();
  return { ok: true };
}

export async function moveCategoryAction(id: number, dir: number): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  await moveCategory(id, dir < 0 ? -1 : 1);
  revalidate();
  return { ok: true };
}

export async function moveEntryAction(id: number, dir: number): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  await moveEntry(id, dir < 0 ? -1 : 1);
  revalidate();
  return { ok: true };
}

// ── Entradas ───────────────────────────────────────────────────────────────

async function buildEntry(body: string): Promise<{ input: EntryInput } | { error: string }> {
  let p: Record<string, unknown>;
  try {
    p = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return { error: "Dados inválidos." };
  }
  const type = p.type === "group" ? "group" : "member";
  const customName = String(p.customName ?? "").trim();
  const customTitle = String(p.customTitle ?? "").trim();
  const bio = String(p.bio ?? "");

  if (type === "group") {
    const role = String(p.groupRole ?? "");
    if (!ROLES.includes(role)) return { error: "Papel inválido." };
    return { input: { type, memberId: null, groupRole: role, customName, customTitle, bio } };
  }
  // member: resolve por handle
  const handle = String(p.handle ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!handle) return { error: "Informe o usuário (handle)." };
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.handle, handle)).limit(1);
  if (!u) return { error: `Usuário "@${handle}" não encontrado.` };
  return { input: { type, memberId: u.id, groupRole: null, customName, customTitle, bio } };
}

export async function addEntryAction(categoryId: number, body: string): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  const built = await buildEntry(body);
  if ("error" in built) return { ok: false, error: built.error };
  const id = await addEntry(categoryId, built.input);
  if (!id) return { ok: false, error: "Falha ao adicionar." };
  revalidate();
  return { ok: true };
}

export async function updateEntryAction(id: number, body: string): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  const built = await buildEntry(body);
  if ("error" in built) return { ok: false, error: built.error };
  if (!(await updateEntry(id, built.input))) return { ok: false, error: "Falha." };
  revalidate();
  return { ok: true };
}

export async function deleteEntryAction(id: number): Promise<Result> {
  if (!(await asAdmin())) return { ok: false, error: "Acesso restrito." };
  if (!(await deleteEntry(id))) return { ok: false, error: "Falha." };
  revalidate();
  return { ok: true };
}
