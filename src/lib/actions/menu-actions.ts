"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { requireRole } from "@/lib/auth-helpers";
import { ICON_KEYS } from "@/lib/page-icons";
import { DEFAULT_HEADER, DEFAULT_FOOTER, type MenuLocation } from "@/lib/menu";

type Result = { ok: boolean; error?: string };

async function admin(): Promise<boolean> {
  try {
    await requireRole("admin");
    return true;
  } catch {
    return false;
  }
}

const LOCATIONS = ["header", "footer"] as const;
const TYPES = ["link", "flyout", "dropdown"] as const;
const ICONS = new Set<string>(ICON_KEYS);

// http(s) absoluto ou caminho raiz-relativo (bloqueia javascript:/data: etc.).
const safeHref = (s: string) => /^(https?:\/\/|\/)[^\s]*$/i.test(s);

function revalidate() {
  revalidatePath("/", "layout");
}

type Input = {
  location?: unknown;
  label?: unknown;
  href?: unknown;
  type?: unknown;
  parentId?: unknown;
  icon?: unknown;
  description?: unknown;
};

async function parse(body: string, requireLocation: boolean) {
  const p = JSON.parse(body) as Input;
  const label = String(p.label ?? "").trim();
  if (label.length < 1) return { error: "Informe um rótulo." as const };
  if (label.length > 80) return { error: "Rótulo muito longo." as const };

  const hrefRaw = String(p.href ?? "").trim();
  if (hrefRaw && !safeHref(hrefRaw)) return { error: "O link deve ser uma URL http(s) ou um caminho começando com /." as const };

  const type = TYPES.includes(p.type as (typeof TYPES)[number]) ? (p.type as (typeof TYPES)[number]) : "link";
  const parentId = p.parentId == null || p.parentId === "" ? null : Number(p.parentId);
  if (parentId != null && !Number.isInteger(parentId)) return { error: "Pai inválido." as const };

  // Item-filho precisa de href; item-pai (flyout/dropdown sem filhos) pode não ter.
  if (parentId != null && !hrefRaw) return { error: "Itens de submenu precisam de um link." as const };

  const iconRaw = String(p.icon ?? "").trim();
  const icon = iconRaw && ICONS.has(iconRaw) ? iconRaw : null;
  const description = String(p.description ?? "").trim().slice(0, 200) || null;

  const data: {
    location?: MenuLocation;
    label: string;
    href: string | null;
    type: (typeof TYPES)[number];
    parentId: number | null;
    icon: string | null;
    description: string | null;
  } = { label, href: hrefRaw || null, type, parentId, icon, description };

  if (requireLocation) {
    const location = LOCATIONS.includes(p.location as MenuLocation) ? (p.location as MenuLocation) : "header";
    data.location = location;
  }
  return { data };
}

export async function createMenuItemAction(body: string): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  const parsed = await parse(body, true);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const d = parsed.data;
  try {
    // sortOrder = fim da lista de irmãos.
    const siblings = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(and(eq(menuItems.location, d.location!), d.parentId == null ? sql`${menuItems.parentId} is null` : eq(menuItems.parentId, d.parentId)));
    await db.insert(menuItems).values({
      location: d.location!,
      label: d.label,
      href: d.href,
      type: d.parentId == null ? d.type : "link",
      parentId: d.parentId,
      icon: d.icon,
      description: d.description,
      sortOrder: siblings.length,
      visible: true,
    });
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao criar." };
  }
}

export async function updateMenuItemAction(id: number, body: string): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  const parsed = await parse(body, false);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  const d = parsed.data;
  try {
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!row) return { ok: false, error: "Item não encontrado." };
    await db
      .update(menuItems)
      .set({
        label: d.label,
        href: d.href,
        // Só pais (topo) podem mudar de tipo; filhos ficam "link".
        type: row.parentId == null ? d.type : "link",
        icon: d.icon,
        description: d.description,
      })
      .where(eq(menuItems.id, id));
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}

export async function deleteMenuItemAction(id: number): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  try {
    const children = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.parentId, id));
    const ids = [id, ...children.map((c) => c.id)];
    await db.delete(menuItems).where(inArray(menuItems.id, ids));
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao excluir." };
  }
}

export async function setMenuItemVisibleAction(id: number, visible: boolean): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  try {
    await db.update(menuItems).set({ visible }).where(eq(menuItems.id, id));
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha." };
  }
}

/** Troca a posição com o irmão anterior/seguinte. */
export async function moveMenuItemAction(id: number, dir: -1 | 1): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  try {
    const [row] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!row) return { ok: false, error: "Item não encontrado." };
    const siblings = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.location, row.location), row.parentId == null ? sql`${menuItems.parentId} is null` : eq(menuItems.parentId, row.parentId)))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
    const i = siblings.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= siblings.length) return { ok: true };
    await db.update(menuItems).set({ sortOrder: j }).where(eq(menuItems.id, siblings[i].id));
    await db.update(menuItems).set({ sortOrder: i }).where(eq(menuItems.id, siblings[j].id));
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao reordenar." };
  }
}

/** Popula a estrutura padrão (só se a localização estiver vazia). */
export async function seedMenuDefaultsAction(location: MenuLocation): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  try {
    const existing = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.location, location)).limit(1);
    if (existing.length) return { ok: false, error: "Já há itens nesta localização." };
    const seed = location === "header" ? DEFAULT_HEADER : DEFAULT_FOOTER;
    let order = 0;
    for (const node of seed) {
      const [res] = await db.insert(menuItems).values({
        location,
        label: node.label,
        href: node.href ?? null,
        type: node.type,
        parentId: null,
        sortOrder: order++,
        visible: true,
      });
      const parentId = Number(res.insertId);
      let childOrder = 0;
      for (const c of node.children ?? []) {
        await db.insert(menuItems).values({
          location,
          label: c.label,
          href: c.href,
          type: "link",
          parentId,
          icon: c.icon ?? null,
          description: c.description ?? null,
          sortOrder: childOrder++,
          visible: true,
        });
      }
    }
    revalidate();
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao popular." };
  }
}

// ── Texto do rodapé (tagline + copyright) ──────────────────────────────────

export async function saveFooterSettingsAction(body: string): Promise<Result> {
  if (!(await admin())) return { ok: false, error: "Acesso restrito." };
  try {
    const { setSetting, sanitizeFooterSettings } = await import("@/lib/settings");
    await setSetting("footer", sanitizeFooterSettings(JSON.parse(body)));
    revalidatePath("/", "layout"); // rodapé aparece em todas as páginas
    revalidatePath("/admin/menus");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao salvar." };
  }
}
