import { Geist_Mono, Inter, Lora, Playfair_Display, Quicksand } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CookieConsent } from "@/components/legal/cookie-consent"
import { cn } from "@/lib/utils"

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
