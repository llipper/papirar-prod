"use client"

import {
  ArrowLeft,
  BarChart3,
  Bookmark,
  Headphones,
  Quote,
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  bibliotecaBooks,
  bibliotecaCategories,
} from "@/lib/biblioteca/catalog-data"

import { BibliotecaCategorySection } from "./biblioteca-category-section"

export function BibliotecaContent() {
  const [query] = useState("")

  const categories = useMemo(() => {
    const words = query
      .trim()
      .toLocaleLowerCase()
      .split(/\s+/)
      .filter(Boolean)

    return bibliotecaCategories
      .map((category) => ({
        category,
        books: bibliotecaBooks.filter((book) => {
          const text =
            `${book.title} ${book.acronym} ${book.category}`.toLocaleLowerCase()

          return (
            book.category === category &&
            words.every((word) => text.includes(word))
          )
        }),
      }))
      .filter(({ books }) => books.length > 0)
  }, [query])

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="min-w-0 overflow-hidden">
        {/* =====================================================
            HEADER GLOBAL
        ===================================================== */}

        <header className="flex h-16 shrink-0 items-center border-b">
  {/* MOBILE */}
  <div className="flex w-full items-center xl:hidden">
    <DashboardHeader />
  </div>

  {/* DESKTOP */}
  <div className="hidden w-full items-center justify-between gap-4 px-6 xl:flex">
    <div className="flex items-center gap-3">
      <SidebarTrigger className="-ml-1" />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          Biblioteca
        </p>

        <p className="truncate text-xs text-muted-foreground">
          Catálogo de legislação
        </p>
      </div>
    </div>

    <DashboardHeader />
  </div>
</header>

        {/* =====================================================
            CONTENT
        ===================================================== */}

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-[1500px] px-5 py-6 lg:px-8">
            {/* =================================================
                VOLTAR
            ================================================= */}

            <Link
              href="/dashboard"
              className="
                inline-flex
                items-center
                gap-1
                text-[10px]
                font-semibold
                uppercase
                tracking-wide
                text-muted-foreground
                transition-colors
                hover:text-foreground
              "
            >
              <ArrowLeft className="size-3" />
              Biblioteca
            </Link>

            {/* =================================================
                HERO
            ================================================= */}

            <section className="mt-4 grid gap-4 lg:grid-cols-[1.7fr_.85fr]">
              {/* LEFT */}

              <div>
                <h1
                  className="
                    max-w-[700px]
                    font-serif
                    text-[34px]
                    font-semibold
                    leading-[1.05]
                    tracking-[-0.035em]
                    text-foreground
                    sm:text-[40px]
                  "
                >
                  Biblioteca Jurídica em Áudio
                </h1>

                <p className="mt-2 text-sm text-muted-foreground">
                  Explore leis organizadas, atualizadas e com áudio
                  explicativo integrado.
                </p>

                {/* BENEFÍCIOS */}

                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  <FeatureCard
                    icon={Headphones}
                    title="Ouça em qualquer lugar"
                    description="Web, mobile ou offline"
                  />

                  <FeatureCard
                    icon={BarChart3}
                    title="Conteúdo atualizado"
                    description="Sempre conforme a legislação"
                  />

                  <FeatureCard
                    icon={Bookmark}
                    title="Organizado por temas"
                    description="Encontre o que precisa mais rápido"
                  />
                </div>
              </div>

              {/* QUOTE */}

              <div
                className="
                  relative
                  hidden
                  min-h-[150px]
                  overflow-hidden
                  rounded-[20px]
                  border
                  border-amber-900/[0.05]
                  bg-gradient-to-br
                  from-[#fff9ef]
                  via-[#fbf6ed]
                  to-[#f4eee5]
                  dark:border-white/[0.06]
                  dark:from-neutral-950
                  dark:via-neutral-950
                  dark:to-neutral-900
                  lg:block
                "
              >
                {/* decoração */}

                <div
                  className="
                    absolute
                    -right-20
                    -top-24
                    size-[280px]
                    rounded-full
                    border
                    border-amber-900/[0.05]
                    dark:border-white/[0.04]
                  "
                />

                <div
                  className="
                    absolute
                    -bottom-28
                    -left-20
                    size-[240px]
                    rounded-full
                    border
                    border-amber-900/[0.05]
                    dark:border-white/[0.04]
                  "
                />

                <div className="relative flex h-full min-h-[150px] items-center px-7">
                  <div
                    className="
                      mr-7
                      flex
                      h-16
                      items-center
                      gap-[3px]
                      text-amber-600/30
                    "
                  >
                    {[14, 25, 38, 48, 30, 54, 40, 27, 18].map(
                      (height, index) => (
                        <span
                          key={index}
                          className="w-[2px] rounded-full bg-current"
                          style={{ height }}
                        />
                      )
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex gap-2">
                      <Quote className="mt-1 size-4 shrink-0 text-amber-600/30" />

                      <p
                        className="
                          font-serif
                          text-[18px]
                          italic
                          leading-6
                          text-muted-foreground
                        "
                      >
                        “Estudar a lei
                        <br />
                        nunca foi tão acessível.”
                      </p>
                    </div>

                    <p className="mt-4 text-right text-xs font-medium text-muted-foreground/70">
                      papirar
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                CATEGORIAS
            ================================================= */}

            <div className="mt-8 space-y-7 pb-10">
              {categories.length > 0 ? (
                categories.map(({ category, books }) => (
                  <BibliotecaCategorySection
                    key={category}
                    category={category}
                    books={books}
                  />
                ))
              ) : (
                <p className="py-12 text-center text-sm font-semibold text-muted-foreground">
                  Nenhum livro encontrado.
                </p>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Headphones
  title: string
  description: string
}) {
  return (
    <div
      className="
        flex
        min-h-[62px]
        items-center
        rounded-[15px]
        border
        border-border/60
        bg-card
        px-3
      "
    >
      <div
        className="
          flex
          size-8
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-muted
        "
      >
        <Icon className="size-3.5" />
      </div>

      <div className="ml-3 min-w-0">
        <p className="truncate text-[11px] font-bold text-foreground">
          {title}
        </p>

        <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}