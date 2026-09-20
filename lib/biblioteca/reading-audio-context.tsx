"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { type ReadingAudio } from "./reading-service"

export type ReadingAudioQueueItem = {
  audio: ReadingAudio
  label: string
  sortOrder: number
}

type ReadingAudioContextType = {
  currentAudio: ReadingAudio | null
  currentLabel: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  isMuted: boolean
  playAudio: (audio: ReadingAudio, label?: string) => Promise<void>
  pauseAudio: () => void
  toggleAudio: (audio: ReadingAudio, label?: string) => Promise<void>
  seek: (time: number) => void
  setSpeed: (rate: number) => void
  setVolume: (vol: number) => void
  toggleMute: () => void
  closePlayer: () => void
  nextAudio: ReadingAudioQueueItem | null
  playNext: () => Promise<void>
}

const ReadingAudioContext = createContext<ReadingAudioContextType | null>(null)

export function ReadingAudioProvider({
  children,
  audioQueue = [],
}: {
  children: ReactNode
  audioQueue?: ReadingAudioQueueItem[]
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentAudio, setCurrentAudio] = useState<ReadingAudio | null>(null)
  const [currentLabel, setCurrentLabel] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolumeState] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const currentAudioRef = useRef<ReadingAudio | null>(null)
  const playAudioRef = useRef<
    ((audio: ReadingAudio, label?: string) => Promise<void>) | null
  >(null)

  const orderedQueue = React.useMemo(
    () => [...audioQueue].sort((a, b) => a.sortOrder - b.sortOrder),
    [audioQueue]
  )

  const getNextAudio = useCallback(
    (audio: ReadingAudio | null) => {
      if (!audio) return null

      const currentIndex = orderedQueue.findIndex(
        (item) => item.audio.key === audio.key && item.audio.url === audio.url
      )

      return currentIndex >= 0 ? orderedQueue[currentIndex + 1] ?? null : null
    },
    [orderedQueue]
  )

  useEffect(() => {
    currentAudioRef.current = currentAudio
  }, [currentAudio])

  // Inicializa o elemento de áudio central
  useEffect(() => {
    const audio = new Audio()
    audio.preload = "metadata"
    audioRef.current = audio

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      const nextItem = getNextAudio(currentAudioRef.current)
      if (nextItem) {
        void playAudioRef.current?.(nextItem.audio, nextItem.label)
        return
      }

      setCurrentAudio(null)
      setCurrentLabel(null)
    }
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    }
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const onError = () => {
      console.warn("Erro ao reproduzir áudio:", audio.error)
      setIsPlaying(false)
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("error", onError)
      audio.pause()
      audio.src = ""
    }
  }, [getNextAudio])

  const playAudio = useCallback(async (audioItem: ReadingAudio, label?: string) => {
    const audioEl = audioRef.current
    if (!audioEl) return

    const resolvedUrl = audioItem.url
    const isSameAudio =
      currentAudio?.key === audioItem.key && currentAudio?.url === audioItem.url

    setCurrentAudio(audioItem)
    if (label) setCurrentLabel(label)

    if (!isSameAudio || audioEl.src !== resolvedUrl) {
      audioEl.src = resolvedUrl
      audioEl.currentTime = 0
      audioEl.playbackRate = playbackRate
      audioEl.volume = isMuted ? 0 : volume
      setCurrentTime(0)
      setDuration(audioItem.durationMs ? audioItem.durationMs / 1000 : 0)
    }

    try {
      await audioEl.play()
      setIsPlaying(true)
    } catch (err) {
      console.warn("Falha ao tocar áudio:", err)
      setIsPlaying(false)
    }
  }, [currentAudio, playbackRate, volume, isMuted])

  useEffect(() => {
    playAudioRef.current = playAudio
  }, [playAudio])

  const pauseAudio = useCallback(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    audioEl.pause()
    setIsPlaying(false)
  }, [])

  const toggleAudio = useCallback(async (audioItem: ReadingAudio, label?: string) => {
    const isSameAudio =
      currentAudio?.key === audioItem.key && currentAudio?.url === audioItem.url
    if (isSameAudio && isPlaying) {
      pauseAudio()
    } else {
      await playAudio(audioItem, label)
    }
  }, [currentAudio, isPlaying, pauseAudio, playAudio])

  const seek = useCallback((targetTime: number) => {
    const audioEl = audioRef.current
    if (!audioEl) return
    const safeTime = Math.max(0, Math.min(targetTime, duration || audioEl.duration || 0))
    audioEl.currentTime = safeTime
    setCurrentTime(safeTime)
  }, [duration])

  const setSpeed = useCallback((newRate: number) => {
    const audioEl = audioRef.current
    if (audioEl) audioEl.playbackRate = newRate
    setPlaybackRate(newRate)
  }, [])

  const setVolume = useCallback((newVolume: number) => {
    const audioEl = audioRef.current
    const clamped = Math.max(0, Math.min(1, newVolume))
    if (audioEl) {
      audioEl.volume = clamped
      if (clamped > 0 && isMuted) {
        audioEl.muted = false
        setIsMuted(false)
      }
    }
    setVolumeState(clamped)
  }, [isMuted])

  const toggleMute = useCallback(() => {
    const audioEl = audioRef.current
    if (!audioEl) return
    const nextMute = !isMuted
    audioEl.muted = nextMute
    setIsMuted(nextMute)
  }, [isMuted])

  const closePlayer = useCallback(() => {
    const audioEl = audioRef.current
    if (audioEl) {
      audioEl.pause()
      audioEl.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentAudio(null)
    setCurrentLabel(null)
    setCurrentTime(0)
  }, [])

  const nextAudio = getNextAudio(currentAudio)
  const playNext = useCallback(async () => {
    const nextItem = getNextAudio(currentAudio)
    if (!nextItem) return
    await playAudio(nextItem.audio, nextItem.label)
  }, [currentAudio, getNextAudio, playAudio])

  return (
    <ReadingAudioContext.Provider
      value={{
        currentAudio,
        currentLabel,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        isMuted,
        playAudio,
        pauseAudio,
        toggleAudio,
        seek,
        setSpeed,
        setVolume,
        toggleMute,
        closePlayer,
        nextAudio,
        playNext,
      }}
    >
      {children}
    </ReadingAudioContext.Provider>
  )
}

export function useReadingAudio() {
  const context = useContext(ReadingAudioContext)
  if (!context) {
    throw new Error("useReadingAudio must be used within a ReadingAudioProvider")
  }
  return context
}
