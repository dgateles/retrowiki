// Cores dos prefixos de tópico — módulo client-safe (sem "server-only" nem
// dependência do schema), pra ser usado tanto no servidor quanto no cliente.

export const FORUM_PREFIX_COLORS = ["slate", "red", "orange", "amber", "green", "teal", "blue", "violet", "pink"] as const;
export type ForumPrefixColor = (typeof FORUM_PREFIX_COLORS)[number];

/** Classes Tailwind por cor da paleta (fixa — sem CSS livre). */
export const PREFIX_CHIP_CLASS: Record<ForumPrefixColor, string> = {
  slate: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  red: "bg-red-500/15 text-red-700 dark:text-red-300",
  orange: "bg-orange-500/15 text-orange-700 dark:text-orange-300",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  green: "bg-green-500/15 text-green-700 dark:text-green-300",
  teal: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
  blue: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  pink: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
};
