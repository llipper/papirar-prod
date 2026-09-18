"use client"

import { useEffect, useMemo, useState } from "react"
import {
  bibliotecaBooks,
  type BibliotecaBook,
} from "@/lib/biblioteca/catalog-data"
import {
  LAW_READING_UPDATED_EVENT,
  loadLawReading,
  type LawReading,
} from "@/lib/biblioteca/reading-service"

export interface UseReadingDataProps {
  bookId: string
  initialNodeKey?: string
  initialSelectedText?: string
}

export interface UseReadingDataReturn {
  book: BibliotecaBook | undefined
  reading: LawReading | null
  setReading: React.Dispatch<React.SetStateAction<LawReading | null>>
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
}

export function useReadingData({
  bookId,
  initialNodeKey,
  initialSelectedText,
}: UseReadingDataProps): UseReadingDataReturn {
  const book = useMemo(
    () => bibliotecaBooks.find((item) => item.id === bookId),
    [bookId]
  )
  const [reading, setReading] = useState<LawReading | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    if (!book) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Obra não encontrada.")
      return
    }

    setReading(null)
    setError(null)

    const handleBackgroundUpdate = (event: Event) => {
      const updatedReading = (event as CustomEvent<LawReading>).detail
      if (!updatedReading || updatedReading.lawId !== book.lawId || cancelled) {
        return
      }
      setReading(updatedReading)
    }

    window.addEventListener(LAW_READING_UPDATED_EVENT, handleBackgroundUpdate)

    loadLawReading(book)
      .then((value) => {
        if (cancelled) return
        setReading(value)

        if (initialNodeKey || initialSelectedText) {
          window.setTimeout(() => {
            const target = initialNodeKey
              ? document.getElementById(`node-${initialNodeKey}`)
              : value.nodes
                  .filter((node) => node.text)
                  .find((node) =>
                    node.text
                      ?.toLocaleLowerCase()
                      .includes(initialSelectedText?.toLocaleLowerCase() ?? "")
                  )

            const targetElement =
              target instanceof HTMLElement
                ? target
                : target
                  ? document.getElementById(`node-${target.nodeKey}`)
                  : null

            targetElement?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            })
          }, 250)
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a lei."
          )
        }
      })

    return () => {
      cancelled = true
      window.removeEventListener(
        LAW_READING_UPDATED_EVENT,
        handleBackgroundUpdate
      )
    }
  }, [book, initialNodeKey, initialSelectedText])

  return {
    book,
    reading,
    setReading,
    error,
    setError,
  }
}
