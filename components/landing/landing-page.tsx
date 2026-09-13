"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Check, Highlighter, Headphones, Menu } from "lucide-react"

import { LandingReveal } from "@/components/landing/landing-reveal"
import { ThemeLogo } from "@/components/brand/theme-logo"
import { PublicRouteGuard } from "@/components/auth/public-route-guard"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const features = [
  {
    icon: BookOpen,
    number: "01",
    title: "Leitura sem distrações",
    description: "Leis organizadas por hierarquia para você encontrar o que importa com clareza.",
  },
  {
    icon: Highlighter,
    number: "02",
    title: "Marque para lembrar",
    description: "Destaques e anotações ficam vinculados ao conteúdo e acompanham suas revisões.",
  },
  {
    icon: Headphones,
    number: "03",
    title: "Ouça onde estiver",
    description: "Transforme artigos em revisão por áudio e mantenha seu ritmo de estudo.",
  },
]

export function LandingPage() {
  return (
    <PublicRouteGuard>
      <main className="min-h-screen overflow-hidden bg-white text-neutral-950">
      <nav className="relative mx-auto flex h-20 max-w-7xl items-center justify-between border-b border-neutral-200 px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <ThemeLogo size={24} className="size-6" />
          <span>papirar</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-neutral-500 md:flex">
          <a href="#recursos" className="transition-colors hover:text-neutral-950">Recursos</a>
          <a href="#como-funciona" className="transition-colors hover:text-neutral-950">Como funciona</a>
          <a href="#premium" className="transition-colors hover:text-neutral-950">Premium</a>
          <a href="#para-voce" className="transition-colors hover:text-neutral-950">Para estudantes</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-sm font-medium md:block">Entrar</Link>
          <Link href="/login" className="rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]">
            Começar agora <ArrowRight className="ml-1 inline size-3.5" />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Abrir menu" className="rounded-full border border-neutral-200 p-2 md:hidden">
                <Menu className="size-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(320px,calc(100vw-2rem))] gap-0 p-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <ThemeLogo size={22} className="size-[22px]" />
                  papirar
                </SheetTitle>
                <SheetDescription className="text-xs">Navegue pelo Papirar.</SheetDescription>
              </SheetHeader>
              <nav className="mt-5 flex flex-col gap-0.5" aria-label="Menu principal">
                <SheetClose asChild>
                  <a href="#recursos" className="rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-muted">Recursos</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#como-funciona" className="rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-muted">Como funciona</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#premium" className="rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-muted">Premium</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#para-voce" className="rounded-lg px-2.5 py-2 text-xs font-medium hover:bg-muted">Para estudantes</a>
                </SheetClose>
              </nav>
              <div className="mt-5 grid gap-1.5">
                <Button asChild variant="outline" size="sm" className="h-8 w-full rounded-xl text-xs">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="h-8 w-full rounded-xl text-xs">
                  <Link href="/login">Começar agora <ArrowRight className="size-3.5" /></Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center lg:px-10 lg:pb-32 lg:pt-28">
        <div className="papirar-orb pointer-events-none absolute left-1/2 top-24 -z-0 size-[32rem] -translate-x-1/2 rounded-full bg-neutral-100 blur-3xl" />
        <LandingReveal className="relative z-10">
          <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Sua leitura jurídica, no seu ritmo
          </span>
          <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            Estude leis com <span className="italic text-neutral-500">mais clareza.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-7 text-neutral-500 sm:text-lg">
            Uma biblioteca jurídica simples, organizada e feita para transformar leitura em constância.
          </p>
        </LandingReveal>

        <LandingReveal delay={150} className="relative z-10 mx-auto mt-16 max-w-3xl lg:mt-20">
          <div className="papirar-float relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-100 p-2 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.35)] sm:p-3">
            <Image
              src="/mock/mao_segurando-tela_inicio.png"
              alt="Tela inicial do aplicativo Papirar"
              width={1200}
              height={780}
              priority
              className="mx-auto h-auto max-h-[24rem] w-auto max-w-full rounded-[1.5rem] object-contain object-top"
            />
            <div className="absolute bottom-7 left-7 hidden rounded-2xl border border-white/70 bg-white/90 px-4 py-3 text-left shadow-lg backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Seu progresso</p>
              <p className="mt-1 text-sm font-semibold">Leitura que continua com você</p>
            </div>
          </div>
        </LandingReveal>
      </section>

      <section id="recursos" className="bg-neutral-50 px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <LandingReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Tudo no seu lugar</p>
            <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-2xl font-display text-4xl leading-tight tracking-[-0.03em] sm:text-6xl">
                Uma forma mais leve de estudar o que é importante.
              </h2>
              <p className="max-w-sm text-sm leading-6 text-neutral-500">Do primeiro artigo à revisão final, o Papirar acompanha a sua rotina sem complicar.</p>
            </div>
          </LandingReveal>

          <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-200 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <LandingReveal key={feature.number} delay={index * 100} className="h-full bg-white p-7 lg:p-9">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-full bg-neutral-950 text-white"><Icon className="size-4" /></span>
                    <span className="text-xs text-neutral-400">{feature.number}</span>
                  </div>
                  <h3 className="mt-20 text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-neutral-500">{feature.description}</p>
                </LandingReveal>
              )
            })}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10 lg:py-32">
        <LandingReveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Feito para o dia a dia</p>
          <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-[-0.03em] sm:text-6xl">Leia. Marque. Revise.</h2>
          <p className="mt-6 max-w-md leading-7 text-neutral-500">Sua preparação não precisa caber em uma tela confusa. Navegue por livros, títulos, capítulos e artigos com a hierarquia que a lei já possui.</p>
        </LandingReveal>
        <LandingReveal delay={120}>
          <div className="rounded-[2rem] bg-neutral-100 p-3 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)]">
            <Image src="/mock/mao_segurando-tela_leitura-1.png" alt="Leitura de uma lei no Papirar" width={900} height={900} className="h-auto w-full rounded-[1.5rem]" />
          </div>
        </LandingReveal>
      </section>

      <section id="premium" className="bg-neutral-50 px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-center">
          <LandingReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Papirar Premium</p>
            <h2 className="mt-5 max-w-xl font-display text-4xl leading-tight tracking-[-0.03em] sm:text-6xl">
              Mais profundidade para a sua preparação.
            </h2>
            <p className="mt-6 max-w-lg leading-7 text-neutral-500">
              Estude no seu ritmo com recursos criados para transformar leitura jurídica em entendimento, revisão e constância.
            </p>
          </LandingReveal>

          <LandingReveal delay={120}>
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)] sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Premium mensal</p>
                  <p className="mt-1 text-sm text-neutral-500">Para estudar com mais recursos.</p>
                </div>
                <span className="rounded-full bg-neutral-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">Premium</span>
              </div>
              <div className="mt-8 flex items-end gap-2">
                <span className="font-display text-5xl tracking-[-0.04em]">R$ 24,99</span>
                <span className="pb-1.5 text-sm text-neutral-500">por mês</span>
              </div>
              <p className="mt-2 text-xs text-neutral-500">Renovação mensal. Cancele quando quiser.</p>
              <ul className="mt-8 space-y-3 text-sm text-neutral-700">
                {[
                  "Explicações em áudio com IA",
                  "Leitura de leis disponível offline",
                  "Comparação de atualizações legais",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100"><Check className="size-3.5" /></span>
                    {benefit}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-9 h-12 w-full rounded-full">
                <Link href="/login">Criar conta e conhecer o Premium <ArrowRight className="size-4" /></Link>
              </Button>
              <p className="mt-3 text-center text-xs text-neutral-500">Assinatura disponível pelo aplicativo Android.</p>
            </div>
          </LandingReveal>
        </div>
      </section>

      <section id="para-voce" className="px-6 pb-24 lg:px-10 lg:pb-32">
        <LandingReveal className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-neutral-950 px-7 py-16 text-center text-white sm:px-12 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Comece de onde estiver</p>
          <h2 className="mx-auto mt-5 max-w-3xl font-display text-4xl leading-tight tracking-[-0.03em] sm:text-6xl">Mais presença nos estudos. Menos ruído.</h2>
          <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-neutral-400">Crie sua conta e leve sua biblioteca, suas marcações e seu ritmo com você.</p>
          <Link href="/login" className="mt-9 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-950 transition-transform hover:-translate-y-0.5">Entrar no Papirar <ArrowRight className="ml-2 size-4" /></Link>
        </LandingReveal>
      </section>

      <footer className="border-t border-neutral-200 px-6 py-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 text-sm text-neutral-500 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Image src="/logo.svg" alt="Logo Papirar" width={28} height={28} className="size-7" />
            <p className="mt-3 max-w-xs">Leitura jurídica feita para avançar.</p>
          </div>
          <nav aria-label="Links institucionais" className="flex flex-wrap gap-x-6 gap-y-3 sm:justify-end">
            <Link href="/privacidade" className="transition-colors hover:text-neutral-950">Política de Privacidade</Link>
            <Link href="/termos" className="transition-colors hover:text-neutral-950">Termos de Uso</Link>
            <a href="mailto:suporte@papirar.com" className="transition-colors hover:text-neutral-950">Contato</a>
          </nav>
        </div>
      </footer>
      </main>
    </PublicRouteGuard>
  )
}
