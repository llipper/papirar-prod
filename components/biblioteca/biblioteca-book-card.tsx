"use client"

import { Play } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import type { BibliotecaBook } from "@/lib/biblioteca/catalog-data"
import { cn } from "@/lib/utils"

const coverColors = [
  "bg-[#173d2a] text-white",
  "bg-[#591515] text-white",
  "bg-[#07172d] text-white",
  "bg-[#354520] text-white",
  "bg-[#3d4143] text-white",
  "bg-[#b76d30] text-white",
  "bg-[#793428] text-white",
  "bg-[#56311e] text-white",
  "bg-[#164b63] text-white",
]

export function BibliotecaBookCard({
  book,
  index,
  featured = false,
}: {
  book: BibliotecaBook
  index: number
  featured?: boolean
}) {
  if (featured) {
    return <FeaturedBookCard book={book} index={index} />
  }

  return (
    <Link
      href={`/dashboard/biblioteca/${book.id}`}
      draggable={false}
      onDragStart={(event) => event.preventDefault()}
      className="
        group
        flex
        h-[148px]
        min-w-[285px]
        flex-1
        select-none
        items-center
        rounded-[14px]
        border
        border-border/60
        bg-card
        p-2.5
        transition-all
        duration-200
        hover:border-border
        hover:bg-muted/30
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-ring
      "
      aria-label={`Abrir ${book.title}`}
    >
      {/* CAPA */}

      <BookCover book={book} index={index} />

      {/* INFORMAÇÕES */}

      <div className="ml-3 flex min-w-0 flex-1 flex-col self-stretch py-1">
        <div>
          <span
            className="
              inline-flex
              rounded-md
              bg-muted
              px-1.5
              py-0.5
              text-[8px]
              font-semibold
              text-muted-foreground
            "
          >
            {book.acronym}
          </span>

          <h3
            className="
              mt-1.5
              line-clamp-2
              text-[11px]
              font-bold
              leading-[14px]
              text-foreground
            "
          >
            {book.title}
          </h3>

          <p
            className="
              mt-1
              line-clamp-1
              text-[9px]
              text-muted-foreground
            "
          >
            {book.category}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <div
            className="
              flex
              items-center
              gap-1.5
              text-[9px]
              font-semibold
              text-foreground
            "
          >
            <span
              className="
                flex
                size-7
                items-center
                justify-center
                rounded-full
                bg-muted
                transition-colors
                group-hover:bg-foreground
                group-hover:text-background
              "
            >
              <Play className="ml-0.5 size-3 fill-current" />
            </span>

            Ouvir
          </div>

          <span className="text-[8px] text-muted-foreground">
            Áudio disponível
          </span>
        </div>
      </div>
    </Link>
  )
}

/* =========================================================
   FEATURED
========================================================= */

function FeaturedBookCard({
  book,
  index,
}: {
  book: BibliotecaBook
  index: number
}) {
  return (
    <Link
      href={`/dashboard/biblioteca/${book.id}`}
      className="
        group
        relative
        flex
        min-h-[175px]
        w-full
        overflow-hidden
        rounded-[16px]
        border
        border-border/60
        bg-gradient-to-r
        from-card
        via-card
        to-muted/30
        p-3
        transition-colors
        hover:bg-muted/20
      "
    >
      {/* CAPA */}

      <div className="relative z-10">
        <BookCover
          book={book}
          index={index}
          large
        />
      </div>

      {/* TEXTO */}

      <div
        className="
          relative
          z-10
          ml-5
          flex
          min-w-0
          max-w-[420px]
          flex-col
          py-2
        "
      >
        <span
          className="
            w-fit
            rounded-md
            bg-muted
            px-2
            py-1
            text-[8px]
            font-semibold
            text-muted-foreground
          "
        >
          {book.acronym}
        </span>

        <h3
          className="
            mt-2
            font-heading
            text-base
            font-bold
            text-foreground
          "
        >
          {book.title}
        </h3>

        <p
          className="
            mt-1
            max-w-[390px]
            text-[10px]
            leading-4
            text-muted-foreground
          "
        >
          Texto integral da Constituição com áudio por artigos,
          incisos e temas.
        </p>

        <div className="mt-auto flex items-center gap-3">
          <span
            className="
              flex
              size-8
              items-center
              justify-center
              rounded-full
              bg-muted
              transition-colors
              group-hover:bg-foreground
              group-hover:text-background
            "
          >
            <Play className="ml-0.5 size-3.5 fill-current" />
          </span>

          <span className="text-[10px] font-semibold">
            Iniciar áudio
          </span>

          <span className="text-[9px] text-muted-foreground">
            Áudio disponível
          </span>
        </div>
      </div>

      {/* =====================================================
          DECORAÇÃO BRASÍLIA
      ===================================================== */}

      <div
        className="
          pointer-events-none
          absolute
          inset-y-0
          right-0
          hidden
          w-[43%]
          overflow-hidden
          lg:block
        "
      >
        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-transparent
            via-background/20
            to-muted/50
          "
        />

        {/* torres */}

        <div
          className="
            absolute
            bottom-5
            right-[36%]
            h-[100px]
            w-[9px]
            bg-foreground/10
          "
        />

        <div
          className="
            absolute
            bottom-5
            right-[32%]
            h-[110px]
            w-[9px]
            bg-foreground/15
          "
        />

        {/* base */}

        <div
          className="
            absolute
            bottom-5
            right-[17%]
            h-[7px]
            w-[180px]
            rounded-full
            bg-foreground/10
          "
        />

        {/* cúpula */}

        <div
          className="
            absolute
            bottom-5
            right-[20%]
            h-[38px]
            w-[90px]
            rounded-t-full
            border-t
            border-foreground/10
          "
        />

        <p
          className="
            absolute
            right-6
            top-10
            max-w-[145px]
            font-serif
            text-[11px]
            italic
            leading-4
            text-muted-foreground/70
          "
        >
          “Conhecimento jurídico
          <br />
          com mais profundidade,
          <br />
          no seu ritmo.”
        </p>
      </div>
    </Link>
  )
}

/* =========================================================
   BOOK COVER
========================================================= */

function BookCover({
  book,
  index,
  large = false,
}: {
  book: BibliotecaBook
  index: number
  large?: boolean
}) {
  return (
    <div
      className={cn(
        `
          relative
          shrink-0
          overflow-hidden
          rounded-[5px]
          shadow-md
        `,
        large
          ? "h-[150px] w-[105px]"
          : "h-[124px] w-[87px]",
        !book.coverPath &&
          coverColors[index % coverColors.length]
      )}
    >
      {book.coverPath ? (
        <Image
          src={book.coverPath}
          alt={`Capa de ${book.title}`}
          fill
          draggable={false}
          sizes={large ? "105px" : "87px"}
          className="pointer-events-none select-none object-cover"
        />
      ) : (
        <div className="flex h-full flex-col p-2">
          <span className="text-[6px] font-semibold uppercase opacity-60">
            Papirar
          </span>

          <span
            className="
              mt-auto
              font-serif
              text-[11px]
              font-bold
              leading-tight
            "
          >
            {book.title}
          </span>

          <span className="mt-2 text-[7px] font-bold opacity-70">
            {book.acronym}
          </span>
        </div>
      )}
    </div>
  )
}