"use client"

import React from "react"

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00"

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)

  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export interface ReadingPlayerProgressProps {
  title: string
  isPlaying: boolean
  currentTime: number
  duration: number
  progressPercent: number
  isSeeking: boolean
  seekValue: number
  onSeekChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSeekMouseDown: () => void
  onSeekMouseUp: () => void
}

export function ReadingPlayerProgress({
  title,
  isPlaying,
  currentTime,
  duration,
  progressPercent,
  isSeeking,
  seekValue,
  onSeekChange,
  onSeekMouseDown,
  onSeekMouseUp,
}: ReadingPlayerProgressProps) {
  return (
    <div
      className="
        flex
        min-w-0
        flex-1
        items-center
        gap-3
        pr-[150px]
        xl:pr-[190px]
      "
    >
      {/* EQUALIZADOR + TÍTULO */}
      <div className="flex shrink-0 items-center gap-2.5">
        {/* Equalizador */}
        <div
          className="
            flex
            h-3.5
            w-3.5
            shrink-0
            items-end
            gap-[2px]
          "
          aria-hidden="true"
        >
          <span
            className={`
              w-[1.5px]
              rounded-full
              bg-white
              dark:bg-black
              transition-all
              duration-200
              ${
                isPlaying
                  ? "h-3.5 animate-[bounce_0.8s_infinite_ease-in-out_alternate]"
                  : "h-1.5 opacity-50"
              }
            `}
          />
          <span
            className={`
              w-[1.5px]
              rounded-full
              bg-white
              dark:bg-black
              transition-all
              duration-200
              ${
                isPlaying
                  ? "h-4 animate-[bounce_0.55s_infinite_ease-in-out_alternate_0.15s]"
                  : "h-3 opacity-80"
              }
            `}
          />
          <span
            className={`
              w-[1.5px]
              rounded-full
              bg-white
              dark:bg-black
              transition-all
              duration-200
              ${
                isPlaying
                  ? "h-2.5 animate-[bounce_0.7s_infinite_ease-in-out_alternate_0.3s]"
                  : "h-2 opacity-50"
              }
            `}
          />
          <span
            className={`
              w-[1.5px]
              rounded-full
              bg-white
              dark:bg-black
              transition-all
              duration-200
              ${
                isPlaying
                  ? "h-3 animate-[bounce_0.6s_infinite_ease-in-out_alternate_0.45s]"
                  : "h-1 opacity-40"
              }
            `}
          />
        </div>

        {/* TÍTULO */}
        <span
          className="
            max-w-[90px]
            truncate
            text-[11px]
            font-medium
            text-white/80
            dark:text-black/80
            sm:max-w-[120px]
          "
          title={title}
        >
          {title}
        </span>
      </div>

      {/* BARRA DE PROGRESSO */}
      <div
        className="
          hidden
          min-w-0
          max-w-[320px]
          flex-1
          flex-col
          gap-[3px]
          sm:flex
        "
      >
        <div
          className="
            group
            relative
            flex
            cursor-pointer
            items-center
            py-1
          "
        >
          {/* LINHA */}
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
                width: `${progressPercent}%`,
              }}
            />
          </div>

          {/* RANGE */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={isSeeking ? seekValue : currentTime}
            onChange={onSeekChange}
            onMouseDown={onSeekMouseDown}
            onMouseUp={onSeekMouseUp}
            onTouchStart={onSeekMouseDown}
            onTouchEnd={onSeekMouseUp}
            className="
              absolute
              inset-0
              z-10
              h-full
              w-full
              cursor-pointer
              opacity-0
            "
            aria-label="Progresso do áudio"
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
              left: `${progressPercent}%`,
            }}
          />
        </div>

        {/* TEMPOS */}
        <div
          className="
            flex
            items-center
            justify-between
            font-mono
            text-[8px]
            leading-none
            text-white/35
            dark:text-black/35
          "
        >
          <span>
            {formatTime(isSeeking ? seekValue : currentTime)}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  )
}
