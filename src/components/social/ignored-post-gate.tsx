"use client";

import { useState } from "react";
import { EyeOff } from "lucide-react";

/** Recolhe o post de um usuário ignorado; um clique revela o conteúdo. */
export function IgnoredPostGate({ authorName, children }: { authorName: string; children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed) return <>{children}</>;
  return (
    <div className="fignored">
      <EyeOff className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>Você ignora <b>{authorName}</b>. Este conteúdo está oculto.</span>
      <button type="button" className="link-inline ml-auto" onClick={() => setRevealed(true)}>Mostrar mesmo assim</button>
    </div>
  );
}
