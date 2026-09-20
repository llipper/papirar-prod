"use client"

import React from "react"
import { Volume2, VolumeX, Volume1 } from "lucide-react"

export interface ReadingPlayerVolumeProps {
  playbackRate: number
  onCycleSpeed: () => void
  volume: number
  isMuted: boolean
  onToggleMute: () => void
  onVolumeChange: (volume: number) => void
}

export function ReadingPlayerVolume({
  playbackRate,
  onCycleSpeed,
  volume,
  isMuted,
  onToggleMute,
  onVolumeChange,
}: ReadingPlayerVolumeProps) {
  const volumePercent = isMuted
    ? 0
    : Math.min(100, Math.max(0, volume * 100))

  return (
    <>
      {/* VELOCIDADE */}
      <button
        type="button"
        onClick={onCycleSpeed}
        className="
          hidden
          h-6
          min-w-7
          items-center
          justify-center
          rounded-md
          bg-white/[0.06]
          px-1.5
          font-mono
          text-[9px]
          font-medium
          text-white/65
          transition-colors
          hover:bg-white/10
          hover:text-white
          dark:bg-black/[0.06]
          dark:text-black/65
          dark:hover:bg-black/10
          dark:hover:text-black
          sm:flex
        "
        title="Alterar velocidade"
        aria-label={`Velocidade ${playbackRate}x`}
      >
        {playbackRate}x
      </button>

      {/* VOLUME */}
      <div
        className="
          hidden
          items-center
          gap-2
          md:flex
        "
      >
        <button
          type="button"
          onClick={onToggleMute}
          className="
            p-0.5
            text-white/55
            hover:text-white
            dark:text-black/55
            dark:hover:text-black
            transition-colors
          "
          aria-label={
            isMuted || volume === 0
              ? "Ativar som"
              : "Silenciar som"
          }
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="size-3.5" />
          ) : volume < 0.5 ? (
            <Volume1 className="size-3.5" />
          ) : (
            <Volume2 className="size-3.5" />
          )}
        </button>

        {/* BARRA DE VOLUME */}
        <div
          className="
            relative
            flex
            w-16
            cursor-pointer
            items-center
            py-2
            xl:w-20
          "
        >
          <div
            className="
              relative
              h-[2px]
              w-full
              overflow-hidden
              rounded-full
              bg-white/15
              dark:bg-black/15
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-white
                dark:bg-black
              "
              style={{
                width: `${volumePercent}%`,
              }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="
              absolute
              inset-0
              z-10
              h-full
              w-full
              cursor-pointer
              opacity-0
            "
            aria-label="Controle de volume"
          />

          {/* BOLINHA */}
          <div
            className="
              pointer-events-none
              absolute
              top-1/2
              size-2
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-white
              dark:bg-black
            "
            style={{
              left: `${volumePercent}%`,
            }}
          />
        </div>
      </div>
    </>
  )
}
