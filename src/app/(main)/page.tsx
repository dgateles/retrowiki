import Link from "next/link";
import { Gamepad2, BookOpen, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <main id="main" className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-sm font-medium text-primary">
            Comunidade de handhelds retrô
          </p>
          <h1 className="mt-2 max-w-2xl text-4xl font-black tracking-tight md:text-6xl">
            O catálogo e os guias de emulação portátil,{" "}
            <span className="text-primary">feitos pela comunidade</span>.
          </h1>
          <p className="mt-6 max-w-xl text-muted-foreground">
            Fichas técnicas detalhadas, tutoriais, guias de compra e firmware
            num só lugar, com curadoria. Em reconstrução na branch{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              next
            </code>
            .
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/auth/cadastrar">Começar agora</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/consoles">Ver consoles</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Gamepad2,
              title: "Catálogo rico",
              desc: "Specs completas, scores de emulação por sistema e comparação.",
            },
            {
              icon: BookOpen,
              title: "Conteúdo dinâmico",
              desc: "Blocos de releases do GitHub que se atualizam sozinhos e links de loja.",
            },
            {
              icon: Users,
              title: "Comunidade",
              desc: "Qualquer membro propõe tutoriais e guias — publicados sob moderação.",
            },
            {
              icon: ShieldCheck,
              title: "Anti-bot próprio",
              desc: "RetroGuard: verificação invisível e acessível, sem terceiros.",
            },
          ].map((f) => (
            <article
              key={f.title}
              className="rounded-lg border border-border bg-card p-5"
            >
              <f.icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-muted-foreground">
          © {new Date().getFullYear()} RetroWiki
        </div>
      </footer>
    </div>
  );
}
