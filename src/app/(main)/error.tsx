"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Boundary de erro do shell público (mantém cabeçalho/rodapé). Substitui a tela
// crua "Application error" do Next por algo dentro da marca, com botão de tentar
// de novo (reset re-renderiza o segmento que falhou).
export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log no cliente para telemetria; a mensagem crua não é exposta ao usuário.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
        <p className="text-muted-foreground">
          Tivemos um problema ao carregar esta página. Tente novamente em instantes.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground/70">Código: {error.digest}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}><RotateCcw className="size-4" aria-hidden="true" /> Tentar de novo</Button>
        <Button asChild variant="outline">
          <Link href="/"><Home className="size-4" aria-hidden="true" /> Início</Link>
        </Button>
      </div>
    </main>
  );
}
