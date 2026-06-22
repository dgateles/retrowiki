"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

// Efeitos de texto que dependem de `motion/react` (Framer Motion). Carregados via
// next/dynamic com ssr:false → ficam FORA do bundle crítico da página; o chunk só
// baixa quando o efeito realmente entra em tela, depois da hidratação.
const TextAnimate = dynamic(() => import("@/components/ui/text-animate").then((m) => m.TextAnimate), { ssr: false });
const TypingAnimation = dynamic(() => import("@/components/ui/typing-animation").then((m) => m.TypingAnimation), { ssr: false });
const LineShadowText = dynamic(() => import("@/components/ui/line-shadow-text").then((m) => m.LineShadowText), { ssr: false });
const HyperText = dynamic(() => import("@/components/ui/hyper-text").then((m) => m.HyperText), { ssr: false });

/** Renderiza um efeito de título pesado (motion/react) sem bloquear o primeiro
 * paint. No SSR e no primeiro render do cliente mostra o texto puro — assim o
 * elemento de LCP (ex.: herói) pinta imediatamente do HTML do servidor, sem
 * esperar o Framer Motion. Após montar, troca pelo efeito animado, que baixa
 * como chunk separado. Evita também mismatch de hidratação (mesmo HTML inicial). */
// Hidratação-safe: false no servidor e no primeiro render do cliente, true depois
// — sem setState em efeito (evita renders em cascata).
const subscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

export function FxTextMotion({ fx, text }: { fx: string; text: string }) {
  // Texto puro até hidratar (SSR + primeiro paint) — caminho do LCP.
  if (!useHydrated()) return <>{text}</>;

  switch (fx) {
    case "textanimate":
      return <TextAnimate as="span" animation="blurInUp" by="word" className="inline-block">{text}</TextAnimate>;
    case "typing":
      return <TypingAnimation as="span" className="inline">{text}</TypingAnimation>;
    case "lineshadow":
      return <LineShadowText shadowColor="#10b981">{text}</LineShadowText>;
    case "hyper":
      return <HyperText as="span" className="inline-block">{text}</HyperText>;
    default:
      return <>{text}</>;
  }
}
