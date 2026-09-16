"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Check,
  Highlighter,
  Headphones,
  Menu,
  Shield,
  Sparkles,
  Smartphone,
  HelpCircle,
} from "lucide-react"

import { LandingReveal } from "@/components/landing/landing-reveal"
import { ThemeLogo } from "@/components/brand/theme-logo"
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
    title: "Leitura estruturada e sem distrações",
    description:
      "Artigos, parágrafos, incisos e alíneas organizados com a hierarquia natural do texto normativo para leitura fluida e foco total.",
  },
  {
    icon: Highlighter,
    number: "02",
    title: "Marcações inteligentes e anotações",
    description:
      "Destaque trechos em cores personalizadas e anote entendimentos diretamente em cada dispositivo legal para revisões rápidas.",
  },
  {
    icon: Headphones,
    number: "03",
    title: "Áudios e resumos explicativos",
    description:
      "Ouça a legislação narrada com explicações didáticas para fixar a matéria durante deslocamentos, exercícios e rotinas diárias.",
  },
]

const legalCatalog = [
  { name: "Constituição Federal de 1988", category: "Direito Constitucional", badge: "Atualizada 2026" },
  { name: "Código Penal (CP)", category: "Direito Penal", badge: "Completo" },
  { name: "Código de Processo Penal (CPP)", category: "Processo Penal", badge: "Completo" },
  { name: "Código Civil (CC)", category: "Direito Civil", badge: "Completo" },
  { name: "Código de Processo Civil (CPC)", category: "Processo Civil", badge: "Completo" },
  { name: "CLT — Consolidação das Leis do Trabalho", category: "Direito do Trabalho", badge: "Atualizada" },
  { name: "Lei 8.112/1990 (Regime Jurídico dos Servidores)", category: "Direito Administrativo", badge: "Concursos" },
  { name: "Lei 14.133/2021 (Nova Lei de Licitações)", category: "Direito Administrativo", badge: "Em Destaque" },
  { name: "Lei 13.709/2018 (LGPD)", category: "Legislação Especial", badge: "Completo" },
]

const faqs = [
  {
    question: "O que é o Papirar e como ele ajuda no estudo de leis?",
    answer:
      "O Papirar é uma plataforma especializada no estudo da legislação brasileira (lei seca) para concursos públicos, Exame de Ordem (OAB) e faculdades de Direito. Ele oferece leitura hierárquica, marcações coloridas sincronizadas, anotações por artigo e resumos explicativos em áudio.",
  },
  {
    question: "As leis disponíveis no Papirar estão sempre atualizadas?",
    answer:
      "Sim. O catálogo de leis do Papirar é mantido e revisado de acordo com as publicações oficiais no Diário Oficial da União e legislação vigente do Planalto, garantindo que você nunca estude por artigos revogados ou desatualizados.",
  },
  {
    question: "Como funciona a leitura offline de leis no Papirar?",
    answer:
      "Os assinantes do plano Papirar Premium podem salvar as leis para leitura offline diretamente no dispositivo, com armazenamento criptografado seguro (AES-256), permitindo estudar em viagens ou locais sem sinal de internet.",
  },
  {
    question: "Posso cancelar minha assinatura quando quiser?",
    answer:
      "Sim. A assinatura do Papirar Premium é mensal no valor de R$ 24,99, sem fidelidade, taxa de cancelamento ou período de carência. O cancelamento pode ser feito a qualquer momento com apenas um clique pelo painel de controle.",
  },
  {
    question: "Como os áudios explicativos ajudam na memorização da lei seca?",
    answer:
      "A combinação de estímulo visual e auditivo potencializa a retenção na memória de longo prazo. Nossos áudios trazem a dicção clara do texto da lei e notas práticas para descomplicar conceitos complexos.",
  },
]

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-neutral-950">
      {/* Header / Navegação */}
      <nav aria-label="Navegação do cabeçalho" className="relative mx-auto flex h-20 max-w-7xl items-center justify-between border-b border-neutral-200 px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <ThemeLogo size={28} className="size-8" />
          <span>papirar</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 text-sm text-neutral-500 md:flex">
          <a href="#recursos" className="transition-colors hover:text-neutral-950">Recursos</a>
          <a href="#catalogo" className="transition-colors hover:text-neutral-950">Leis e Códigos</a>
          <a href="#como-funciona" className="transition-colors hover:text-neutral-950">Como funciona</a>
          <a href="#premium" className="transition-colors hover:text-neutral-950">Premium</a>
          <a href="#faq" className="transition-colors hover:text-neutral-950">Dúvidas</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden px-3 py-2 text-sm font-medium md:block">Entrar</Link>
          <Link href="/login" className="rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.03]">
            Começar agora <ArrowRight className="ml-1 inline size-3.5" />
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button aria-label="Abrir menu de navegação" className="rounded-full border border-neutral-200 p-2.5 md:hidden">
                <Menu className="size-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(320px,calc(100vw-2rem))] gap-0 p-4">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <ThemeLogo size={22} className="size-[22px]" />
                  papirar
                </SheetTitle>
                <SheetDescription className="text-xs">Navegue pela plataforma de estudo de leis.</SheetDescription>
              </SheetHeader>
              <nav className="mt-5 flex flex-col gap-0.5" aria-label="Menu principal móvel">
                <SheetClose asChild>
                  <a href="#recursos" className="rounded-lg px-2.5 py-2.5 text-xs font-medium hover:bg-muted">Recursos</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#catalogo" className="rounded-lg px-2.5 py-2.5 text-xs font-medium hover:bg-muted">Leis e Códigos</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#como-funciona" className="rounded-lg px-2.5 py-2.5 text-xs font-medium hover:bg-muted">Como funciona</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#premium" className="rounded-lg px-2.5 py-2.5 text-xs font-medium hover:bg-muted">Premium</a>
                </SheetClose>
                <SheetClose asChild>
                  <a href="#faq" className="rounded-lg px-2.5 py-2.5 text-xs font-medium hover:bg-muted">Perguntas Frequentes</a>
                </SheetClose>
              </nav>
              <div className="mt-5 grid gap-2">
                <Button asChild variant="outline" size="sm" className="h-10 w-full rounded-xl text-xs">
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild size="sm" className="h-10 w-full rounded-xl text-xs">
                  <Link href="/login">Começar agora <ArrowRight className="size-3.5" /></Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 text-center lg:px-10 lg:pb-32 lg:pt-24">
        <div className="papirar-orb pointer-events-none absolute left-1/2 top-24 -z-0 size-[32rem] -translate-x-1/2 rounded-full bg-neutral-100 blur-3xl" />
        <LandingReveal className="relative z-10">
          <span className="inline-flex rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-600 shadow-sm">
            Legislação e Lei Seca para Concursos e OAB
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-4xl leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Estude leis brasileiras com <span className="italic text-neutral-500">mais clareza e constância.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
            A biblioteca jurídica digital desenvolvida para transformar a leitura de leis e códigos em um processo intuitivo, produtivo e focado na sua aprovação.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-neutral-800 hover:scale-[1.02]"
            >
              Começar a Estudar Grátis <ArrowRight className="ml-2 size-4" />
            </Link>
            <a
              href="#catalogo"
              className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-5 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Explorar Leis e Códigos
            </a>
          </div>
        </LandingReveal>

        <LandingReveal delay={150} className="relative z-10 mx-auto mt-14 max-w-3xl lg:mt-18">
          <div className="papirar-float relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-neutral-100 p-2 shadow-[0_30px_90px_-35px_rgba(0,0,0,0.35)] sm:p-3">
            <Image
              src="/mock/mao_segurando-tela_inicio.png"
              alt="Interface do aplicativo Papirar exibindo a biblioteca de leis e códigos"
              width={1200}
              height={780}
              priority
              className="mx-auto h-auto max-h-[24rem] w-auto max-w-full rounded-[1.5rem] object-contain object-top"
            />
            <div className="absolute bottom-6 left-6 hidden rounded-2xl border border-white/80 bg-white/95 px-4 py-3 text-left shadow-lg backdrop-blur sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Progresso Sincronizado</p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-900">Suas marcações salvas em qualquer dispositivo</p>
            </div>
          </div>
        </LandingReveal>
      </section>

      {/* Seção de Recursos Principais */}
      <section id="recursos" className="bg-neutral-50 px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <LandingReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Recursos de Estudo</p>
            <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="max-w-2xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
                Tudo o que você precisa para dominar a legislação com facilidade.
              </h2>
              <p className="max-w-sm text-sm leading-6 text-neutral-500">
                Do primeiro artigo à revisão de véspera da prova, o Papirar acompanha sua rotina sem ruídos e com máxima eficiência.
              </p>
            </div>
          </LandingReveal>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <LandingReveal key={feature.number} delay={index * 100} className="flex flex-col justify-between rounded-3xl border border-neutral-200 bg-white p-7 lg:p-8 shadow-sm">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-neutral-950 text-white">
                        <Icon className="size-5" />
                      </span>
                      <span className="text-xs font-mono font-semibold text-neutral-400">{feature.number}</span>
                    </div>
                    <h3 className="mt-8 text-xl font-semibold tracking-tight text-neutral-900">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-neutral-600">{feature.description}</p>
                  </div>
                </LandingReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Seção Catálogo de Leis */}
      <section id="catalogo" className="px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <LandingReveal className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
              <Sparkles className="size-3.5 text-amber-600" /> Catálogo Atualizado
            </span>
            <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Legislação completa para Carreiras Jurídicas e Policiais
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-neutral-500">
              Estude os textos legais mais cobrados em concursos de Tribunais, Polícias, Defensorias, Ministério Público e Magistratura.
            </p>
          </LandingReveal>

          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {legalCatalog.map((law, index) => (
              <LandingReveal key={law.name} delay={index * 50} className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 transition-all hover:bg-neutral-50 hover:border-neutral-300">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">{law.name}</h3>
                  <p className="text-xs text-neutral-500">{law.category}</p>
                </div>
                <span className="rounded-full bg-neutral-200/80 px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
                  {law.badge}
                </span>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section id="como-funciona" className="bg-neutral-50/60 px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:px-6">
          <LandingReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Metodologia Ativa</p>
            <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Leia com clareza. Destaque o essencial. Memorize com áudio.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-neutral-600">
              O estudo da lei seca representa mais de 70% das questões objetivas em concursos públicos. O Papirar une tipografia confortável, hierarquia precisa e explicações didáticas para você não se cansar visualmente e absorver o conteúdo normativo com agilidade.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <Check className="size-4 text-emerald-600 shrink-0" />
                <span>Navegação instantânea por Títulos, Capítulos e Artigos</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <Check className="size-4 text-emerald-600 shrink-0" />
                <span>Destaques com cores personalizadas para prazos e exceções</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-neutral-700">
                <Check className="size-4 text-emerald-600 shrink-0" />
                <span>Explicações em áudio com inteligência artificial para fixação</span>
              </div>
            </div>
          </LandingReveal>
          <LandingReveal delay={120}>
            <div className="rounded-[2rem] bg-neutral-100 p-3 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)]">
              <Image
                src="/mock/mao_segurando-tela_leitura-1.png"
                alt="Tela de leitura de artigos de lei no Papirar"
                width={900}
                height={900}
                className="h-auto w-full rounded-[1.5rem]"
              />
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Seção Premium */}
      <section id="premium" className="px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <LandingReveal>
            <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Plano Papirar Premium
            </span>
            <h2 className="mt-4 max-w-xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Mais profundidade e rendimento para os seus estudos.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600">
              Acelere sua preparação para a aprovação com acesso ilimitado a explicações em áudio, leitura de leis totalmente offline e histórico de alterações normativas.
            </p>
          </LandingReveal>

          <LandingReveal delay={120}>
            <div className="rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.45)] sm:p-9">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Assinatura Premium Mensal</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">Acesso ilimitado a todas as ferramentas</p>
                </div>
                <span className="rounded-full bg-neutral-950 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                  Completo
                </span>
              </div>
              <div className="mt-6 flex items-end gap-2">
                <span className="font-display text-5xl tracking-[-0.04em] text-neutral-950">R$ 24,99</span>
                <span className="pb-1 text-sm text-neutral-500">por mês</span>
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">Renovação mensal automática. Cancele quando quiser.</p>
              <ul className="mt-6 space-y-3 text-sm text-neutral-700">
                {[
                  "Explicações e resumos em áudio com IA",
                  "Download de leis para leitura offline",
                  "Destaques e anotações ilimitadas",
                  "Comparação de alterações e novidades legislativas",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
                      <Check className="size-3.5" />
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 h-12 w-full rounded-full text-sm font-semibold">
                <Link href="/assinar">
                  Assinar Papirar Premium <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <p className="mt-3 text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
                <Shield className="size-3.5 text-emerald-600" /> Pagamento processado com segurança pelo Mercado Pago.
              </p>
            </div>
          </LandingReveal>
        </div>
      </section>

      {/* Seção FAQ (Perguntas Frequentes) */}
      <section id="faq" className="bg-neutral-50 px-6 py-24 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <LandingReveal className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-neutral-200 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <HelpCircle className="size-3.5 text-neutral-500" /> Dúvidas Comuns
            </span>
            <h2 className="mt-4 font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Perguntas frequentes sobre o Papirar
            </h2>
            <p className="mt-3 text-sm text-neutral-500">
              Tudo o que você precisa saber sobre o funcionamento da plataforma e seus recursos.
            </p>
          </LandingReveal>

          <div className="mt-12 space-y-4">
            {faqs.map((faq, index) => (
              <LandingReveal key={faq.question} delay={index * 60} className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold text-neutral-900">{faq.question}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{faq.answer}</p>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Seção CTA Final */}
      <section className="px-6 pb-24 lg:px-10 lg:pb-32">
        <LandingReveal className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-neutral-950 px-7 py-16 text-center text-white sm:px-12 lg:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">Comece a Estudar Hoje</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-3xl leading-tight tracking-[-0.03em] sm:text-5xl">
            Sua preparação jurídica em um novo nível de clareza.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-neutral-400">
            Crie sua conta gratuitamente e leve suas leis, anotações e rotina de estudos com você.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-neutral-950 shadow-lg transition-transform hover:-translate-y-0.5 hover:bg-neutral-100"
          >
            Entrar no Papirar Gratuitamente <ArrowRight className="ml-2 size-4" />
          </Link>
        </LandingReveal>
      </section>

      {/* Footer com Links Institucionais e Redes Sociais */}
      <footer aria-label="Rodapé do site" className="border-t border-neutral-200 px-6 py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 text-sm text-neutral-500 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-neutral-950">
              <ThemeLogo size={26} className="size-6.5" />
              <span>papirar</span>
            </div>
            <p className="mt-2 max-w-xs text-xs text-neutral-500">
              Plataforma de leitura, estudo e revisão da legislação brasileira para concursos públicos e OAB.
            </p>
            <div className="mt-4 flex items-center gap-3 text-neutral-600">
              <a
                href="https://www.instagram.com/papirar.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Siga o Papirar no Instagram"
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@papirar.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Canal do Papirar no YouTube"
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <polygon points="10 15 15 12 10 9 10 15" />
                </svg>
              </a>
              <a
                href="https://twitter.com/papirar.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Perfil do Papirar no X (Twitter)"
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/papirar.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Página do Papirar no LinkedIn"
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a
                href="https://www.facebook.com/papirar.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Página do Papirar no Facebook"
                className="flex size-8 items-center justify-center rounded-full border border-neutral-200 bg-white transition-colors hover:bg-neutral-100 hover:text-neutral-950"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
            </div>
          </div>

          <nav aria-label="Links institucionais e jurídicos" className="flex flex-wrap gap-x-6 gap-y-3 text-xs sm:justify-end">
            <Link href="/privacidade" className="transition-colors hover:text-neutral-950">Política de Privacidade</Link>
            <Link href="/termos" className="transition-colors hover:text-neutral-950">Termos de Uso</Link>
            <Link href="/excluir-conta" className="transition-colors hover:text-neutral-950">Excluir Conta</Link>
            <a href="mailto:suporte@papirar.com" className="transition-colors hover:text-neutral-950">suporte@papirar.com</a>
          </nav>
        </div>
        <div className="mx-auto mt-8 max-w-7xl border-t border-neutral-100 pt-6 text-center text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Papirar. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
