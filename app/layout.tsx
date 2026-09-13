import type { Metadata } from "next"
import { Geist_Mono, Inter, Lora, Playfair_Display, Quicksand } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { cn } from "@/lib/utils"

const siteUrl = new URL("https://papirar.com")

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Papirar | Estude leis com clareza",
    template: "%s | Papirar",
  },
  description:
    "Papirar: estude leis brasileiras, Constituição Federal e legislação para concursos com leitura organizada, explicações em áudio, marcações e anotações.",
  applicationName: "Papirar",
  keywords: [
    "legislação brasileira",
    "estudo de leis",
    "direito",
    "constituição federal",
    "concursos públicos",
    "lei seca",
    "estudo para concursos",
    "áudio de leis",
  ],
  authors: [{ name: "Papirar" }],
  creator: "Papirar",
  publisher: "Papirar",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "Papirar",
    title: "Papirar | Estude leis com clareza",
    description:
      "Leis brasileiras organizadas para estudar: leitura, explicações em áudio, marcações e revisão.",
    images: [{ url: "/og-papirar.svg", width: 1200, height: 630, alt: "Papirar — Estude leis com clareza" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Papirar | Estude leis com clareza",
    description:
      "Leis brasileiras organizadas para estudar: leitura, explicações em áudio, marcações e revisão.",
    images: ["/og-papirar.svg"],
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
      </body>
    </html>
  )
}
