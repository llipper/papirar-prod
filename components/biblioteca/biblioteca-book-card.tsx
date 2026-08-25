"use client"

import { BookOpenText } from "lucide-react"
import Link from "next/link"

import type { BibliotecaBook } from "@/lib/biblioteca/catalog-data"
import { cn } from "@/lib/utils"

const coverColors = [
  "bg-[#f3c7a2] text-[#1d252c]",
  "bg-[#ef5a21] text-white",
  "bg-[#f2c318] text-[#38280b]",
  "bg-[#e6e2d7] text-[#1d252c]",
  "bg-[#c5d4e8] text-[#1d252c]",
  "bg-[#d9c4a8] text-[#1d252c]",
  "bg-[#bed8d2] text-[#1d252c]",
  "bg-[#edc1c7] text-[#1d252c]",
  "bg-[#c8b8dd] text-[#1d252c]",
]

export function BibliotecaBookCard({
  book,
  index,
}: {
  book: BibliotecaBook
  index: number
}) {
  return (
    <Link
      href={`/dashboard/biblioteca/${book.id}`}
      className={cn(
        "group relative flex h-[180px] w-[124px] shrink-0 flex-col overflow-hidden rounded-[2px] p-3.5 text-left shadow-md transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-[205px] sm:w-[142px] sm:p-4",
        coverColors[index % coverColors.length]
      )}
      aria-label={`Abrir ${book.title}`}
    >
      <span className="text-[7px] font-bold uppercase tracking-[0.08em] opacity-70 sm:text-[8px]">
        {book.category}
      </span>
      <span className="mt-2 line-clamp-5 font-serif text-[15px] font-bold leading-[1.02] sm:text-[17px]">
        {book.title}
      </span>
      <span className="mt-auto flex items-center justify-between text-[10px] font-bold opacity-70 sm:text-[11px]">
        <BookOpenText className="size-3.5 sm:size-4" aria-hidden="true" />
        <span>{book.acronym}</span>
      </span>
    </Link>
  )
}
