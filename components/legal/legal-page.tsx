import Link from "next/link"

import { ThemeLogo } from "@/components/brand/theme-logo"

type LegalSection = {
  title: string
  paragraphs: string[]
}

type LegalPageProps = {
  eyebrow: string
  title: string
  description: string
  sections: LegalSection[]
}

export function LegalPage({ eyebrow, title, description, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
            <ThemeLogo size={24} className="size-6" />
            papirar
          </Link>
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Entrar
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>
        <p className="mt-4 text-xs text-muted-foreground">Última atualização: 25 de agosto de 2026</p>

        <div className="mt-12 space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="font-heading text-xl font-semibold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-sm leading-7 text-muted-foreground">{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Papirar</span>
          <nav className="flex gap-4">
            <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
            <Link href="/termos" className="hover:text-foreground">Termos</Link>
            <Link href="/excluir-conta" className="hover:text-foreground">Excluir conta</Link>
            <Link href="/" className="hover:text-foreground">Início</Link>
          </nav>
        </div>
      </footer>
    </main>
  )
}
