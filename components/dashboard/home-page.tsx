"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Bookmark,
  Clock3,
  FolderOpen,
  Headphones,
  Highlighter,
  LibraryBig,
  Play,
  Quote,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  bibliotecaBooks,
  bibliotecaCategories,
} from "@/lib/biblioteca/catalog-data"
import { firebaseAuth } from "@/lib/firebase/client"
import {
  getCurrentProfile,
  type UserProfile,
} from "@/lib/profile/profile-service"

const apiBase = (
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ??
  "https://papirar-api.papirar-api-worker.workers.dev"
).replace(/\/$/, "")

const availableBooks = bibliotecaBooks.filter((book) => book.lawId)

type ReadingProgress = {
  law_id: string
  law_title: string
  law_acronym: string
  total_seconds: number
}

const quickLinks = [
  {
    title: "Continue ouvindo",
    description: "Retome de onde parou",
    href: "/dashboard/biblioteca",
    icon: Headphones,
  },
  {
    title: "Suas marcações",
    description: "Acesse trechos salvos",
    href: "/dashboard/marcacoes",
    icon: Bookmark,
  },
  {
    title: "Suas anotações",
    description: "Revise seus apontamentos",
    href: "/dashboard/anotacoes",
    icon: BookOpen,
  },
  {
    title: "Estatísticas",
    description: "Acompanhe seu progresso",
    href: "/dashboard/estatisticas",
    icon: BarChart3,
  },
] as const

function formatStudyTime(seconds: number) {
  if (!seconds || seconds < 60) return "0min"

  const minutes = Math.floor(seconds / 60)

  if (minutes < 60) {
    return `${minutes}min`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!remainingMinutes) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}min`
}

function calculateProgress(seconds: number) {
  if (!seconds) return 0

  /*
   * Valor visual temporário.
   * Quando você tiver total de duração/artigos da lei,
   * substitua por:
   *
   * (tempoEstudado / tempoTotalDaLei) * 100
   */
  return Math.min(Math.round((seconds / (60 * 60 * 10)) * 100), 100)
}

export function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)

  useEffect(() => {
    void getCurrentProfile()
      .then(setProfile)
      .catch(() => setProfile(null))

    void (async () => {
      try {
        const user = firebaseAuth.currentUser

        if (!user) return

        const token = await user.getIdToken()

        const response = await fetch(`${apiBase}/reading-progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) return

        const rows = (await response.json()) as ReadingProgress[]

        setProgress(rows[0] ?? null)
      } catch {
        setProgress(null)
      }
    })()
  }, [])

  const firstName =
    profile?.displayName?.trim().split(/\s+/)[0] || "estudante"

  const continuedBook = useMemo(() => {
    if (!progress) return null

    return (
      availableBooks.find(
        (book) => book.lawId === progress.law_id
      ) ?? null
    )
  }, [progress])

  const continueHref = continuedBook
    ? `/dashboard/biblioteca/${continuedBook.id}`
    : "/dashboard/biblioteca"

  const progressPercentage = calculateProgress(
    progress?.total_seconds ?? 0
  )

  return (
    <DashboardShell
      title="Home"
      description="Seu espaço de estudo jurídico."
    >
      <div className="space-y-6">

        {/* =====================================================
            HERO + PROGRESSO
        ===================================================== */}

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,.95fr)]">

          {/* HERO */}

          <div
            className="
              relative
              min-h-[300px]
              overflow-hidden
              rounded-[22px]
              border
              border-border/60
              bg-[#f8f5ef]
              dark:bg-neutral-950
            "
          >
            {/* textura/fundo */}

            <div
              className="
                pointer-events-none
                absolute
                inset-0
                bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.9),transparent_35%)]
                dark:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,.04),transparent_35%)]
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -right-20
                -top-32
                size-[420px]
                rounded-full
                border
                border-black/[0.04]
                dark:border-white/[0.04]
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                right-24
                top-28
                size-[300px]
                rounded-full
                border
                border-black/[0.04]
                dark:border-white/[0.04]
              "
            />

            <div
              className="
                relative
                z-10
                flex
                min-h-[300px]
                flex-col
                justify-center
                px-7
                py-8
                sm:px-9
                lg:w-[58%]
              "
            >
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-muted-foreground
                "
              >
                Estude em qualquer lugar
              </p>

              <h1
                className="
                  mt-4
                  max-w-[430px]
                  font-heading
                  text-[30px]
                  font-medium
                  leading-[1.04]
                  tracking-[-0.04em]
                  text-foreground
                  sm:text-[38px]
                "
              >
                Lei em áudio.
                <br />
                Conhecimento no seu ritmo.
              </h1>

              <p
                className="
                  mt-4
                  max-w-[420px]
                  text-sm
                  leading-6
                  text-muted-foreground
                "
              >
                Ouça, memorize e revise as principais legislações
                com qualidade e foco, onde e quando quiser.
              </p>

              <div className="mt-6">
                <Button
                  asChild
                  size="sm"
                  className="
                    h-9
                    rounded-full
                    px-4
                    text-xs
                    font-semibold
                  "
                >
                  <Link href={continueHref}>
                    <Play className="mr-1 size-3.5 fill-current" />

                    {progress
                      ? "Continuar ouvindo"
                      : "Começar a estudar"}
                  </Link>
                </Button>
              </div>

              <div
                className="
                  mt-5
                  flex
                  flex-wrap
                  items-center
                  gap-4
                  text-[11px]
                  text-muted-foreground
                "
              >
                <div className="flex items-center gap-1.5">
                  <Headphones className="size-3.5" />

                  <span>
                    Mais de {availableBooks.length} leis em áudio
                  </span>
                </div>

                <div className="hidden h-3 w-px bg-border sm:block" />

                <span>Estude no seu ritmo</span>
              </div>
            </div>

            {/* LIVRO / PLAYER */}

            <div
              className="
                absolute
                -bottom-16
                right-[5%]
                hidden
                h-[350px]
                w-[245px]
                rotate-[7deg]
                overflow-hidden
                rounded-[32px]
                border-[7px]
                border-neutral-950
                bg-neutral-950
                shadow-2xl
                lg:block
              "
            >
              <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-[#07130d]">

                <div
                  className="
                    absolute
                    left-1/2
                    top-2
                    z-20
                    h-5
                    w-20
                    -translate-x-1/2
                    rounded-full
                    bg-black
                  "
                />

                <div className="flex h-full flex-col items-center px-5 pt-14">

                  <div
                    className="
                      relative
                      h-[145px]
                      w-[105px]
                      overflow-hidden
                      rounded-md
                      shadow-2xl
                    "
                  >
                    <Image
                      src={
                        continuedBook?.coverPath ??
                        "/capas/constituicao_federal.png"
                      }
                      alt={
                        continuedBook?.title ??
                        "Constituição Federal"
                      }
                      fill
                      sizes="105px"
                      className="object-cover"
                    />
                  </div>

                  <p
                    className="
                      mt-5
                      max-w-[180px]
                      truncate
                      text-center
                      text-[10px]
                      font-semibold
                      text-white
                    "
                  >
                    {progress?.law_title ??
                      continuedBook?.title ??
                      "Constituição Federal de 1988"}
                  </p>

                  <p className="mt-1 text-[8px] text-white/50">
                    Papirar
                  </p>

                  <div className="mt-5 w-full">
                    <div className="h-[2px] overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full bg-white"
                        style={{
                          width: `${Math.max(
                            progressPercentage,
                            18
                          )}%`,
                        }}
                      />
                    </div>

                    <div
                      className="
                        mt-2
                        flex
                        justify-between
                        text-[7px]
                        text-white/40
                      "
                    >
                      <span>
                        {progress
                          ? formatStudyTime(progress.total_seconds)
                          : "0:00"}
                      </span>

                      <span>--:--</span>
                    </div>
                  </div>

                  <div
                    className="
                      mt-3
                      flex
                      items-center
                      justify-center
                      gap-5
                    "
                  >
                    <span className="text-xs text-white/60">
                      ‹
                    </span>

                    <div
                      className="
                        flex
                        size-9
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        text-black
                      "
                    >
                      <Play className="ml-0.5 size-4 fill-current" />
                    </div>

                    <span className="text-xs text-white/60">
                      ›
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              COLUNA DIREITA
          ===================================================== */}

          <div className="grid gap-3 grid-rows-[1fr_auto]">

            {/* PROGRESSO */}

            <div
              className="
                rounded-[22px]
                border
                border-border/60
                bg-card
                p-5
              "
            >
              <div className="flex items-center justify-between">
                <h2
                  className="
                    font-heading
                    text-sm
                    font-bold
                    text-foreground
                  "
                >
                  Seu progresso
                </h2>

                <Link
                  href="/dashboard/estatisticas"
                  className="
                    flex
                    items-center
                    gap-1
                    text-[10px]
                    font-semibold
                    text-muted-foreground
                    transition-colors
                    hover:text-foreground
                  "
                >
                  Ver estatísticas
                  <ArrowRight className="size-3" />
                </Link>
              </div>

              <div
                className="
                  mt-5
                  grid
                  grid-cols-[120px_1px_1fr]
                  items-center
                  gap-5
                "
              >
                {/* CÍRCULO */}

                <div className="flex justify-center">
                  <ProgressCircle
                    percentage={progressPercentage}
                  />
                </div>

                <div className="h-[110px] bg-border" />

                {/* ESTATÍSTICAS */}

                <div className="space-y-3">

                  <ProgressRow
                    icon={Headphones}
                    label="Leis ouvidas"
                    value={
                      progress
                        ? String(Math.max(1, 1))
                        : "0"
                    }
                  />

                  <ProgressRow
                    icon={FolderOpen}
                    label="Categorias"
                    value={String(
                      bibliotecaCategories.length
                    )}
                  />

                  <ProgressRow
                    icon={Clock3}
                    label="Tempo total"
                    value={formatStudyTime(
                      progress?.total_seconds ?? 0
                    )}
                  />

                  <ProgressRow
                    icon={LibraryBig}
                    label="Leis disponíveis"
                    value={String(availableBooks.length)}
                  />
                </div>
              </div>
            </div>

            {/* FRASE */}

            <div
              className="
                flex
                min-h-[82px]
                items-center
                rounded-[22px]
                border
                border-border/60
                bg-card
                px-6
                py-4
              "
            >
              <Quote
                className="
                  mr-4
                  size-6
                  shrink-0
                  text-amber-500/50
                "
              />

              <p
                className="
                  flex-1
                  font-serif
                  text-sm
                  italic
                  leading-5
                  text-muted-foreground
                "
              >
                “Disciplina hoje,
                <br />
                resultados amanhã.”
              </p>

              <div className="mx-5 h-8 w-px bg-border" />

              <span
                className="
                  text-xs
                  font-medium
                  text-muted-foreground/60
                "
              >
                papirar
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            ACESSO RÁPIDO
        ===================================================== */}

        <section>
          <SectionHeader
            title="Acesso rápido"
            description="Tudo o que você precisa para continuar seus estudos."
          />

          <div
            className="
              mt-3
              grid
              gap-2
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {quickLinks.map(
              ({
                title,
                description,
                href,
                icon: Icon,
              }) => (
                <Link
                  key={href}
                  href={href}
                  className="group"
                >
                  <div
                    className="
                      flex
                      h-[72px]
                      items-center
                      rounded-[16px]
                      border
                      border-border/60
                      bg-card
                      px-4
                      transition-all
                      duration-200
                      hover:border-border
                      hover:bg-muted/40
                    "
                  >
                    <div
                      className="
                        flex
                        size-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        border
                        border-border/70
                        bg-background
                      "
                    >
                      <Icon className="size-4" />
                    </div>

                    <div className="ml-3 min-w-0 flex-1">
                      <h3
                        className="
                          truncate
                          text-xs
                          font-bold
                          text-foreground
                        "
                      >
                        {title}
                      </h3>

                      <p
                        className="
                          mt-0.5
                          truncate
                          text-[10px]
                          text-muted-foreground
                        "
                      >
                        {description}
                      </p>
                    </div>

                    <ArrowRight
                      className="
                        size-3.5
                        shrink-0
                        text-muted-foreground
                        transition-transform
                        group-hover:translate-x-1
                      "
                    />
                  </div>
                </Link>
              )
            )}
          </div>
        </section>

        {/* =====================================================
            BIBLIOTECA
        ===================================================== */}

        <section>
          <div
            className="
              flex
              items-end
              justify-between
              gap-4
            "
          >
            <SectionHeader
              title="Sua biblioteca"
              description="Leis organizadas por tema, em áudio, para você estudar com mais foco."
            />

            <div
              className="
                hidden
                items-center
                gap-2
                sm:flex
              "
            >
              <button
                type="button"
                className="
                  rounded-full
                  bg-foreground
                  px-4
                  py-2
                  text-[10px]
                  font-semibold
                  text-background
                "
              >
                Mais ouvidas
              </button>

              <button
                type="button"
                className="
                  rounded-full
                  bg-muted
                  px-4
                  py-2
                  text-[10px]
                  font-medium
                  text-muted-foreground
                "
              >
                Recentes
              </button>

              <button
                type="button"
                className="
                  rounded-full
                  bg-muted
                  px-4
                  py-2
                  text-[10px]
                  font-medium
                  text-muted-foreground
                "
              >
                A-Z
              </button>

              <Link
                href="/dashboard/biblioteca"
                className="
                  ml-1
                  flex
                  items-center
                  gap-1
                  text-[10px]
                  font-semibold
                  text-foreground
                "
              >
                Ver todas
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>

          <div
            className="
              mt-3
              grid
              gap-2
              md:grid-cols-2
              xl:grid-cols-4
            "
          >
            {availableBooks.slice(0, 4).map((book) => {
              const isCurrent =
                progress?.law_id === book.lawId

              const percentage = isCurrent
                ? progressPercentage
                : 0

              return (
                <Link
                  key={book.id}
                  href={`/dashboard/biblioteca/${book.id}`}
                  className="group"
                >
                  <div
                    className="
                      relative
                      flex
                      min-h-[126px]
                      rounded-[18px]
                      border
                      border-border/60
                      bg-card
                      p-3
                      transition-all
                      duration-200
                      hover:border-border
                      hover:bg-muted/30
                    "
                  >
                    {/* CAPA */}

                    <div
                      className="
                        relative
                        h-[88px]
                        w-[62px]
                        shrink-0
                        overflow-hidden
                        rounded-[8px]
                        bg-muted
                        shadow-sm
                      "
                    >
                      <Image
                        src={
                          book.coverPath ??
                          "/capas/constituicao_federal.png"
                        }
                        alt={book.title}
                        fill
                        sizes="62px"
                        className="object-cover"
                      />
                    </div>

                    {/* INFO */}

                    <div
                      className="
                        ml-3
                        min-w-0
                        flex-1
                        pr-7
                      "
                    >
                      <span
                        className="
                          text-[9px]
                          font-semibold
                          uppercase
                          text-muted-foreground
                        "
                      >
                        {book.acronym}
                      </span>

                      <h3
                        className="
                          mt-1
                          line-clamp-2
                          text-xs
                          font-bold
                          leading-4
                          text-foreground
                        "
                      >
                        {book.title}
                      </h3>

                      <p
                        className="
                          mt-1
                          truncate
                          text-[9px]
                          text-muted-foreground
                        "
                      >
                        {book.category}
                      </p>

                      <div className="mt-3">
                        <div
                          className="
                            h-[3px]
                            overflow-hidden
                            rounded-full
                            bg-muted
                          "
                        >
                          <div
                            className="
                              h-full
                              rounded-full
                              bg-foreground
                              transition-all
                            "
                            style={{
                              width: `${percentage}%`,
                            }}
                          />
                        </div>

                        <div
                          className="
                            mt-1
                            flex
                            justify-between
                            text-[8px]
                            text-muted-foreground
                          "
                        >
                          <span>
                            {isCurrent
                              ? formatStudyTime(
                                  progress?.total_seconds ??
                                    0
                                )
                              : "Não iniciado"}
                          </span>

                          <span>
                            {percentage}% concluído
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PLAY */}

                    <div
                      className="
                        absolute
                        right-3
                        top-3
                        flex
                        size-7
                        items-center
                        justify-center
                        rounded-full
                        bg-muted
                        text-foreground
                        transition-all
                        group-hover:bg-foreground
                        group-hover:text-background
                      "
                    >
                      <Play className="ml-0.5 size-3 fill-current" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* MOBILE VER TODAS */}

          <div className="mt-3 sm:hidden">
            <Button
              asChild
              variant="outline"
              className="w-full rounded-full"
            >
              <Link href="/dashboard/biblioteca">
                Ver toda biblioteca
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </DashboardShell>
  )
}

/* =========================================================
   PROGRESS CIRCLE
========================================================= */

function ProgressCircle({
  percentage,
}: {
  percentage: number
}) {
  const normalized = Math.min(
    Math.max(percentage, 0),
    100
  )

  const radius = 42
  const circumference = 2 * Math.PI * radius

  const offset =
    circumference -
    (normalized / 100) * circumference

  return (
    <div
      className="
        relative
        flex
        size-[105px]
        items-center
        justify-center
      "
    >
      <svg
        viewBox="0 0 100 100"
        className="-rotate-90 size-full"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-muted"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-foreground transition-all duration-700"
        />
      </svg>

      <div
        className="
          absolute
          inset-0
          flex
          flex-col
          items-center
          justify-center
        "
      >
        <strong
          className="
            font-heading
            text-xl
            font-black
            tracking-tight
            text-foreground
          "
        >
          {normalized}%
        </strong>

        <span
          className="
            mt-0.5
            max-w-[70px]
            text-center
            text-[8px]
            leading-[10px]
            text-muted-foreground
          "
        >
          da meta semanal
        </span>
      </div>
    </div>
  )
}

/* =========================================================
   PROGRESS ROW
========================================================= */

function ProgressRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="
          flex
          size-6
          shrink-0
          items-center
          justify-center
          rounded-md
          bg-muted
        "
      >
        <Icon className="size-3 text-muted-foreground" />
      </div>

      <span
        className="
          min-w-0
          flex-1
          truncate
          text-[10px]
          text-muted-foreground
        "
      >
        {label}
      </span>

      <strong
        className="
          shrink-0
          text-[10px]
          font-bold
          text-foreground
        "
      >
        {value}
      </strong>
    </div>
  )
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div>
      <h2
        className="
          font-heading
          text-base
          font-black
          tracking-tight
          text-foreground
        "
      >
        {title}
      </h2>

      <p
        className="
          mt-0.5
          text-[11px]
          text-muted-foreground
        "
      >
        {description}
      </p>
    </div>
  )
}