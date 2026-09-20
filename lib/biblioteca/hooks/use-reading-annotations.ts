"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { firebaseAuth } from "@/lib/firebase/client"
import type { LawReading } from "@/lib/biblioteca/reading-service"
import {
  createLawAnnotation,
  createLawHighlight,
  loadLawUserContent,
  removeLawHighlights,
  updateLawAnnotation,
  type LawAnnotation,
  type LawHighlight,
  type LawHighlightColor,
  type LawHighlightStyle,
  type AnnotationDetails,
} from "@/lib/biblioteca/law-user-content-service"
import type { TextSelection } from "./use-reading-selection"

export interface UseReadingAnnotationsProps {
  reading: LawReading | null
  selection: TextSelection | null
  clearTextSelection: () => void
}

function getCacheKey(reading: LawReading): string | null {
  const uid = firebaseAuth.currentUser?.uid
  return uid ? `papirar:law-content:${uid}:${reading.lawId}:${reading.versionId}` : null
}

function readLocalUserContent(reading: LawReading): {
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
} | null {
  if (typeof window === "undefined") return null
  try {
    const key = getCacheKey(reading)
    if (!key) return null
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const cached = JSON.parse(raw) as {
      highlights?: Array<Omit<LawHighlight, "style"> & { style?: unknown }>
      annotations?: LawAnnotation[]
    }
    return {
      highlights: Array.isArray(cached.highlights)
        ? cached.highlights.map((item): LawHighlight => ({
            ...item,
            style: item.style === "underline" ? "underline" : "highlight",
          }))
        : [],
      annotations: Array.isArray(cached.annotations) ? cached.annotations : [],
    }
  } catch {
    return null
  }
}

function writeLocalUserContent(
  reading: LawReading,
  data: { highlights: LawHighlight[]; annotations: LawAnnotation[] }
) {
  if (typeof window === "undefined") return
  try {
    const key = getCacheKey(reading)
    if (!key) return
    window.localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // quota ou modo restrito
  }
}

export function useReadingAnnotations({
  reading,
  selection,
  clearTextSelection,
}: UseReadingAnnotationsProps) {
  const [highlights, setHighlights] = useState<LawHighlight[]>([])
  const [annotations, setAnnotations] = useState<LawAnnotation[]>([])
  const [isSavingContent, setIsSavingContent] = useState(false)

  const selectionRef = useRef<TextSelection | null>(selection)
  selectionRef.current = selection

  // Carga inicial com Cache First (0ms) + SWR em segundo plano
  useEffect(() => {
    let cancelled = false
    if (!reading) {
      setHighlights([])
      setAnnotations([])
      return
    }

    // 1. Carrega imediatamente do cache local para renderização instantânea (0ms)
    const cached = readLocalUserContent(reading)
    if (cached) {
      setHighlights(cached.highlights)
      setAnnotations(cached.annotations)
    }

    // 2. Revalida em segundo plano a partir da API D1
    loadLawUserContent(reading)
      .then((content) => {
        if (!cancelled) {
          setHighlights(content.highlights)
          setAnnotations(content.annotations)
          writeLocalUserContent(reading, content)
        }
      })
      .catch((reason: unknown) => {
        console.error(
          "[Papirar][Conteúdo do usuário] não foi possível sincronizar da nuvem:",
          reason
        )
      })

    return () => {
      cancelled = true
    }
  }, [reading])

  // Salva no cache local sempre que houver alterações locais
  useEffect(() => {
    if (!reading) return
    writeLocalUserContent(reading, { highlights, annotations })
  }, [reading, highlights, annotations])

  // 1. SALVAR DESTAQUE: 100% Otimista (0ms na tela) + Sync em Background
  const saveHighlight = async (color: LawHighlightColor, style: LawHighlightStyle = "highlight") => {
    const activeSelection = selectionRef.current ?? selection
    if (!reading || !activeSelection) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const optimisticHighlight: LawHighlight = {
      id: tempId,
      nodeKey: activeSelection.nodeKey,
      selectedText: activeSelection.selectedText,
      startOffset: activeSelection.startOffset,
      endOffset: activeSelection.endOffset,
      color,
      style,
    }

    // Atualização imediata do React state (0ms)
    setHighlights((current) => [...current, optimisticHighlight])
    clearTextSelection()

    // Sincronização em background no servidor
    setIsSavingContent(true)
    try {
      const saved = await createLawHighlight(reading, {
        nodeKey: activeSelection.nodeKey,
        selectedText: activeSelection.selectedText,
        startOffset: activeSelection.startOffset,
        endOffset: activeSelection.endOffset,
        color,
        style,
      })
      if (saved) {
        setHighlights((current) =>
          current.map((item) => (item.id === tempId ? saved : item))
        )
      }
    } catch (err) {
      console.warn(
        "[Papirar] Destaque mantido localmente, sincronização remota falhou:",
        err
      )
    } finally {
      setIsSavingContent(false)
    }
  }

  // 2. REMOVER DESTAQUE: 100% Otimista (0ms na tela) + Sync em Background
  const removeHighlight = async (overrideSelection?: TextSelection) => {
    // overrideSelection tem prioridade absoluta (snapshot capturado no clique)
    // Só cai no selectionRef como último recurso (seleção clicada em mark)
    const activeSelection = overrideSelection ?? selectionRef.current
    if (!reading || !activeSelection) return

    const targetNodeKey = activeSelection.nodeKey
    const targetStart = activeSelection.startOffset
    const targetEnd = activeSelection.endOffset
    const targetText = activeSelection.selectedText

    const isMatch = (item: LawHighlight) =>
      item.nodeKey === targetNodeKey &&
      (Math.max(item.startOffset, targetStart) < Math.min(item.endOffset, targetEnd) ||
        Boolean(
          targetText &&
            (item.selectedText.includes(targetText) ||
              targetText.includes(item.selectedText))
        ))

    const snapshot = highlights

    // Atualização imediata do React state (0ms - desmarca instantaneamente na tela)
    setHighlights((current) => current.filter((item) => !isMatch(item)))
    clearTextSelection()

    // Sincronização em background no servidor
    setIsSavingContent(true)
    try {
      const remaining = await removeLawHighlights(
        reading,
        activeSelection,
        snapshot
      )
      if (remaining && remaining.length > 0) {
        setHighlights((current) => [
          ...current.filter((item) => !isMatch(item)),
          ...remaining,
        ])
      }
    } catch (err) {
      console.warn(
        "[Papirar] Remoção mantida localmente, sincronização remota falhou:",
        err
      )
    } finally {
      setIsSavingContent(false)
    }
  }

  // 3. Salva somente após confirmação remota: evita apresentar como persistido algo que falhou.
  const saveAnnotation = async (note: string, details: AnnotationDetails) => {
    const activeSelection = selectionRef.current ?? selection
    if (!reading || !activeSelection || !note.trim()) {
      throw new Error("Selecione um trecho e escreva a anotação antes de salvar.")
    }

    const noteText = note.trim()
    setIsSavingContent(true)
    try {
      const saved = await createLawAnnotation(reading, {
        nodeKey: activeSelection.nodeKey,
        selectedText: activeSelection.selectedText,
        startOffset: activeSelection.startOffset,
        endOffset: activeSelection.endOffset,
        note: noteText,
        ...details,
      })
      setAnnotations((current) => [...current, saved])
      clearTextSelection()
    } finally {
      setIsSavingContent(false)
    }
  }

  const updateAnnotation = useCallback(async (annotationId: string, note: string) => {
    if (!note.trim()) return
    setIsSavingContent(true)
    try {
      await updateLawAnnotation(annotationId, note)
      setAnnotations((current) =>
        current.map((item) =>
          item.id === annotationId ? { ...item, note: note.trim() } : item
        )
      )
    } finally {
      setIsSavingContent(false)
    }
  }, [])

  const selectionHasHighlight = selection
    ? highlights.some(
        (item) =>
          item.nodeKey === selection.nodeKey &&
          (Math.max(item.startOffset, selection.startOffset) <
            Math.min(item.endOffset, selection.endOffset) ||
            Boolean(
              selection.selectedText &&
                (item.selectedText.includes(selection.selectedText) ||
                  selection.selectedText.includes(item.selectedText))
            ))
      )
    : false

  return {
    highlights,
    setHighlights,
    annotations,
    setAnnotations,
    isSavingContent,
    saveHighlight,
    saveAnnotation,
    updateAnnotation,
    removeHighlight,
    selectionHasHighlight,
  }
}
