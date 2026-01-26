import Link from 'next/link';
import {
  Gamepad2,
  Cpu,
  HardDrive,
  Wifi,
  Settings,
  AlertTriangle,
  Zap,
  Monitor,
  ArrowRight,
  BookOpen,
  Search,
  Layers,
  Check,
} from 'lucide-react';

/**
 * Console data for the popular consoles grid.
 */
const popularConsoles = [
  {
    name: 'R36S',
    description: 'Console popular com RK3566 e tela IPS',
    href: '/r36s',
    badge: 'Popular',
  },
  {
    name: 'Miyoo Mini',
    description: 'Compacto e portátil com OnionOS',
    href: '/miyoo-mini',
  },
  {
    name: 'RG35XX',
    description: 'Anbernic com design retrô clássico',
    href: '/rg35xx',
  },
  {
    name: 'TrimUI Smart Pro',
    description: 'Tela grande e boa performance',
    href: '/trimui',
  },
  {
    name: 'PowKiddy RGB30',
    description: 'Tela 4:3 de alta qualidade',
    href: '/powkiddy',
  },
];

/**
 * Main topics for documentation navigation.
 */
const mainTopics = [
  {
    title: 'Detecção de Clone',
    description: 'Identifique a variante do seu console',
    href: '/docs/',
    icon: Search,
  },
  {
    title: 'Guia de Compra',
    description: 'Onde comprar e o que verificar',
    href: '/docs/',
    icon: Layers,
  },
  {
    title: 'Firmware & Config',
    description: 'Instalação e configuração',
    href: '/docs/',
    icon: Settings,
  },
  {
    title: 'Cartão SD',
    description: 'Compatibilidade e formatação',
    href: '/docs/',
    icon: HardDrive,
  },
  {
    title: 'Wi-Fi',
    description: 'Configuração de rede',
    href: '/docs/',
    icon: Wifi,
  },
  {
    title: 'Desempenho',
    description: 'Otimização e benchmarks',
    href: '/docs/',
    icon: Zap,
  },
  {
    title: 'Solução de Problemas',
    description: 'Troubleshooting passo a passo',
    href: '/docs/',
    icon: AlertTriangle,
  },
  {
    title: 'Atalhos',
    description: 'Combinações úteis',
    href: '/docs/',
    icon: Gamepad2,
  },
];

/**
 * Stats data for the stats bar.
 */
const stats = [
  { value: '10+', label: 'Consoles' },
  { value: '48+', label: 'Tutoriais' },
  { value: '50+', label: 'Guias' },
  { value: '8h+', label: 'Dedicação' },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-background">
        {/* Background effects */}
        <div
          className="absolute top-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-20 right-20 w-80 h-80 dark:bg-(--fd-primary)/10 bg-(--fd-primary)/20 rounded-full blur-[120px]"
          aria-hidden="true"
        />

        {/* Decorative elements */}
        <div
          className="absolute top-20 left-16 text-(--fd-primary)/30 text-6xl font-light"
          aria-hidden="true"
        >
          △
        </div>
        <div
          className="absolute top-40 right-24 text-secondary/20 text-8xl font-light"
          aria-hidden="true"
        >
          ✕
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight mb-6">
              <span className="rw-gradient-text">
                RETRO
              </span>
              <br />
              <span className="text-foreground">WIKI</span>
            </h1>

            <div className="bg-card/80 backdrop-blur-sm border-l-2 border-(--fd-primary) pl-4 py-3 mb-8 max-w-md">
              <p className="text-muted-foreground">
                Seu guia completo para consoles retrô portáteis.
                Firmware, configuração e troubleshooting.
              </p>
            </div>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-3 border! rounded-md text-foreground hover:bg-muted hover:border-(--fd-primary) transition-all uppercase tracking-wider font-semibold text-sm"
            >
              Explorar Guias
            </Link>
          </div>

          {/* Right: Console images placeholder */}
          <div className="hidden md:flex justify-center items-center gap-4">
            <div className="w-28 h-40 bg-linear-to-br from-card to-background rounded-xl border border-secondary/20 flex items-center justify-center opacity-60 -rotate-6">
              <Gamepad2 className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="w-32 h-44 bg-linear-to-br from-card to-background rounded-xl border border-(--fd-primary)/30 flex items-center justify-center shadow-lg shadow-(--fd-primary)/20 z-10">
              <Gamepad2 className="w-14 h-14 text-primary" />
            </div>
            <div className="w-28 h-40 bg-linear-to-br from-card to-background rounded-xl border border-secondary/20 flex items-center justify-center opacity-60 rotate-6">
              <Gamepad2 className="w-12 h-12 text-muted-foreground" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full bg-card border-y">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center py-6 px-4 border-r last:border-r-0"
            >
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Main Topics Grid */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Navegue pela Wiki
            </h2>
            <p className="text-muted-foreground mt-2">
              Tudo o que você precisa saber sobre seu console retrô
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mainTopics.map((topic, index) => {
              const Icon = topic.icon;

              return (
                <Link
                  key={index}
                  href={topic.href}
                  className="group p-5 bg-card rounded-lg border border-border hover:border-(--fd-primary)/50 hover:bg-accent/5 transition-all"
                >
                  <div className="mb-3 text-(--fd-primary)">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-foreground group-hover:text-(--fd-primary) transition-colors mb-1">
                    {topic.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {topic.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Consoles Section */}
      <section className="py-16 md:py-24 bg-secondary/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Consoles Suportados
              </h2>
              <p className="text-muted-foreground mt-2">
                Guias detalhados para cada modelo
              </p>
            </div>
            <Link
              href="/docs/"
              className="hidden md:flex items-center gap-2 text-primary hover:underline text-sm hover:text-(--fd-primary)"
            >
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularConsoles.map((console, index) => (
              <Link
                key={index}
                href={console.href}
                className="group p-5 bg-card rounded-lg border hover:border-(--fd-primary)/50 hover:bg-accent/5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-lg bg-(--fd-primary)/10">
                    <Gamepad2 className="w-5 h-5 text-(--fd-primary)" aria-hidden="true" />
                  </div>
                  {console.badge && (
                    <span className="px-2 py-0.5 text-xs font-bold uppercase bg-linear-to-r from-(--fd-primary) to-(--fd-primary)/80 text-primary-foreground rounded">
                      {console.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-(--fd-primary) transition-colors">
                  {console.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {console.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Pronto para começar?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Explore a documentação completa e aproveite ao máximo seu console retrô.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-8 py-3 bg-(--fd-primary) dark:text-zinc-900 text-white font-semibold rounded-md hover:bg-(--fd-primary)/90 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              Explorar Guias
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Retro Wiki</span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/dgateles/retrowiki"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="text-sm">GitHub</span>
              </a>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} Retro Wiki
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
