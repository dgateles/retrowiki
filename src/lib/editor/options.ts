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

// Linguagens do bloco de código (alinhadas ao Prism do renderizador).
export const CODE_LANGS: { label: string; value: string }[] = [
  { label: "Texto", value: "" },
  { label: "Bash", value: "bash" },
  { label: "JSON", value: "json" },
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "JSX", value: "jsx" },
  { label: "TSX", value: "tsx" },
  { label: "CSS", value: "css" },
  { label: "HTML", value: "markup" },
  { label: "SQL", value: "sql" },
  { label: "YAML", value: "yaml" },
  { label: "Python", value: "python" },
  { label: "INI/Conf", value: "ini" },
];

export const HEX_COLOR = /^#[0-9a-fA-F]{3,8}$/;

// Emojis com palavras-chave para a busca do picker.
export const EMOJIS: { c: string; n: string }[] = [
  { c: "😀", n: "sorriso feliz grin" }, { c: "😄", n: "feliz sorriso alegre" },
  { c: "😁", n: "sorriso dentes grin" }, { c: "😅", n: "suor riso nervoso" },
  { c: "😂", n: "rir lagrima lol" }, { c: "🙂", n: "leve sorriso" },
  { c: "😉", n: "piscada wink" }, { c: "😊", n: "feliz corar" },
  { c: "😍", n: "apaixonado coracao olhos love" }, { c: "😘", n: "beijo love" },
  { c: "😎", n: "oculos legal cool" }, { c: "🤓", n: "nerd oculos" },
  { c: "🤔", n: "pensar duvida" }, { c: "😴", n: "dormir sono" },
  { c: "😢", n: "triste lagrima" }, { c: "😭", n: "chorar triste" },
  { c: "😡", n: "raiva bravo angry" }, { c: "🤯", n: "explodir mente surpresa" },
  { c: "🥳", n: "festa comemorar party" }, { c: "😬", n: "tenso careta" },
  { c: "🤩", n: "estrela olhos uau" }, { c: "😌", n: "alivio aliviado calmo" },
  { c: "🙄", n: "olhos revirar" }, { c: "😏", n: "malicioso smirk" },
  { c: "😱", n: "medo grito scream" }, { c: "🤗", n: "abraco hug" },
  { c: "👍", n: "joia like positivo" }, { c: "👎", n: "negativo dislike" },
  { c: "👏", n: "palmas aplausos clap" }, { c: "🙌", n: "maos celebrar" },
  { c: "🙏", n: "obrigado reza please" }, { c: "💪", n: "forca musculo" },
  { c: "🤝", n: "aperto mao acordo deal" }, { c: "👌", n: "ok perfeito" },
  { c: "✌️", n: "paz vitoria peace" }, { c: "🤙", n: "liga call shaka" },
  { c: "👋", n: "tchau ola wave" }, { c: "🫡", n: "saudacao salute" },
  { c: "❤️", n: "coracao amor love red" }, { c: "🧡", n: "coracao laranja" },
  { c: "💛", n: "coracao amarelo" }, { c: "💚", n: "coracao verde" },
  { c: "💙", n: "coracao azul" }, { c: "💜", n: "coracao roxo" },
  { c: "🔥", n: "fogo quente fire" }, { c: "⭐", n: "estrela star" },
  { c: "✨", n: "brilho sparkle" }, { c: "🎉", n: "festa comemorar party" },
  { c: "🚀", n: "foguete rocket" }, { c: "💡", n: "ideia luz lampada" },
  { c: "⚡", n: "raio energia" }, { c: "✅", n: "certo check ok" },
  { c: "❌", n: "errado x cancelar" }, { c: "⚠️", n: "atencao aviso warning" },
  { c: "🎮", n: "jogo controle game" }, { c: "🕹️", n: "joystick arcade" },
  { c: "👾", n: "alien game invader" }, { c: "🎯", n: "alvo mira target" },
  { c: "🏆", n: "trofeu vitoria" }, { c: "🥇", n: "medalha ouro primeiro" },
  { c: "📦", n: "caixa pacote box" }, { c: "🔋", n: "bateria" },
  { c: "📱", n: "celular telefone" }, { c: "💾", n: "salvar disquete save" },
  { c: "💻", n: "notebook computador" }, { c: "🖥️", n: "monitor computador" },
];
