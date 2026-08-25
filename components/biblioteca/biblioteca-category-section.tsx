"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useRef } from "react"
import type { PointerEvent } from "react"

import { Button } from "@/components/ui/button"
import type { BibliotecaBook, BibliotecaCategory } from "@/lib/biblioteca/catalog-data"
import { cn } from "@/lib/utils"
import { BibliotecaBookCard } from "./biblioteca-book-card"

const categoryColors: Record<BibliotecaCategory, string> = {
  Constitucional: "bg-[#e5a858]",
  Códigos: "bg-[#5ca7db]",
  Estatutos: "bg-[#7fb875]",
  Leis: "bg-[#d8a34f]",
  "Direitos Humanos": "bg-[#a997cf]",
  "Proteção de Dados": "bg-[#72b7b2]",
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

  const scroll = (direction: "left" | "right") => {
    scrollerRef.current?.scrollBy({
      left: direction === "left" ? -440 : 440,
      behavior: "smooth",
    })
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return

    const scroller = scrollerRef.current
    if (!scroller) return

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startScrollLeft: scroller.scrollLeft,
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current
    if (!scroller || !dragRef.current.active) return

    const distance = event.clientX - dragRef.current.startX
    if (!dragRef.current.moved && Math.abs(distance) < 6) return

    if (!dragRef.current.moved) {
      dragRef.current.moved = true
      scroller.setPointerCapture(event.pointerId)
    }

    scroller.scrollLeft =
      dragRef.current.startScrollLeft - distance
  }

  const stopDragging = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current.moved) event.preventDefault()
    dragRef.current.active = false
    dragRef.current.moved = false
    if (scrollerRef.current?.hasPointerCapture(event.pointerId)) {
      scrollerRef.current.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <section className="space-y-2" aria-labelledby={`biblioteca-${category}`}>
      <div className="flex items-center justify-between gap-4 px-1">
        <h2 id={`biblioteca-${category}`} className="font-serif text-[10px] font-bold text-foreground sm:text-xs">
          {category}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium text-muted-foreground">
            {books.length} {books.length === 1 ? "lei" : "leis"}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-5 text-muted-foreground"
            onClick={() => scroll("left")}
            aria-label={`Anterior em ${category}`}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="size-5 text-muted-foreground"
            onClick={() => scroll("right")}
            aria-label={`Próximo em ${category}`}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="relative h-[212px] min-w-0 max-w-full overflow-hidden sm:h-[233px]">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-2 z-10 h-14 rounded-[5px] border border-white/25 opacity-90 shadow-[0_4px_10px_rgba(0,0,0,0.16)] sm:h-16",
            categoryColors[category]
          )}
        >
          <span className="absolute left-2 top-1/2 size-2 -translate-y-1/2 rounded-full border border-black/10 bg-white/65 shadow-sm" />
          <span className="absolute right-2 top-1/2 size-2 -translate-y-1/2 rounded-full border border-black/10 bg-white/65 shadow-sm" />
          <span className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1">
            <span className="size-1 rounded-full bg-white/90" />
            <span className="size-1 rounded-full bg-white/55" />
            <span className="size-1 rounded-full bg-white/55" />
            <span className="size-1 rounded-full bg-white/55" />
          </span>
        </div>
        <div
          ref={scrollerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onPointerLeave={stopDragging}
          className="relative z-0 flex h-full min-w-0 max-w-full cursor-grab touch-pan-x select-none items-start gap-3 overflow-x-auto px-3 pb-5 pt-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 sm:px-4"
        >
          {books.map((book, index) => (
            <BibliotecaBookCard key={book.id} book={book} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
