import Link from 'next/link';
import { Download, AlertTriangle, Info, HardDrive, Gamepad2 } from 'lucide-react';

export const metadata = {
    title: 'ROMs e BIOS - Coleções Curadas para Consoles Retrô',
    description:
        'Coleções recomendadas de ROMs e BIOS para consoles portáteis retrô como R36S, Miyoo Mini Plus, RG35XX e RG40XX H. Tiny Best Set GO, Done Set 2, TopRoms e arquivos BIOS para RetroArch.',
    keywords: [
        'ROMs retro',
        'BIOS retro',
        'Tiny Best Set GO',
        'Done Set 2',
        'TopRoms',
        'ROMs R36S',
        'ROMs Miyoo Mini',
        'BIOS RetroArch',
        'coleção ROMs',
        'download ROMs',
        'ROMs console portátil',
    ],
    openGraph: {
        title: 'ROMs e BIOS - Coleções Curadas para Consoles Retrô | Retro Wiki',
        description:
            'Coleções recomendadas de ROMs e BIOS para consoles portáteis retrô. Tiny Best Set GO, Done Set 2, TopRoms e arquivos BIOS para RetroArch.',
        type: 'article' as const,
        siteName: 'Retro Wiki',
        locale: 'pt_BR',
    },
    twitter: {
        card: 'summary' as const,
        title: 'ROMs e BIOS - Coleções Curadas | Retro Wiki',
        description:
            'Coleções recomendadas de ROMs e BIOS para consoles portáteis retrô. Tiny Best Set GO, Done Set 2 e TopRoms.',
    },
};

export default function RomsPage() {
    return (
        <main className="flex-1 bg-background">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-20 right-20 w-80 h-80 dark:bg-(--fd-primary)/10 bg-(--fd-primary)/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                        <span className="rw-gradient-text">COLEÇÕES</span>
                        <br />
                        <span className="text-foreground">DE ROMS & BIOS</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Links selecionados pela comunidade para facilitar sua configuração.
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="uppercase tracking-wide">Aviso Legal Importante</span>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="pb-24">
                <div className="max-w-4xl mx-auto px-6 space-y-12">

                    {/* Disclaimer Alert */}
                    <div className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                            Todos os arquivos listados aqui estão hospedados em sites de terceiros (Archive.org, GitHub).
                            O <strong>Retro Wiki</strong> não hospeda, não envia e não controla nenhum desses arquivos.
                            Este índice serve apenas para fins informativos e de preservação histórica.
                        </p>
                    </div>

                    <div className="grid gap-8">

                        {/* Tiny Best Set GO */}
                        <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-(--fd-primary)/10 text-(--fd-primary)">
                                            <Gamepad2 className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold">Tiny Best Set: GO!</h2>
                                    </div>

                                    <div className="prose dark:prose-invert text-sm text-muted-foreground mb-6 space-y-2">
                                        <p className="font-medium text-foreground flex items-center gap-2">
                                            <Info className="w-4 h-4 text-blue-500" />
                                            Login no Archive.org pode ser necessário!
                                        </p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>
                                                <strong>Base (6GB):</strong> 1.900 jogos incluindo Arcade, Neo Geo, Atari 2600, TG-16, GB, GBC, GBA, NES, SNES, Game Gear, Master System e Genesis.
                                            </li>
                                            <li>
                                                <strong>Expansão 64GB (+49GB):</strong> Adiciona 10 Jogos Sega CD, 10 TG-16 CD e 100 PlayStation 1.
                                            </li>
                                            <li>
                                                <strong>Expansão 128GB (+40GB):</strong> Adiciona mais 15 Sega CD, 15 TG-16 CD e 100 PlayStation 1.
                                            </li>
                                        </ul>
                                    </div>

                                    <a
                                        href="https://archive.org/details/tiny-best-set-go"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5! rounded-(--rw-radius-md)"
                                    >
                                        <Download className="w-4 h-4" />
                                        Acessar Tiny Best Set: GO
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Retro ROMs Best Set */}
                        <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-secondary/20 text-foreground">
                                            <HardDrive className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold">Done Set 2</h2>
                                    </div>

                                    <div className="prose dark:prose-invert text-sm text-muted-foreground mb-6 space-y-4">
                                        <p className="font-medium text-foreground flex items-center gap-2">
                                            <Info className="w-4 h-4 text-blue-500" />
                                            Login no Archive.org pode ser necessário!
                                        </p>
                                        <div>
                                            <strong className="block text-foreground mb-1">1. BIOS Necessárias:</strong>
                                            <p className="mb-2">
                                                Obtenha os arquivos de BIOS necessários na coleção abaixo. Verifique a documentação do seu firmware para saber onde colocá-los.
                                            </p>
                                            <a
                                                href="https://archive.org/download/RetroarchSystemFiles/Retroarch-System/"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-(--fd-primary) hover:underline text-xs"
                                            >
                                                ➜ Retroarch System Files (BIOS Collection)
                                            </a>
                                        </div>
                                        <div>
                                            <strong className="block text-foreground mb-1">2. Organização:</strong>
                                            <p>
                                                Verifique a documentação do seu firmware (ArkOS, OnionOS, etc) para saber a pasta correta de cada sistema.
                                                Para sistemas de CD (PS1, Sega CD), pode ser necessário criar arquivos <code>.m3u</code>.
                                            </p>
                                        </div>
                                    </div>

                                    <a
                                        href="https://archive.org/details/retro-roms-best-set"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-6 py-3 dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5! rounded-(--rw-radius-md)"
                                    >
                                        <Download className="w-4 h-4" />
                                        Acessar Retro ROMs Best Set
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* TopRoms */}
                        <div className="group relative p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                            <Download className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-2xl font-bold">TopRoms Collection</h2>
                                    </div>

                                    <div className="prose dark:prose-invert text-sm text-muted-foreground mb-6">
                                        <p>
                                            Coleção curada disponível via Torrent ou Download direto no GitHub.
                                        </p>
                                        <p className="bg-muted p-2 rounded text-xs mt-2 font-mono">
                                            TopRoms Collection - 2025-01-06.torrent
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <a
                                            href="https://github.com/cdahmedeh/TopRoms?tab=readme-ov-file"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5! rounded-(--rw-radius-md)"
                                        >
                                            <Download className="w-4 h-4" />
                                            Ver no GitHub
                                        </a>
                                        <a
                                            href="https://github.com/cdahmedeh/TopRoms/raw/refs/heads/main/torrents/TopRoms%20Collection%20-%202025-01-06.torrent"
                                            className="inline-flex items-center gap-2 px-6 py-3 dark:bg-transparent! dark:border-green-500/20! border! hover:bg-green-100/20 dark:hover:bg-green-100/5! rounded-(--rw-radius-md)"
                                        >
                                            <Download className="w-4 h-4" />
                                            Baixar Torrent Direto
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </main>
    );
}
