"use client"

import React from "react"
import { Play, Pause, RotateCcw, RotateCw } from "lucide-react"

export interface ReadingPlayerControlsProps {
  isPlaying: boolean
  onTogglePlay: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
}

export function ReadingPlayerControls({
  isPlaying,
  onTogglePlay,
  onSkipBackward,
  onSkipForward,
}: ReadingPlayerControlsProps) {
  return (
    <div
      className="
        absolute
        left-1/2
        top-[calc(50%+6px)]
        z-30
        flex
        -translate-x-1/2
        -translate-y-1/2
        items-center
        gap-2
        sm:gap-3
      "
    >
      {/* VOLTAR 10s */}
      <button
        type="button"
        onClick={onSkipBackward}
        className="
          group
          relative
          hidden
          size-8
          items-center
          justify-center
          rounded-full
          text-white/55
          dark:text-black/55
          transition-all
          duration-200
          hover:bg-white/5
          hover:text-white
          dark:hover:bg-black/5
          dark:hover:text-black
          sm:flex
        "
        aria-label="Voltar 10 segundos"
        title="Voltar 10 segundos"
      >
        <RotateCcw className="size-[18px] stroke-[1.6]" />
        <span
          className="
            pointer-events-none
            absolute
            text-[6px]
            font-semibold
            leading-none
          "
        >
          10
        </span>
      </button>

      {/* PLAY / PAUSE */}
      <button
        type="button"
        onClick={onTogglePlay}
        className="
          flex
          size-9
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white
          text-black
          dark:bg-black
          dark:text-white
          shadow-[0_0_16px_rgba(255,255,255,0.28)]
          dark:shadow-[0_0_16px_rgba(0,0,0,0.16)]
          transition-all
          duration-200
          hover:scale-105
          active:scale-95
          sm:size-10
        "
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause
            className="
              size-4
              fill-black
              text-black
              dark:fill-white
              dark:text-white
            "
          />
        ) : (
          <Play
            className="
              ml-0.5
              size-4
              fill-black
              text-black
              dark:fill-white
              dark:text-white
            "
          />
        )}
      </button>

      {/* AVANÇAR 10s */}
      <button
        type="button"
        onClick={onSkipForward}
        className="
          group
          relative
          hidden
          size-8
          items-center
          justify-center
          rounded-full
          text-white/55
          dark:text-black/55
          transition-all
          duration-200
          hover:bg-white/5
          hover:text-white
          dark:hover:bg-black/5
          dark:hover:text-black
          sm:flex
        "
        aria-label="Avançar 10 segundos"
        title="Avançar 10 segundos"
      >
        <RotateCw className="size-[18px] stroke-[1.6]" />
        <span
          className="
            pointer-events-none
            absolute
            text-[6px]
            font-semibold
            leading-none
          "
        >
          10
        </span>
      </button>
    </div>
  )
}
