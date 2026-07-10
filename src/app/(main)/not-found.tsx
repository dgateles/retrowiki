import Link from "next/link";
import { Compass, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

// 404 dentro do shell público (cabeçalho + rodapé via layout do grupo (main)).
// Cobre notFound() de /guias/[slug], /consoles/[slug], /blog/[slug], /u/[handle] etc.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Compass className="size-7" aria-hidden="true" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Página não encontrada</h1>
        <p className="text-muted-foreground">
          O conteúdo que você procura não existe, foi movido ou o link está incorreto.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild>
          <Link href="/"><Home className="size-4" aria-hidden="true" /> Início</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/buscar"><Search className="size-4" aria-hidden="true" /> Buscar</Link>
        </Button>
      </div>
    </main>
  );
}
