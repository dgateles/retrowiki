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
    default: 'Retro Wiki',
    template: '%s | Retro Wiki',
  },
  description:
    'Wiki completa para consoles retrô: R36S, Miyoo Mini, RG35XX, TrimUI, PowKiddy e mais. Guias, firmware, compatibilidade e troubleshooting.',
  keywords: [
    'retro gaming',
    'handheld consoles',
    'R36S',
    'Miyoo Mini',
    'RG35XX',
    'TrimUI',
    'PowKiddy',
    'firmware',
    'emuladores',
    'retro wiki',
  ],
  authors: [{ name: 'Retro Wiki Team' }],
  creator: 'Retro Wiki',
  metadataBase: new URL('https://retrowiki.com.br'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    alternateLocale: 'en_US',
    url: 'https://retrowiki.com.br',
    siteName: 'Retro Wiki',
    title: 'Retro Wiki - Guia Completo de Consoles Retrô',
    description:
      'Wiki completa para consoles retrô: R36S, Miyoo Mini, RG35XX, TrimUI, PowKiddy e mais.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Retro Wiki',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Retro Wiki',
    description:
      'Wiki completa para consoles retrô: R36S, Miyoo Mini, RG35XX, TrimUI, PowKiddy e mais.',
    images: ['/og-image.png'],
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
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
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
