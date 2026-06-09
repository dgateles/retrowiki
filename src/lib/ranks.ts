// Sistema de ranks por reputação. Função pura, sem acesso a banco, para uso
// no servidor e no cliente. Thresholds cumulativos.

export type UserRole = "member" | "contributor" | "moderator" | "admin";

export type Tier = { label: string; at: number; icon: string };

// Tiers padrão (também usados como seed da tabela `ranks` e como fallback).
export const DEFAULT_TIERS: Tier[] = [
  { label: "Novato", at: 0, icon: "Hand" },
  { label: "Iniciante", at: 40, icon: "Hand" },
  { label: "Explorador", at: 100, icon: "Leaf" },
  { label: "Colaborador", at: 250, icon: "Leaf" },
  { label: "Entusiasta", at: 500, icon: "Lightbulb" },
  { label: "Veterano", at: 1000, icon: "Lightbulb" },
  { label: "Especialista", at: 2000, icon: "Share2" },
  { label: "Mestre", at: 3500, icon: "Star" },
  { label: "Curador", at: 5500, icon: "Award" },
  { label: "Lenda", at: 8000, icon: "Crown" },
  { label: "Ídolo", at: 12000, icon: "Gem" },
  { label: "Guru", at: 18000, icon: "Flame" },
  { label: "Grão-Mestre", at: 26000, icon: "Trophy" },
];

export const RANK_TOTAL = DEFAULT_TIERS.length;

/** Lista os tiers de rank padrão (para exibição/seed). */
export function rankTiers(): { index: number; label: string; at: number }[] {
  return DEFAULT_TIERS.map((r, i) => ({ index: i + 1, label: r.label, at: r.at }));
}

export type Rank = {
  index: number; // 1..total
  total: number;
  label: string;
  current: number; // pontos onde começa este rank
  next: number | null; // pontos do próximo rank (null no topo)
  pointsToNext: number; // 0 no topo
  progress: number; // 0..1 dentro do rank atual
};

/** Calcula o rank a partir de uma lista de tiers (ordenada por pontos).
 * Função pura, client-safe. */
export function rankForTiers(reputation: number, tiers: Tier[]): Rank {
  const list = tiers.length ? tiers : DEFAULT_TIERS;
  const rep = Math.max(0, Math.floor(reputation || 0));
  let i = 0;
  for (let k = 0; k < list.length; k++) {
    if (rep >= list[k].at) i = k;
  }
  const cur = list[i];
  const nxt = list[i + 1] ?? null;
  const pointsToNext = nxt ? nxt.at - rep : 0;
  const span = nxt ? nxt.at - cur.at : 1;
  const progress = nxt ? Math.min(1, Math.max(0, (rep - cur.at) / span)) : 1;
  return {
    index: i + 1,
    total: list.length,
    label: cur.label,
    current: cur.at,
    next: nxt ? nxt.at : null,
    pointsToNext,
    progress,
  };
}

export function rankForReputation(reputation: number): Rank {
  return rankForTiers(reputation, DEFAULT_TIERS);
}

const ROLE_LABEL: Record<UserRole, string> = {
  member: "Membro",
  contributor: "Colaborador",
  moderator: "Moderador",
  admin: "Administrador",
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role as UserRole] ?? role;
}
