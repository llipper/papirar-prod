"use client"

import React from "react"
import { ListMusic, ChevronRight } from "lucide-react"

export interface ReadingPlayerNextProps {
  nextLabel?: string
  onNext?: () => void
}

export function ReadingPlayerNext({
  nextLabel = "Art. 2º",
  onNext,
}: ReadingPlayerNextProps) {
  return (
    <>
      {/* DIVISOR */}
      <div
        aria-hidden="true"
        className="
          hidden
          h-8
          w-px
          shrink-0
          bg-white/15
          dark:bg-black/15
          md:block
        "
      />

      {/* PRÓXIMO ARTIGO */}
      <button
        type="button"
        onClick={onNext}
        className="
          group
          hidden
          shrink-0
          items-center
          gap-2
          rounded-md
          px-1
          py-1
          text-left
          text-white/70
          dark:text-black/70
          transition-all
          duration-200
          hover:bg-white/[0.05]
          hover:text-white
          dark:hover:bg-black/[0.05]
          dark:hover:text-black
          md:flex
        "
        aria-label={`Próximo artigo: ${nextLabel}`}
        title={`Próximo: ${nextLabel}`}
      >
        {/* ÍCONE */}
        <ListMusic
          className="
            size-[14px]
            shrink-0
            text-white/50
            dark:text-black/50
          "
        />

        {/* TEXTO */}
        <div
          className="
            flex
            min-w-[38px]
            flex-col
            items-start
            leading-none
          "
        >
          <span
            className="
              text-[8px]
              font-medium
              text-white/80
              dark:text-black/80
            "
          >
            Próximo
          </span>

          <span
            className="
              mt-[3px]
              max-w-[60px]
              truncate
              text-[7px]
              text-white/45
              dark:text-black/45
            "
          >
            {nextLabel}
          </span>
        </div>

        {/* SETA */}
        <ChevronRight
          className="
            size-3
            shrink-0
            text-white/40
            dark:text-black/40
            transition-transform
            duration-200
            group-hover:translate-x-0.5
          "
        />
      </button>
    </>
  )
}
