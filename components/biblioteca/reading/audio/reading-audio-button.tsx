"use client"

import React from "react"
import { Play, Pause } from "lucide-react"
import type { ReadingAudio } from "@/lib/biblioteca/reading-service"
import { useReadingAudio } from "@/lib/biblioteca/reading-audio-context"

export function ReadingAudioButton({
  audio,
  label,
}: {
  audio: ReadingAudio
  label?: string
}) {
  const { currentAudio, isPlaying, toggleAudio } = useReadingAudio()

  const isSameAudio =
    currentAudio?.key === audio.key && currentAudio?.url === audio.url
  const isCurrentPlaying = isSameAudio && isPlaying
  const isCurrentActive = isSameAudio

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    void toggleAudio(audio, label)
  }

  const trackTitle = label || audio.title || "Áudio da lei"

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`inline-flex items-center justify-center align-middle mx-1.5 size-6 rounded-full transition-all duration-200 shadow-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring ${
        isCurrentPlaying
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 scale-105 ring-2 ring-neutral-900/20 dark:ring-white/20"
          : isCurrentActive
          ? "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"
          : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 hover:scale-105 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200"
      }`}
      aria-label={isCurrentPlaying ? `Pausar ${trackTitle}` : `Ouvir ${trackTitle}`}
      title={trackTitle}
    >
      {isCurrentPlaying ? (
        <Pause className="size-3 fill-current" />
      ) : (
        <Play className="size-3 fill-current ml-0.5" />
      )}
    </button>
  )
}
