"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";

type Challenge = {
  nonce: string;
  difficulty: number;
  action: string;
  exp: number;
  sig: string;
};

export type CaptchaSolution = Challenge & {
  counter: number;
  signals: { honeypot: string; elapsedMs: number; interacted: boolean };
};

/**
 * RetroGuard — captcha proprietário, invisível. Busca um desafio, resolve o
 * Proof-of-Work num Web Worker e reporta a solução via onSolved. Inclui um
 * honeypot acessível (escondido de humanos e de leitores de tela).
 */
export function RetroGuard({
  action,
  onSolved,
}: {
  action: string;
  onSolved: (s: CaptchaSolution | null) => void;
}) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const honeypotRef = useRef<HTMLInputElement>(null);
  const mountedAt = useRef<number>(0);
  const interacted = useRef(false);

  useEffect(() => {
    mountedAt.current = Date.now();
    const onInteract = () => (interacted.current = true);
    window.addEventListener("keydown", onInteract, { once: true });
    window.addEventListener("pointerdown", onInteract, { once: true });

    let worker: Worker | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/captcha?action=${encodeURIComponent(action)}`);
        if (!res.ok) throw new Error("challenge");
        const ch: Challenge = await res.json();
        worker = new Worker("/retroguard-worker.js");
        worker.onmessage = (e: MessageEvent<{ counter?: number; error?: string }>) => {
          if (cancelled) return;
          if (typeof e.data.counter === "number") {
            setState("ok");
            onSolved({
              ...ch,
              counter: e.data.counter,
              signals: {
                honeypot: honeypotRef.current?.value ?? "",
                elapsedMs: Date.now() - mountedAt.current,
                interacted: interacted.current,
              },
            });
          } else {
            setState("error");
            onSolved(null);
          }
        };
        worker.postMessage({ nonce: ch.nonce, difficulty: ch.difficulty });
      } catch {
        if (!cancelled) {
          setState("error");
          onSolved(null);
        }
      }
    })();

    return () => {
      cancelled = true;
      worker?.terminate();
      window.removeEventListener("keydown", onInteract);
      window.removeEventListener("pointerdown", onInteract);
    };
  }, [action, onSolved]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
      {/* honeypot: invisível e fora da ordem de foco/leitura */}
      <input
        ref={honeypotRef}
        type="text"
        name="rg_hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute h-0 w-0 overflow-hidden opacity-0"
      />
      {state === "loading" && (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Verificando seu navegador…
        </>
      )}
      {state === "ok" && (
        <>
          <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden="true" />
          Verificação concluída
        </>
      )}
      {state === "error" && (
        <span className="text-destructive">
          Falha na verificação. Recarregue a página.
        </span>
      )}
    </div>
  );
}
