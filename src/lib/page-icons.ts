// Allowlist de ícones do widget "lista de ícones" — compartilhado entre o schema
// (server), o renderer e o editor (client). Sem server-only.

export const ICON_KEYS = ["check", "star", "zap", "shield", "heart", "gamepad", "download", "settings", "info", "trophy", "sparkles", "rocket"] as const;
export type IconKey = (typeof ICON_KEYS)[number];

export const ICON_LABELS: Record<IconKey, string> = {
  check: "Check", star: "Estrela", zap: "Raio", shield: "Escudo", heart: "Coração", gamepad: "Controle",
  download: "Download", settings: "Engrenagem", info: "Info", trophy: "Troféu", sparkles: "Brilho", rocket: "Foguete",
};
