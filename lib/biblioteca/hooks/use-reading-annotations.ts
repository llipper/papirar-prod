"use client"

import { useEffect, useRef, useState } from "react"
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
} from "@/lib/biblioteca/law-user-content-service"
import type { TextSelection } from "./use-reading-selection"

export interface UseReadingAnnotationsProps {
  reading: LawReading | null
  selection: TextSelection | null
  clearTextSelection: () => void
}

function getCacheKey(reading: LawReading): string {
  return `papirar:law-content:${reading.lawId}:${reading.versionId}`
}

function readLocalUserContent(reading: LawReading): {
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
} | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(getCacheKey(reading))
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
    window.localStorage.setItem(getCacheKey(reading), JSON.stringify(data))
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
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
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

  // 3. SALVAR ANOTAÇÃO: 100% Otimista (0ms na tela) + Sync em Background
  const saveAnnotation = async () => {
    const activeSelection = selectionRef.current ?? selection
    if (!reading || !activeSelection || !noteDraft.trim()) return

    const tempId = `temp-note-${Date.now()}`
    const noteText = noteDraft.trim()
    const optimisticAnnotation: LawAnnotation = {
      id: tempId,
      nodeKey: activeSelection.nodeKey,
      selectedText: activeSelection.selectedText,
      startOffset: activeSelection.startOffset,
      endOffset: activeSelection.endOffset,
      note: noteText,
    }

    // Atualização imediata local
    setAnnotations((current) => [...current, optimisticAnnotation])
    setNoteDraft("")
    setIsNoteOpen(false)
    clearTextSelection()

    // Sincronização em background
    setIsSavingContent(true)
    try {
      const saved = await createLawAnnotation(reading, {
        nodeKey: activeSelection.nodeKey,
        selectedText: activeSelection.selectedText,
        startOffset: activeSelection.startOffset,
        endOffset: activeSelection.endOffset,
        note: noteText,
      })
      if (saved) {
        setAnnotations((current) =>
          current.map((item) => (item.id === tempId ? saved : item))
        )
      }
    } catch (err) {
      console.warn(
        "[Papirar] Anotação mantida localmente, sincronização remota falhou:",
        err
      )
    } finally {
      setIsSavingContent(false)
    }
  }

  const updateAnnotation = async (annotationId: string, note: string) => {
    if (!note.trim()) return
    // Atualização local imediata
    setAnnotations((current) =>
      current.map((item) =>
        item.id === annotationId ? { ...item, note: note.trim() } : item
      )
    )

    setIsSavingContent(true)
    try {
      await updateLawAnnotation(annotationId, note)
    } catch (err) {
      console.warn("[Papirar] Erro ao sincronizar edição da anotação:", err)
    } finally {
      setIsSavingContent(false)
    }
  }

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
    isNoteOpen,
    setIsNoteOpen,
    noteDraft,
    setNoteDraft,
    isSavingContent,
    saveHighlight,
    saveAnnotation,
    updateAnnotation,
    removeHighlight,
    selectionHasHighlight,
  }
}
