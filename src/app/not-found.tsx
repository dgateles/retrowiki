import Link from "next/link";
import { Gamepad2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

// Fallback global de 404 (rotas fora do grupo (main) — ex.: admin — e URLs sem
// correspondência). Autocontido: o layout raiz não tem cabeçalho, então trazemos
// a marca e um caminho de volta.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold">
        <Gamepad2 className="size-5 text-primary" aria-hidden="true" /> RetroWiki
      </Link>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="text-muted-foreground">Esse endereço não existe ou foi movido.</p>
      </div>
      <Button asChild>
        <Link href="/"><Home className="size-4" aria-hidden="true" /> Voltar ao início</Link>
      </Button>
    </main>
  );
}
