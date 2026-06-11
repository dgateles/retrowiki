import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";

export type { MenuItem } from "@/db/schema";

export type MenuLocation = "header" | "footer";
export type MenuItemType = "link" | "flyout" | "dropdown";

export type MenuChild = {
  id: number;
  label: string;
  href: string | null;
  icon: string | null;
  description: string | null;
};
export type MenuNode = MenuChild & { type: MenuItemType; children: MenuChild[] };

const toChild = (c: typeof menuItems.$inferSelect): MenuChild => ({
  id: c.id,
  label: c.label,
  href: c.href,
  icon: c.icon,
  description: c.description,
});

function buildTree(rows: (typeof menuItems.$inferSelect)[]): MenuNode[] {
  return rows
    .filter((r) => r.parentId == null)
    .map((t) => ({
      ...toChild(t),
      type: t.type,
      children: rows.filter((c) => c.parentId === t.id).map(toChild),
    }));
}

/** Árvore de menu (apenas itens visíveis) para o header/footer público. */
export async function getMenuTree(location: MenuLocation): Promise<MenuNode[]> {
  try {
    const rows = await db
      .select()
      .from(menuItems)
      .where(and(eq(menuItems.location, location), eq(menuItems.visible, true)))
      .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
    return buildTree(rows);
  } catch {
    return [];
  }
}

/** Todos os itens (inclui ocultos) para gestão no admin. */
export async function getAllMenuItems(location: MenuLocation) {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.location, location))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
}

export async function menuItemCount(): Promise<number> {
  try {
    const rows = await db.select({ id: menuItems.id }).from(menuItems).limit(1);
    return rows.length;
  } catch {
    return 0;
  }
}

// Estrutura padrão (espelha a nav atual). Usada como fallback quando a tabela
// está vazia e como "Restaurar padrão" no admin.
type SeedChild = { label: string; href: string; icon?: string; description?: string };
type SeedNode = { label: string; href?: string; type: MenuItemType; children?: SeedChild[] };

export const DEFAULT_HEADER: SeedNode[] = [
  { label: "Consoles", href: "/consoles", type: "link" },
  { label: "Guias", href: "/guias", type: "link" },
  { label: "Blog", href: "/blog", type: "link" },
  {
    label: "Comunidade",
    type: "flyout",
    children: [
      { label: "Leaderboard", href: "/leaderboard", icon: "trophy", description: "Ranking de membros e guias em alta" },
      { label: "Missões", href: "/missoes", icon: "star", description: "Complete tarefas e ganhe conquistas" },
      { label: "Equipe", href: "/equipe", icon: "shield", description: "Quem mantém a RetroWiki" },
    ],
  },
];

export const DEFAULT_FOOTER: SeedNode[] = [
  {
    label: "Explorar",
    type: "dropdown",
    children: [
      { label: "Consoles", href: "/consoles" },
      { label: "Guias", href: "/guias" },
      { label: "Blog", href: "/blog" },
      { label: "Comparar", href: "/consoles/comparar" },
    ],
  },
  {
    label: "Comunidade",
    type: "dropdown",
    children: [
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Missões", href: "/missoes" },
      { label: "Equipe", href: "/equipe" },
    ],
  },
];

/** Insere a estrutura padrão de uma localização (sem checar permissão). */
export async function insertSeed(location: MenuLocation) {
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
}

/** Materializa header/footer vazios com o padrão (idempotente). Usado pelo
 * editor do admin para que a árvore reflita o que o site exibe no fallback. */
export async function ensureMenuSeeded(): Promise<void> {
  try {
    for (const location of ["header", "footer"] as const) {
      const existing = await db.select({ id: menuItems.id }).from(menuItems).where(eq(menuItems.location, location)).limit(1);
      if (existing.length === 0) await insertSeed(location);
    }
  } catch {
    // tabela ausente / DB indisponível — ignora (o site usa o fallback).
  }
}

/** Converte a estrutura padrão em árvore renderizável (fallback sem IDs reais). */
export function seedToTree(seed: SeedNode[]): MenuNode[] {
  let id = 0;
  return seed.map((n) => ({
    id: --id,
    label: n.label,
    href: n.href ?? null,
    type: n.type,
    icon: null,
    description: null,
    children: (n.children ?? []).map((c) => ({
      id: --id,
      label: c.label,
      href: c.href,
      icon: c.icon ?? null,
      description: c.description ?? null,
    })),
  }));
}
