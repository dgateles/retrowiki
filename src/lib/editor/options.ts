// Opções fixas do editor rico, compartilhadas entre a barra de ferramentas e a
// validação no servidor. Manter sincronizadas garante que só valores conhecidos
// passem (sem cores/tamanhos arbitrários).

export const TEXT_COLORS: { label: string; value: string | null }[] = [
  { label: "Padrão", value: null },
  { label: "Vermelho", value: "#ef4444" },
  { label: "Laranja", value: "#f97316" },
  { label: "Amarelo", value: "#eab308" },
  { label: "Verde", value: "#22c55e" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Índigo", value: "#6366f1" },
  { label: "Violeta", value: "#a855f7" },
];

export const HIGHLIGHT_COLORS: { label: string; value: string | null }[] = [
  { label: "Sem destaque", value: null },
  { label: "Vermelho", value: "#fecaca" },
  { label: "Laranja", value: "#fed7aa" },
  { label: "Amarelo", value: "#fef08a" },
  { label: "Verde", value: "#bbf7d0" },
  { label: "Azul", value: "#bfdbfe" },
  { label: "Violeta", value: "#e9d5ff" },
];

export const FONT_SIZES = ["80%", "90%", "100%", "125%", "150%", "175%", "200%"] as const;
export type FontSize = (typeof FONT_SIZES)[number];

export const ALIGNMENTS = ["left", "center", "right", "justify"] as const;
export type Alignment = (typeof ALIGNMENTS)[number];

export const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

export const EMOJIS = [
  "😀", "😄", "😁", "😅", "😂", "🙂", "😉", "😊", "😍", "😘",
  "😎", "🤓", "🤔", "😴", "😢", "😭", "😡", "🤯", "🥳", "😬",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👌", "✌️", "🤙",
  "❤️", "🔥", "⭐", "✨", "🎉", "🚀", "💡", "⚡", "✅", "❌",
  "🎮", "🕹️", "👾", "🎯", "🏆", "🥇", "📦", "🔋", "📱", "💾",
] as const;
