"use client"

import { useEffect, useMemo, useState } from "react"
import {
  bibliotecaBooks,
  type BibliotecaBook,
} from "@/lib/biblioteca/catalog-data"
import {
  LAW_READING_INVALIDATED_EVENT,
  LAW_READING_UPDATED_EVENT,
  loadLawReading,
  type LawReadingInvalidation,
  type LawReading,
  type LawReadingUpdate,
} from "@/lib/biblioteca/reading-service"
import { useAuthUser } from "@/lib/auth/use-auth-user"

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
  const authUser = useAuthUser()
  const authUid = authUser?.uid ?? null

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
      const update = (event as CustomEvent<LawReadingUpdate>).detail
      if (
        !update ||
        update.authUid !== authUid ||
        update.reading.lawId !== book.lawId ||
        cancelled
      ) {
        return
      }
      setReading(update.reading)
    }

    window.addEventListener(LAW_READING_UPDATED_EVENT, handleBackgroundUpdate)

    const handleInvalidation = (event: Event) => {
      const invalidation = (event as CustomEvent<LawReadingInvalidation>).detail
      if (!invalidation || invalidation.lawId !== book.lawId || cancelled) return

      // loadLawReading passa a buscar a versão remota porque a entrada local
      // da obra já foi invalidada. A leitura atual fica visível enquanto carrega.
      void loadLawReading(book)
        .then((value) => {
          if (!cancelled) setReading(value)
        })
        .catch((reason: unknown) => {
          if (!cancelled) setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a lei.")
        })
    }

    window.addEventListener(LAW_READING_INVALIDATED_EVENT, handleInvalidation)

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
      window.removeEventListener(LAW_READING_INVALIDATED_EVENT, handleInvalidation)
    }
  }, [authUid, book, initialNodeKey, initialSelectedText])

  return {
    book,
    reading,
    setReading,
    error,
    setError,
  }
}
