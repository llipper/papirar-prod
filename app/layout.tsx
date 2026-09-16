import type { Metadata, Viewport } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist_Mono, Inter, Lora, Playfair_Display, Quicksand } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { cn } from "@/lib/utils"

const siteUrl = new URL("https://www.papirar.com")

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Papirar | Estude Leis e Legislação para Concursos e OAB",
    template: "%s | Papirar",
  },
  description:
    "Estude leis brasileiras, códigos e a Constituição com leitura organizada, áudio explicativo e marcações para concursos públicos e OAB.",
  applicationName: "Papirar",
  keywords: [
    "legislação brasileira",
    "estudo de leis",
    "direito",
    "constituição federal",
    "concursos públicos",
    "lei seca",
    "oab",
    "exame de ordem",
    "estudo para concursos",
    "áudio de leis",
    "código penal",
    "código civil",
  ],
  authors: [{ name: "Papirar", url: "https://www.papirar.com" }],
  creator: "Papirar",
  publisher: "Papirar",
  alternates: {
    canonical: "/",
    languages: {
      "pt-BR": "/",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Papirar",
    title: "Papirar | Estude Leis e Legislação para Concursos e OAB",
    description:
      "Estude leis brasileiras, códigos e a Constituição com leitura organizada, áudio explicativo e marcações para concursos públicos e OAB.",
    images: [{ url: "/og-papirar.png", width: 1200, height: 630, alt: "Papirar — Estude leis com clareza" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Papirar | Estude Leis e Legislação para Concursos e OAB",
    description:
      "Estude leis brasileiras, códigos e a Constituição com leitura organizada, áudio explicativo e marcações para concursos públicos e OAB.",
    images: ["/og-papirar.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  category: "education",
  formatDetection: { telephone: false },
}

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-heading",
})

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-reading-family",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display-family",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        quicksand.variable,
        lora.variable,
        playfair.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <CookieConsent />
          </TooltipProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
