import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Script from 'next/script';

const GA_TRACKING_ID = 'G-B4N5294ZMR';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'Retro Wiki - Guia Completo de Consoles Portáteis Retrô',
    template: '%s | Retro Wiki',
  },
  description:
    'Guia completo em português para consoles portáteis retrô: R36S, Miyoo Mini Plus, RG35XX, RG40XX H, TrimUI Smart Brick e PowKiddy RGB30. Firmware custom, ROMs, configuração, emuladores e troubleshooting.',
  keywords: [
    'retro wiki',
    'console retrô portátil',
    'handheld retro gaming',
    'R36S',
    'R36S guia',
    'R36S firmware',
    'R36S ArkOS',
    'Miyoo Mini Plus',
    'Miyoo Mini Plus OnionOS',
    'RG35XX',
    'RG35XX firmware',
    'RG40XX H',
    'RG40XX H guia',
    'TrimUI Smart Brick',
    'PowKiddy RGB30',
    'Anbernic',
    'firmware custom',
    'custom firmware retro',
    'ArkOS',
    'KNULLI',
    'muOS',
    'GarlicOS',
    'OnionOS',
    'MinUI',
    'NextUI',
    'emulador portátil',
    'emuladores retro',
    'ROMs retro',
    'RetroArch',
    'retro gaming Brasil',
    'console chinês',
    'videogame portátil retro',
    'guia emulação',
  ],
  authors: [{ name: 'Retro Wiki Team' }],
  creator: 'Retro Wiki',
  publisher: 'Retro Wiki',
  metadataBase: new URL('https://retro.wiki.br'),
  alternates: {
    canonical: 'https://retro.wiki.br',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://retro.wiki.br',
    siteName: 'Retro Wiki',
    title: 'Retro Wiki - Guia Completo de Consoles Portáteis Retrô',
    description:
      'Guia completo em português para consoles portáteis retrô: R36S, Miyoo Mini Plus, RG35XX, RG40XX H, TrimUI Smart Brick e PowKiddy RGB30. Firmware, configuração e troubleshooting.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'Retro Wiki - Guia de Consoles Retrô Portáteis',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Retro Wiki - Guia Completo de Consoles Portáteis Retrô',
    description:
      'Guia completo em português para consoles portáteis retrô: R36S, Miyoo Mini Plus, RG35XX, RG40XX H, TrimUI Smart Brick e PowKiddy RGB30.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Retro Wiki" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Retro Wiki',
              url: 'https://retro.wiki.br',
              description:
                'Guia completo em português para consoles portáteis retrô: R36S, Miyoo Mini Plus, RG35XX, RG40XX H, TrimUI Smart Brick e PowKiddy RGB30.',
              inLanguage: 'pt-BR',
              publisher: {
                '@type': 'Organization',
                name: 'Retro Wiki',
                url: 'https://retro.wiki.br',
              },
            }),
          }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </head>
      <body className="flex flex-col min-h-screen antialiased">
        <RootProvider
          search={{
            options: {
              api: '/api/search',
              type: 'static',
            },
          }}
          theme={{
            defaultTheme: 'dark',
            enabled: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
