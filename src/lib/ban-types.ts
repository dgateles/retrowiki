// Tipos e rótulos de filtros de banimento. Client-safe (sem server-only).

export type BanType = "email" | "ip" | "name";
export type BanFilter = { id: number; type: BanType; content: string; reason: string; createdAt: Date };

export const BAN_TYPE_LABEL: Record<BanType, string> = {
  email: "E-mail",
  ip: "Endereço IP",
  name: "Nome de usuário",
};
