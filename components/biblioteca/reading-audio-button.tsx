"use client"

import { Pause, Play, Square } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import type { MouseEvent } from "react"

import type { ReadingAudio } from "@/lib/biblioteca/reading-service"

const WAVEFORM = [3, 5, 8, 5, 10, 6, 12, 8, 4, 9, 6, 11, 5, 8, 4, 7, 3, 6]

export function ReadingAudioButton({ audio }: { audio: ReadingAudio }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [playerVisible, setPlayerVisible] = useState(false)
  const [playerClosing, setPlayerClosing] = useState(false)

  useEffect(() => {
    const element = audioRef.current
    if (!element) return

    const onEnded = () => {
      setPlaying(false)
      setCurrentTime(0)
      closePlayer()
    }
    const onLoadedMetadata = () => setDuration(Number.isFinite(element.duration) ? element.duration : 0)
    const onTimeUpdate = () => setCurrentTime(element.currentTime)

    element.addEventListener("ended", onEnded)
    element.addEventListener("loadedmetadata", onLoadedMetadata)
    element.addEventListener("timeupdate", onTimeUpdate)
    return () => {
      element.removeEventListener("ended", onEnded)
      element.removeEventListener("loadedmetadata", onLoadedMetadata)
      element.removeEventListener("timeupdate", onTimeUpdate)
    }
  }, [])

  const toggle = async () => {
    const element = audioRef.current
    if (!element) return

    if (element.paused) {
      element.playbackRate = playbackRate
      await element.play()
      setPlaying(true)
      setPlayerClosing(false)
      setPlayerVisible(true)
    } else {
      element.pause()
      setPlaying(false)
    }
  }

  const closePlayer = () => {
    setPlayerClosing(true)
    window.setTimeout(() => {
      setPlayerVisible(false)
      setPlayerClosing(false)
    }, 180)
  }

  const stop = () => {
    const element = audioRef.current
    if (!element) return
    element.pause()
    element.currentTime = 0
    setCurrentTime(0)
    setPlaying(false)
    closePlayer()
  }

  const cyclePlaybackRate = () => {
    const element = audioRef.current
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1
    if (element) element.playbackRate = nextRate
    setPlaybackRate(nextRate)
  }

  const seek = (event: MouseEvent<HTMLButtonElement>) => {
    const element = audioRef.current
    if (!element || !duration) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width))
    element.currentTime = ratio * duration
    setCurrentTime(element.currentTime)
  }

  const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) return "0:00"
    const minutes = Math.floor(value / 60)
    const seconds = Math.floor(value % 60).toString().padStart(2, "0")
    return `${minutes}:${seconds}`
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <span className="relative mx-1 inline-flex align-middle">
      <audio ref={audioRef} src={audio.url} preload="metadata" aria-label={audio.title} />

      {playerVisible && (
        <span className={`absolute bottom-full left-0 z-30 mb-1 flex h-7 origin-bottom-left items-center gap-1 rounded-lg border border-border/80 bg-background px-1.5 shadow-lg transition-all duration-200 ${playerClosing ? "animate-out fade-out zoom-out-95" : "animate-in fade-in zoom-in-95"}`}>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-80"
            aria-label={`Pausar ${audio.title}`}
          >
            {playing ? <Pause className="size-2.5 fill-current" /> : <Play className="size-2.5 translate-x-px fill-current" />}
          </button>
          <button
            type="button"
            onClick={seek}
            className="flex h-5 w-[78px] items-center justify-center gap-px"
            aria-label={`Avançar no áudio ${audio.title}`}
          >
            {WAVEFORM.map((height, index) => (
              <span
                key={index}
                className="w-px rounded-full bg-foreground/45"
                style={{ height: `${height}px`, opacity: index / WAVEFORM.length <= progress ? 1 : 0.45 }}
              />
            ))}
          </button>
          <span className="min-w-[28px] text-right font-mono text-[8px] leading-none text-muted-foreground">
            {formatTime(currentTime || duration)}
          </span>
          <button
            type="button"
            onClick={stop}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Parar ${audio.title}`}
            title="Parar"
          >
            <Square className="size-2.5 fill-current" />
          </button>
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="min-w-[22px] rounded-md px-0.5 font-mono text-[8px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={`Velocidade ${playbackRate}x. Clique para alterar`}
            title="Alterar velocidade"
          >
            {playbackRate}x
          </button>
        </span>
      )}

      <button
        type="button"
        onClick={toggle}
        className="inline-flex size-6 items-center justify-center rounded-full text-black transition-colors hover:bg-accent hover:text-black dark:text-white dark:hover:text-white"
        aria-label={playing ? `Pausar ${audio.title}` : `Ouvir ${audio.title}`}
        title={audio.title}
      >
        {playing ? <Pause className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
      </button>
    </span>
  )
}
