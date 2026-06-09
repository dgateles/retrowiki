"use client";

import { useEffect } from "react";

// Ao chegar via âncora de notificação (#comentario-N), rola até o comentário e
// pisca a borda com fade-in/fade-out. O :target do CSS não dispara de forma
// confiável com a navegação client-side do Next, então fazemos por JS.
export function CommentHighlighter() {
  useEffect(() => {
    function flash() {
      const hash = window.location.hash;
      if (!hash.startsWith("#comentario-")) return;
      const el = document.getElementById(hash.slice(1));
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("comment--flash");
      void el.offsetWidth; // reinicia a animação
      el.classList.add("comment--flash");
      el.addEventListener("animationend", () => el.classList.remove("comment--flash"), { once: true });
    }
    flash();
    window.addEventListener("hashchange", flash);
    return () => window.removeEventListener("hashchange", flash);
  }, []);

  return null;
}
