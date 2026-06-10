// Highlight isomórfico (server + client). Usado pelo render de conteúdo rico,
// inclusive no preview do construtor de páginas (client).
import Prism from "prismjs";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-css";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-python";
import "prismjs/components/prism-ini";

const ALIAS: Record<string, string> = {
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  console: "bash",
  js: "javascript",
  ts: "typescript",
  yml: "yaml",
  html: "markup",
  xml: "markup",
  py: "python",
  conf: "ini",
  toml: "ini",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Destaca o código com PrismJS no servidor. Prism escapa o texto ao tokenizar,
 * então o HTML resultante é seguro. Cai para texto escapado se a linguagem for
 * desconhecida.
 */
export function highlightCode(code: string, lang?: string): { html: string; lang: string } {
  const key = ALIAS[(lang || "").toLowerCase()] || (lang || "").toLowerCase();
  const grammar = key ? Prism.languages[key] : undefined;
  if (grammar) {
    return { html: Prism.highlight(code, grammar, key), lang: key };
  }
  return { html: escapeHtml(code), lang: key || "text" };
}
