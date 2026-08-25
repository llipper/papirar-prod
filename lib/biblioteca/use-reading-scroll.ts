"use client"

import { useEffect, useState, type RefObject } from "react"

export function useReadingScrollProgress(
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean
) {
  const [progress, setProgress] = useState(1)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !enabled) return

    let frameId: number | null = null

    const measure = () => {
      frameId = null
      const scrollableHeight = container.scrollHeight - container.clientHeight
      if (scrollableHeight <= 0) {
        setProgress(100)
        return
      }

      const ratio = container.scrollTop / scrollableHeight
      setProgress(Math.min(100, Math.max(1, Math.round(1 + ratio * 99))))
    }

    const scheduleMeasure = () => {
      if (frameId !== null) return
      frameId = window.requestAnimationFrame(measure)
    }

    measure()
    container.addEventListener("scroll", scheduleMeasure, { passive: true })
    window.addEventListener("resize", scheduleMeasure, { passive: true })

    return () => {
      container.removeEventListener("scroll", scheduleMeasure)
      window.removeEventListener("resize", scheduleMeasure)
      if (frameId !== null) window.cancelAnimationFrame(frameId)
    }
  }, [containerRef, enabled])

  return progress
}
