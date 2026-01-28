import {
    Download,
    Settings,
    FolderSearch,
    RefreshCw,
    Image as ImageIcon,
    Globe,
    AlertTriangle,
    Check,
    Info,
    Wrench,
} from 'lucide-react';
import { ClickableImage } from '@/components/ClickableImage';
import { FirmwareList } from '@/components/mdx/FirmwareList';

export const metadata = {
    title: 'Retro Tool - Gerenciador de Biblioteca para EmulationStation',
    description:
        'Retro Tool é uma ferramenta gratuita para gerar gamelist.xml, baixar capas via ScreenScraper, renomear imagens e converter arquivos DAT para o formato EmulationStation. Tutorial completo de uso.',
    keywords: [
        'Retro Tool',
        'gamelist.xml',
        'EmulationStation',
        'ScreenScraper',
        'scraper',
        'capas de jogos',
        'metadados jogos',
        'R36S gamelist',
        'Miyoo Mini gamelist',
        'ArkOS scraper',
        'renomear imagens jogos',
        'converter DAT XML',
    ],
    alternates: {
        canonical: 'https://retro.wiki.br/retro-tool',
    },
    openGraph: {
        title: 'Retro Tool - Gerenciador de Biblioteca para EmulationStation | Retro Wiki',
        description:
            'Ferramenta gratuita para gerar gamelist.xml, baixar capas e metadados via ScreenScraper, e converter arquivos para EmulationStation.',
        type: 'article' as const,
        url: 'https://retro.wiki.br/retro-tool',
        siteName: 'Retro Wiki',
        locale: 'pt_BR',
        images: [
            {
                url: '/retrotool-images/tela-inicial.png',
                width: 1200,
                height: 630,
                alt: 'Retro Tool - Interface principal do Coletor de Jogos',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image' as const,
        title: 'Retro Tool - Gerenciador para EmulationStation',
        description:
            'Gere gamelist.xml, baixe capas via ScreenScraper e converta arquivos para EmulationStation.',
        images: ['/retrotool-images/tela-inicial.png'],
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Retro Tool',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Windows',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
    },
    description:
        'Ferramenta gratuita para gerar gamelist.xml, baixar capas e metadados via ScreenScraper, renomear imagens e converter arquivos DAT para EmulationStation.',
    softwareVersion: 'latest',
    downloadUrl: 'https://github.com/dgateles/retrotool/releases',
    featureList: [
        'Geração de gamelist.xml',
        'Download de capas via ScreenScraper API',
        'Download de miniaturas',
        'Renomeador de imagens para EmulationStation',
        'Conversor de arquivos DAT para gamelist.xml',
        'Suporte a múltiplos idiomas (PT-BR, EN)',
    ],
    author: {
        '@type': 'Person',
        name: 'Douglas Teles',
        url: 'https://github.com/dgateles',
    },
};

export default function RetroToolPage() {
    return (
        <main className="flex-1 bg-background">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-10 left-10 w-64 h-64 bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-20 right-20 w-80 h-80 dark:bg-(--fd-primary)/10 bg-(--fd-primary)/20 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative max-w-6xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-(--fd-primary)/10 mb-6 text-(--fd-primary)">
                        <Wrench className="w-8 h-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6">
                        <span className="rw-gradient-text">RETRO</span>
                        <span className="text-foreground"> TOOL</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
                        Ferramenta completa para gerenciar sua biblioteca de jogos no EmulationStation.
                        Gere arquivos <code className="px-1.5 py-0.5 bg-muted rounded text-sm">gamelist.xml</code>,
                        baixe capas e metadados automaticamente, renomeie imagens e converta arquivos.
                    </p>

                    <a
                        href="https://github.com/dgateles/retrotool/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-(--fd-primary) dark:text-zinc-900 text-white font-semibold rounded-md hover:bg-(--fd-primary)/90 transition-colors"
                    >
                        <Download className="w-5 h-5" />
                        Baixar Retro Tool
                    </a>
                </div>
            </section>

            {/* Features Overview */}
            <section className="py-12 bg-card/50 border-y">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex items-start gap-3 p-4">
                            <div className="p-2 rounded-lg bg-(--fd-primary)/10 text-(--fd-primary) shrink-0">
                                <FolderSearch className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Coletor de Jogos</h3>
                                <p className="text-sm text-muted-foreground">
                                    Gera gamelist.xml com metadados via ScreenScraper API
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 shrink-0">
                                <ImageIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Renomeador</h3>
                                <p className="text-sm text-muted-foreground">
                                    Renomeia imagens para o formato do EmulationStation
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                                <RefreshCw className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Conversor XML</h3>
                                <p className="text-sm text-muted-foreground">
                                    Converte arquivos DAT do Skraper para gamelist.xml
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-4">
                            <div className="p-2 rounded-lg bg-zinc-500/10 text-zinc-500 shrink-0">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Configurações</h3>
                                <p className="text-sm text-muted-foreground">
                                    Configure idioma e credenciais ScreenScraper
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-16">
                <div className="max-w-4xl mx-auto px-6 space-y-16">

                    {/* Intro */}
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="flex items-center gap-3 text-2xl font-bold">
                            <Info className="w-6 h-6 text-(--fd-primary)" />
                            O que é o Retro Tool?
                        </h2>
                        <p>
                            O <strong>Retro Tool</strong> é uma ferramenta gratuita desenvolvida para
                            facilitar o gerenciamento de bibliotecas de jogos em consoles portáteis que utilizam
                            o <strong>EmulationStation</strong> como frontend (ArkOS, KNULLI, muOS, etc).
                        </p>
                        <p>
                            Com ele você pode gerar automaticamente o arquivo <code>gamelist.xml</code> — que é
                            responsável por exibir informações como nome, descrição, data de lançamento, capas
                            e thumbnails dos jogos no menu do EmulationStation.
                        </p>
                    </div>

                    {/* Coletor de Jogos */}
                    <div id="coletor" className="scroll-mt-20">
                        <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                            <FolderSearch className="w-6 h-6 text-(--fd-primary)" />
                            Coletor de Jogos
                        </h2>

                        <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-emerald-600 dark:text-emerald-400">Função principal:</strong>{' '}
                                Escaneia uma pasta de ROMs e gera o arquivo <code>gamelist.xml</code> com
                                metadados obtidos via API do ScreenScraper.fr. Também pode baixar capas e thumbnails
                                automaticamente.
                            </p>
                        </div>

                        <div className="space-y-8">
                            {/* Step 1 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">1</span>
                                    Tela Inicial do Coletor
                                </h3>
                                <p className="text-muted-foreground">
                                    Ao abrir o Retro Tool, você verá a tela principal do <strong>Coletor de Jogos</strong>.
                                    No menu lateral esquerdo estão as 4 seções: Coletor, Renomeador, Conversor e Configurações.
                                </p>
                                <ClickableImage
                                    src="/retrotool-images/tela-inicial.png"
                                    alt="Tela inicial do Retro Tool - Coletor de Jogos"
                                    caption="Tela inicial do Coletor de Jogos"
                                />
                            </div>

                            {/* Step 2 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">2</span>
                                    Selecione a Pasta de ROMs
                                </h3>
                                <p className="text-muted-foreground">
                                    Clique em <strong>NAVEGAR</strong> para selecionar a pasta do sistema que deseja processar.
                                    Por exemplo, se você quer gerar o gamelist para Game Boy, selecione a pasta <code>gb</code>
                                    do seu cartão SD.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ClickableImage
                                        src="/retrotool-images/tela-inicial-uso01.png"
                                        alt="Selecionando pasta de ROMs"
                                        caption="Navegando até a pasta de ROMs no cartão SD"
                                    />
                                    <ClickableImage
                                        src="/retrotool-images/tela-inicial-uso02.png"
                                        alt="Selecionando a pasta gb"
                                        caption="Selecionando a pasta do sistema (ex: gb)"
                                    />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">3</span>
                                    Sistema Detectado
                                </h3>
                                <p className="text-muted-foreground">
                                    Após selecionar a pasta, o Retro Tool detecta automaticamente o sistema com base
                                    no nome da pasta. Você verá no log: <code>Sistema Detectado: GB (ID: 5)</code>.
                                </p>
                                <ClickableImage
                                    src="/retrotool-images/tela-inicial-uso03.png"
                                    alt="Sistema detectado automaticamente"
                                    caption="O sistema é detectado automaticamente pelo nome da pasta"
                                />
                            </div>

                            {/* Step 4 - Options */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">4</span>
                                    Configure as Opções
                                </h3>
                                <p className="text-muted-foreground">
                                    Antes de iniciar, configure as opções de coleta:
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span><strong>Utilizar ScreenScraper API:</strong> Busca metadados online (nome, descrição, data, etc)</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span><strong>Baixar Capas:</strong> Baixa automaticamente as imagens de capa dos jogos</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <span><strong>Baixar Miniaturas:</strong> Baixa thumbnails menores para o menu</span>
                                    </li>
                                </ul>
                                <div className="p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                                    <p className="text-sm text-muted-foreground flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                                        <span>
                                            <strong>Dica:</strong> Se você já possui uma pasta <code>images</code> dentro
                                            da pasta de ROMs com as capas, o Retro Tool as utilizará automaticamente
                                            sem precisar baixar novamente.
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Step 5 - Running */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">5</span>
                                    Inicie a Coleta
                                </h3>
                                <p className="text-muted-foreground">
                                    Clique em <strong>INICIAR COLETA</strong>. O progresso será exibido em tempo real,
                                    mostrando qual jogo está sendo processado, a porcentagem concluída, velocidade
                                    e tempo estimado.
                                </p>
                                <ClickableImage
                                    src="/retrotool-images/tela-inicial-uso05.png"
                                    alt="Coleta em andamento"
                                    caption="Processo de coleta em andamento - 150 ROMs encontradas"
                                />
                            </div>

                            {/* Step 6 - Stop/Resume */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-(--fd-primary) text-white text-sm font-bold">6</span>
                                    Pausar e Retomar
                                </h3>
                                <p className="text-muted-foreground">
                                    Você pode pausar o processo a qualquer momento clicando em <strong>PARAR</strong>.
                                    Se fechar o programa e abrir novamente na mesma pasta, ele perguntará se deseja
                                    retomar de onde parou.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <ClickableImage
                                        src="/retrotool-images/tela-inicial-uso06.png"
                                        alt="Processo pausado"
                                        caption="Processo pausado pelo usuário"
                                    />
                                    <ClickableImage
                                        src="/retrotool-images/tela-inicial-uso07.png"
                                        alt="Retomar coleta"
                                        caption="Opção para retomar de onde parou"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Renomeador */}
                    <div id="renomeador" className="scroll-mt-20">
                        <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                            <ImageIcon className="w-6 h-6 text-purple-500" />
                            Renomeador de Imagens
                        </h2>

                        <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-purple-500">Função:</strong>{' '}
                                Renomeia imagens baixadas do Skraper ou outras fontes para o formato que o
                                EmulationStation reconhece: <code>[nome-da-rom]-image.png</code>
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                Quando você baixa capas usando o <a href="https://www.skraper.net" target="_blank" rel="noopener noreferrer" className="text-(--fd-primary) hover:underline">Skraper</a> ou
                                outras ferramentas, os arquivos podem vir com nomes diferentes do padrão do EmulationStation.
                            </p>
                            <p className="text-muted-foreground">
                                O Renomeador converte automaticamente para o formato correto, associando cada imagem
                                à sua ROM correspondente.
                            </p>

                            <h3 className="text-lg font-semibold mt-6">Como usar:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Acesse a aba <strong>Renomeador</strong> no menu lateral</li>
                                <li>Clique em <strong>NAVEGAR</strong> e selecione a pasta de imagens</li>
                                <li>Clique em <strong>INICIAR RENOMEAÇÃO</strong></li>
                                <li>As imagens serão renomeadas para o formato correto</li>
                            </ol>

                            <ClickableImage
                                src="/retrotool-images/tela-renomeador.png"
                                alt="Tela do Renomeador de Imagens"
                                caption="Interface do Renomeador de Imagens"
                            />
                        </div>
                    </div>

                    {/* Conversor */}
                    <div id="conversor" className="scroll-mt-20">
                        <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                            <RefreshCw className="w-6 h-6 text-blue-500" />
                            Conversor XML/DAT
                        </h2>

                        <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-blue-500">Função:</strong>{' '}
                                Converte arquivos <code>.dat</code> ou XML gerados pelo Skraper (opção "Genérico")
                                para o formato <code>gamelist.xml</code> que o EmulationStation reconhece.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                O Skraper é uma ferramenta popular para scraping, mas não possui opção nativa
                                para EmulationStation. Quando você usa a opção "Genérico", ele gera um arquivo
                                <code>.dat</code> que não é reconhecido pelo EmulationStation.
                            </p>
                            <p className="text-muted-foreground">
                                O Conversor resolve isso transformando o arquivo para o formato correto.
                            </p>

                            <h3 className="text-lg font-semibold mt-6">Como usar:</h3>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Acesse a aba <strong>Conversor</strong> no menu lateral</li>
                                <li>Clique em <strong>NAVEGAR</strong> e selecione o arquivo <code>.dat</code> ou XML</li>
                                <li>Clique em <strong>CONVERTER PARA ES</strong></li>
                                <li>O arquivo <code>gamelist.xml</code> será gerado na mesma pasta</li>
                            </ol>

                            <ClickableImage
                                src="/retrotool-images/tela-conversor.png"
                                alt="Tela do Conversor XML"
                                caption="Interface do Conversor XML/DAT"
                            />
                        </div>
                    </div>

                    {/* Configurações */}
                    <div id="configuracoes" className="scroll-mt-20">
                        <h2 className="flex items-center gap-3 text-2xl font-bold mb-6">
                            <Settings className="w-6 h-6 text-zinc-500" />
                            Configurações
                        </h2>

                        <div className="p-4 rounded-lg border border-zinc-500/30 bg-zinc-500/5 mb-6">
                            <p className="text-sm text-muted-foreground">
                                <strong className="text-zinc-400">Função:</strong>{' '}
                                Configure o idioma da interface e suas credenciais do ScreenScraper.fr
                                para aumentar a velocidade de coleta.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Idioma</h3>
                            <p className="text-muted-foreground">
                                Escolha entre <strong>Português (BR)</strong> ou <strong>English (US)</strong>.
                            </p>

                            <h3 className="text-lg font-semibold mt-6">Credenciais ScreenScraper</h3>
                            <p className="text-muted-foreground">
                                O ScreenScraper.fr limita requisições para usuários sem conta. Se você possui
                                uma conta (especialmente se fez alguma doação), insira seu usuário e senha
                                para aumentar o limite de requisições e a velocidade da coleta.
                            </p>

                            <div className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5">
                                <p className="text-sm text-muted-foreground flex items-start gap-2">
                                    <Globe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                    <span>
                                        <strong>Nota:</strong> Se deixar em branco, será usada a cota pública
                                        compartilhada, que é mais lenta mas funciona normalmente.
                                    </span>
                                </p>
                            </div>

                            <ClickableImage
                                src="/retrotool-images/tela-config.png"
                                alt="Tela de Configurações"
                                caption="Configurações de idioma e credenciais ScreenScraper"
                            />
                        </div>
                    </div>

                    {/* Download Section */}
                    <div className="p-8 rounded-2xl border border-border bg-card">
                        <h2 className="text-2xl font-bold mb-4 text-center">Pronto para começar?</h2>
                        <p className="text-muted-foreground mb-6 max-w-xl mx-auto text-center">
                            Baixe o Retro Tool gratuitamente e organize sua biblioteca
                            de jogos com facilidade.
                        </p>
                        <FirmwareList
                            items={[
                                {
                                    name: 'Retro Tool',
                                    owner: 'dgateles',
                                    repo: 'retrotool',
                                    description: 'Ferramenta para gerenciar bibliotecas do EmulationStation',
                                },
                            ]}
                        />
                    </div>

                </div>
            </section>
        </main>
    );
}
