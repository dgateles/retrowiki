// Sistema de ranks por reputação. Função pura, sem acesso a banco, para uso
// no servidor e no cliente. Thresholds cumulativos.

export type UserRole = "member" | "contributor" | "moderator" | "admin";

const RANKS: { label: string; at: number }[] = [
  { label: "Novato", at: 0 },
  { label: "Iniciante", at: 40 },
  { label: "Explorador", at: 100 },
  { label: "Colaborador", at: 250 },
  { label: "Entusiasta", at: 500 },
  { label: "Veterano", at: 1000 },
  { label: "Especialista", at: 2000 },
  { label: "Mestre", at: 3500 },
  { label: "Curador", at: 5500 },
  { label: "Lenda", at: 8000 },
  { label: "Ídolo", at: 12000 },
  { label: "Guru", at: 18000 },
  { label: "Grão-Mestre", at: 26000 },
];

export const RANK_TOTAL = RANKS.length;

export type Rank = {
  index: number; // 1..RANK_TOTAL
  total: number;
  label: string;
  current: number; // pontos onde começa este rank
  next: number | null; // pontos do próximo rank (null no topo)
  pointsToNext: number; // 0 no topo
  progress: number; // 0..1 dentro do rank atual
};

export function rankForReputation(reputation: number): Rank {
  const rep = Math.max(0, Math.floor(reputation || 0));
  let i = 0;
  for (let k = 0; k < RANKS.length; k++) {
    if (rep >= RANKS[k].at) i = k;
  }
  const cur = RANKS[i];
  const nxt = RANKS[i + 1] ?? null;
  const pointsToNext = nxt ? nxt.at - rep : 0;
  const span = nxt ? nxt.at - cur.at : 1;
  const progress = nxt ? Math.min(1, Math.max(0, (rep - cur.at) / span)) : 1;
  return {
    index: i + 1,
    total: RANK_TOTAL,
    label: cur.label,
    current: cur.at,
    next: nxt ? nxt.at : null,
    pointsToNext,
    progress,
  };
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
