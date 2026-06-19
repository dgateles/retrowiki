import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { JsonLd } from "@/components/seo/json-ld";
import { siteGraph } from "@/lib/seo/builders";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const BASE = process.env.APP_URL ?? "http://localhost:3000";
const DESCRIPTION = "Wiki comunitária de handhelds retrô: catálogo de consoles, tutoriais, guias de compra e firmware.";

export const metadata: Metadata = {
  title: { default: "RetroWiki", template: "%s — RetroWiki" },
  description: DESCRIPTION,
  metadataBase: new URL(BASE),
  applicationName: "RetroWiki",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "RetroWiki",
    locale: "pt_BR",
    title: "RetroWiki",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary_large_image", title: "RetroWiki", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: "#0b0f14",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <a
          href="#main"
          className="skip-link"
        >
          Pular para o conteúdo
        </a>
        <Providers>{children}</Providers>
        <JsonLd data={siteGraph(BASE)} />
      </body>
    </html>
  );
}
