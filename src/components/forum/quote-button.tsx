"use client";

import { Quote } from "lucide-react";

export type ForumQuoteDetail = { author: string; text: string; permalink: string };

/** Botão "Citar" de um post: dispara um evento que o formulário de resposta escuta
 * para injetar a citação no editor. Clicar em vários posts empilha as citações. */
export function QuoteButton({ author, text, permalink }: ForumQuoteDetail) {
  function onClick() {
    window.dispatchEvent(new CustomEvent<ForumQuoteDetail>("forum:quote", { detail: { author, text, permalink } }));
  }
  return (
    <button type="button" onClick={onClick} className="fquote-btn">
      <Quote className="size-4" aria-hidden="true" /> Citar
    </button>
  );
}
