import { Heart, Coffee, Github, Star, QrCode } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
    title: 'Apoie o Projeto Retro Wiki',
    description:
        'Ajude a manter o Retro Wiki no ar. Doe via Pix, Buy Me a Coffee ou contribua no GitHub. O Retro Wiki é gratuito e open source.',
    openGraph: {
        title: 'Apoie o Projeto Retro Wiki',
        description:
            'Ajude a manter o Retro Wiki no ar. Doe via Pix, Buy Me a Coffee ou contribua no GitHub.',
        type: 'website' as const,
        siteName: 'Retro Wiki',
        locale: 'pt_BR',
    },
    twitter: {
        card: 'summary' as const,
        title: 'Apoie o Projeto Retro Wiki',
        description:
            'Ajude a manter o Retro Wiki no ar. Doe via Pix, Buy Me a Coffee ou contribua no GitHub.',
    },
};

/**
 * Apoie (Support) page for Retro Wiki.
 * Shows ways to support the project.
 */
export default function ApoiePage() {
    return (
        <main className="flex-1 bg-background">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-20 right-20 w-80 h-80 dark:bg-(--fd-primary)/10 bg-(--fd-primary)/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--fd-primary)/10 mb-6 text-(--fd-primary)">
                        <Heart className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                        <span className="text-foreground">APOIE O </span>
                        <span className="rw-gradient-text">PROJETO</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        O Retro Wiki é gratuito e open source. Se você acha útil, considere apoiar para mantermos o conteúdo atualizado.
                    </p>
                </div>
            </section>

            <section className="pb-24">
                <div className="max-w-4xl mx-auto px-6">
                    {/* Support Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* GitHub */}
                        <a
                            href="https://github.com/dgateles/retrowiki"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-secondary/20 text-foreground">
                                    <Github className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-(--fd-primary) transition-colors">
                                        GitHub
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Contribua com código
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Reporte bugs, sugira melhorias ou envie Pull Requests para ajudar na evolução da wiki.
                            </p>
                        </a>

                        {/* Star */}
                        <a
                            href="https://github.com/dgateles/retrowiki"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                                    <Star className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-(--fd-primary) transition-colors">
                                        Dê uma Estrela
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Apoio gratuito
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Uma estrela no GitHub aumenta a visibilidade do projeto e ajuda mais pessoas a encontrá-lo.
                            </p>
                        </a>

                        {/* Buy Me a Coffee */}
                        <a
                            href="https://buymeacoffee.com/retrowiki"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5"
                        >
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
                                    <Coffee className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground group-hover:text-(--fd-primary) transition-colors">
                                        Buy Me a Coffee
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Doação única
                                    </p>
                                </div>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                                Pague um café para motivar os desenvolvedores e ajudar com os custos de domínio.
                            </p>
                        </a>

                        {/* Pix */}
                        <div className="group p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <QrCode className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-foreground">
                                        Pix
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Rápido e sem taxas
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-6 mt-6">
                                <div className="bg-white p-3 rounded-xl shadow-inner">
                                    <Image
                                        src="/qrcode.png"
                                        alt="QR Code Pix"
                                        width={160}
                                        height={160}
                                        className="rounded-lg"
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Escaneie para doar qualquer valor. <br />Todo apoio conta! 💚
                                </p>
                            </div>
                        </div>

                        {/* Share */}
                        <div className="md:col-span-2 group p-8 rounded-2xl border border-border bg-card hover:border-(--fd-primary)/50 transition-all shadow-lg hover:shadow-(--fd-primary)/5">
                            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                                <div className="p-4 rounded-full bg-(--fd-primary)/10 text-(--fd-primary)">
                                    <Heart className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-foreground mb-2">
                                        Compartilhe com a Comunidade
                                    </h3>
                                    <p className="text-muted-foreground max-w-xl">
                                        Se o Retro Wiki te ajudou, espalhe a palavra! Compartilhe o link em grupos de Discord, Telegram, Reddit ou WhatsApp de apaixonados por retro games.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
