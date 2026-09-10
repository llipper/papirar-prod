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
    "Estude legislação brasileira com leitura organizada, explicações em áudio e ferramentas para marcações e anotações.",
  applicationName: "Papirar",
  keywords: [
    "legislação brasileira",
    "estudo de leis",
    "direito",
    "constituição federal",
    "concursos públicos",
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
      "Leitura organizada de legislação brasileira, explicações em áudio e ferramentas de estudo.",
  },
  twitter: {
    card: "summary",
    title: "Papirar | Estude leis com clareza",
    description:
      "Leitura organizada de legislação brasileira, explicações em áudio e ferramentas de estudo.",
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
