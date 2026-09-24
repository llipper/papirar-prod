"use client"

import React, { useState } from "react"
import { X } from "lucide-react"
import { useReadingAudio } from "@/lib/biblioteca/reading-audio-context"
import { ReadingPlayerProgress } from "./reading-player-progress"
import { ReadingPlayerControls } from "./reading-player-controls"
import { ReadingPlayerVolume } from "./reading-player-volume"
import { ReadingPlayerNext } from "./reading-player-next"

export function ReadingFloatingAudioPlayer() {
  const {
    currentAudio,
    currentLabel,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    isMuted,
    toggleAudio,
    seek,
    setSpeed,
    setVolume,
    toggleMute,
    closePlayer,
    nextAudio,
    playNext,
  } = useReadingAudio()

  const [isSeeking, setIsSeeking] = useState(false)
  const [seekValue, setSeekValue] = useState(0)

  if (!currentAudio) return null

  const displayProgress =
    duration > 0
      ? (isSeeking ? seekValue : currentTime) / duration
      : 0

  const progressPercent = Math.min(
    100,
    Math.max(0, displayProgress * 100)
  )

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value))
  }

  const handleSeekMouseDown = () => {
    setIsSeeking(true)
    setSeekValue(currentTime)
  }

  const handleSeekMouseUp = () => {
    seek(seekValue)
    setIsSeeking(false)
  }

  const skipBackward = () => {
    seek(Math.max(0, currentTime - 10))
  }

  const skipForward = () => {
    if (!duration) {
      seek(currentTime + 10)
      return
    }
    seek(Math.min(duration, currentTime + 10))
  }

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2]
    const currentIndex = speeds.indexOf(playbackRate)
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % speeds.length
    setSpeed(speeds[nextIndex])
  }

  const labelText =
    currentLabel || currentAudio.title || "Áudio da lei"

  return (
    <footer
      className="
        relative
        z-30
        w-full
        shrink-0
        select-none
        rounded-b-[22px]
        bg-[#0c0d10]
        text-white
        dark:bg-white
        dark:text-black
        shadow-[0_8px_20px_rgba(0,0,0,0.18)]
        dark:shadow-[0_8px_20px_rgba(0,0,0,0.08)]
        transition-colors
        duration-300
        animate-in
        slide-in-from-bottom
      "
      aria-label="Player de áudio"
    >
      {/* CURVA SUPERIOR */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-0
          right-0
          top-0
          z-10
          h-[18px]
          rounded-b-[26px]
          bg-background
          shadow-[0_5px_10px_rgba(0,0,0,0.10)]
        "
      />

      {/* PLAYER */}
      <div
        className="
          relative
          z-20
          mx-auto
          flex
          h-16
          items-center
          px-5
          pt-[12px]
          sm:h-20
          sm:px-7
          sm:pt-[14px]
        "
      >
        {/* BLOCO 1: PROGRESSO & TÍTULO */}
        <ReadingPlayerProgress
          title={labelText}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          progressPercent={progressPercent}
          isSeeking={isSeeking}
          seekValue={seekValue}
          onSeekChange={handleSeekChange}
          onSeekMouseDown={handleSeekMouseDown}
          onSeekMouseUp={handleSeekMouseUp}
        />

        {/* BLOCO 2: CONTROLES CENTRAIS */}
        <ReadingPlayerControls
          isPlaying={isPlaying}
          onTogglePlay={() => toggleAudio(currentAudio, currentLabel ?? undefined)}
          onSkipBackward={skipBackward}
          onSkipForward={skipForward}
        />

        {/* BLOCOS 3 & 4: VELOCIDADE, VOLUME & PRÓXIMO */}
        <div
          className="
            ml-auto
            flex
            shrink-0
            items-center
            gap-1.5
            sm:gap-4
          "
        >
          {/* BLOCO 3: VELOCIDADE & VOLUME */}
          <ReadingPlayerVolume
            playbackRate={playbackRate}
            onCycleSpeed={cycleSpeed}
            volume={volume}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onVolumeChange={setVolume}
          />

          {/* BLOCO 4: PRÓXIMO ARTIGO */}
          <ReadingPlayerNext
            nextLabel={nextAudio?.label}
            onNext={nextAudio ? playNext : undefined}
          />

          <button
            type="button"
            onClick={closePlayer}
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:bg-white/10 hover:text-white dark:text-black/55 dark:hover:bg-black/10 dark:hover:text-black"
            aria-label="Parar e fechar player"
            title="Parar e fechar"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </footer>
  )
}
