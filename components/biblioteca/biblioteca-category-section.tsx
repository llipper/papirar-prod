"use client"

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  useRef,
  type PointerEvent,
} from "react"

import { Button } from "@/components/ui/button"
import type {
  BibliotecaBook,
  BibliotecaCategory,
} from "@/lib/biblioteca/catalog-data"

import { BibliotecaBookCard } from "./biblioteca-book-card"

const categoryDescriptions: Record<
  BibliotecaCategory,
  string
> = {
  Constitucional:
    "Normas fundamentais e princípios que estruturam o Estado.",

  Códigos:
    "Legislação codificada por área do direito.",

  Estatutos:
    "Leis especiais organizadas por tema.",

  Leis:
    "Legislação especial para diferentes áreas jurídicas.",

  "Direitos Humanos":
    "Tratados e normas fundamentais de proteção à pessoa.",

  "Proteção de Dados":
    "Normas relacionadas à privacidade e proteção de dados.",
}

export function BibliotecaCategorySection({
  category,
  books,
}: {
  category: BibliotecaCategory
  books: BibliotecaBook[]
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
  })

  const isFeatured =
    category === "Constitucional" && books.length === 1

  /* =========================================================
     SCROLL
  ========================================================= */

  const scroll = (
    direction: "left" | "right"
  ) => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -500 : 500,
      behavior: "smooth",
    })
  }

  /* =========================================================
     DRAG
  ========================================================= */

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (
      event.pointerType !== "mouse" ||
      event.button !== 0
    ) {
      return
    }

    const scroller = scrollerRef.current

    if (!scroller) return

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
    }
  }

  const handlePointerMove = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    if (
      event.pointerType !== "mouse" ||
      !dragRef.current.active
    ) {
      return
    }

    const scroller = scrollerRef.current

    if (!scroller) return

    const distance =
      event.clientX - dragRef.current.startX

    if (
      !dragRef.current.moved &&
      Math.abs(distance) < 5
    ) {
      return
    }

    if (!dragRef.current.moved) {
      dragRef.current.moved = true

      try {
        scroller.setPointerCapture(event.pointerId)
      } catch {}
    }

    scroller.scrollLeft =
      dragRef.current.startScrollLeft - distance
  }

  const stopDragging = (
    event: PointerEvent<HTMLDivElement>
  ) => {
    dragRef.current.active = false

    if (
      scrollerRef.current?.hasPointerCapture(
        event.pointerId
      )
    ) {
      try {
        scrollerRef.current.releasePointerCapture(
          event.pointerId
        )
      } catch {}
    }

    if (dragRef.current.moved) {
      setTimeout(() => {
        dragRef.current.moved = false
      }, 50)
    }
  }

  const handleClickCapture = (
    event: React.MouseEvent
  ) => {
    if (dragRef.current.moved) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  return (
    <section
      aria-labelledby={`biblioteca-${category}`}
    >
      {/* =====================================================
          CATEGORY HEADER
      ===================================================== */}

      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <h2
            id={`biblioteca-${category}`}
            className="
              font-heading
              text-[15px]
              font-black
              tracking-tight
              text-foreground
            "
          >
            {category}
          </h2>

          <p
            className="
              mt-0.5
              text-[10px]
              text-muted-foreground
            "
          >
            {categoryDescriptions[category]}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="
              mr-1
              text-[10px]
              font-medium
              text-muted-foreground
            "
          >
            {books.length}{" "}
            {books.length === 1 ? "lei" : "leis"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="
              size-8
              rounded-full
              bg-muted/60
              text-muted-foreground
              hover:bg-muted
              hover:text-foreground
            "
            onClick={() => scroll("left")}
            aria-label={`Anterior em ${category}`}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="
              size-8
              rounded-full
              bg-muted/60
              text-muted-foreground
              hover:bg-muted
              hover:text-foreground
            "
            onClick={() => scroll("right")}
            aria-label={`Próximo em ${category}`}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* =====================================================
          FEATURED
      ===================================================== */}

      {isFeatured ? (
        <BibliotecaBookCard
          book={books[0]}
          index={0}
          featured
        />
      ) : (
        /* ===================================================
           CARROSSEL
        =================================================== */

        <div
          ref={scrollerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
          onClickCapture={handleClickCapture}
          className="
            flex
            min-w-0
            max-w-full
            cursor-grab
            select-none
            gap-2
            overflow-x-auto
            scroll-smooth
            active:cursor-grabbing
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {books.map((book, index) => (
            <BibliotecaBookCard
              key={book.id}
              book={book}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  )
}