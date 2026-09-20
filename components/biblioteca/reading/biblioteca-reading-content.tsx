"use client"

import React, { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { LoaderCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"
import { useReadingScrollProgress } from "@/lib/biblioteca/use-reading-scroll"
import { useReadingData } from "@/lib/biblioteca/hooks/use-reading-data"
import { useReadingSelection } from "@/lib/biblioteca/hooks/use-reading-selection"
import { useReadingAnnotations } from "@/lib/biblioteca/hooks/use-reading-annotations"

import { ReadingDashboardLayout } from "./reading-dashboard-layout"
import type { ReadingFontScale } from "./reading-dashboard-header"
import type { ReadingAudioQueueItem } from "@/lib/biblioteca/reading-audio-context"
import { articleHeading } from "./node/reading-node-utils"
import { ReadingNodeView } from "./node/reading-node-view"
import { ReadingAnnexView } from "./node/reading-annex-view"
import { ReadingIndexSheet } from "./index/reading-index-sheet"
import { ReadingSelectionMenu } from "./annotations/reading-selection-menu"
import { ReadingAnnotationDialog } from "./annotations/reading-annotation-dialog"
import {
  READING_ANNOTATION_VIEW_EVENT,
} from "./annotations/annotation-text"
import { ReadingAnnotationsPanel } from "./annotations/reading-annotations-panel"

export interface BibliotecaReadingContentProps {
  bookId: string
  initialNodeKey?: string
  initialSelectedText?: string
  adminBanner?: ReactNode
  adminNodeActions?: (node: ReadingNode) => ReactNode
}

export function BibliotecaReadingContent({
  bookId,
  initialNodeKey,
  initialSelectedText,
  adminBanner,
  adminNodeActions,
}: BibliotecaReadingContentProps) {
  const { book, reading, error } = useReadingData({
    bookId,
    initialNodeKey,
    initialSelectedText,
  })

  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const [fontScale, setFontScale] = useState<ReadingFontScale>("default")
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(false)
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const readingContainerRef = useRef<HTMLElement>(null)
  const readingProgress = useReadingScrollProgress(
    readingContainerRef,
    reading !== null
  )

  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const { selection, clearTextSelection, handleTextSelection } =
    useReadingSelection(isNoteOpen)

  const {
    highlights,
    annotations,
    isSavingContent,
    saveHighlight,
    saveAnnotation,
    updateAnnotation,
    removeHighlight,
    selectionHasHighlight,
  } = useReadingAnnotations({
    reading,
    selection,
    clearTextSelection,
  })

  const EMPTY_HIGHLIGHTS = useMemo<typeof highlights>(() => [], [])
  const EMPTY_ANNOTATIONS = useMemo<typeof annotations>(() => [], [])

  const highlightsByNodeKey = useMemo(() => {
    const map = new Map<string, typeof highlights>()
    for (const h of highlights) {
      const list = map.get(h.nodeKey)
      if (list) list.push(h)
      else map.set(h.nodeKey, [h])
    }
    return map
  }, [highlights])

  const annotationsByNodeKey = useMemo(() => {
    const map = new Map<string, typeof annotations>()
    for (const a of annotations) {
      const list = map.get(a.nodeKey)
      if (list) list.push(a)
      else map.set(a.nodeKey, [a])
    }
    return map
  }, [annotations])

  const readingPresentation = book?.readingPresentation
  const audioQueue = useMemo<ReadingAudioQueueItem[]>(
    () =>
      (reading?.nodes ?? [])
        .filter((node) => node.audio)
        .map((node) => ({
          audio: node.audio!,
          label: articleHeading(node, readingPresentation),
          sortOrder: node.sortOrder,
        })),
    [reading?.nodes, readingPresentation]
  )

  useEffect(() => {
    const openAnnotationPanel = (event: Event) => {
      const annotationId = (event as CustomEvent<string>).detail
      if (!annotationId) return
      setSelectedAnnotationId(annotationId)
      setIsAnnotationsOpen(true)
    }

    window.addEventListener(READING_ANNOTATION_VIEW_EVENT, openAnnotationPanel)
    return () => {
      window.removeEventListener(
        READING_ANNOTATION_VIEW_EVENT,
        openAnnotationPanel
      )
    }
  }, [])

  if (error) {
    return (
      <ReadingDashboardLayout>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RotateCcw /> Tentar novamente
              </Button>
              <Button asChild>
                <Link href="/dashboard/biblioteca">Voltar</Link>
              </Button>
            </div>
          </div>
        </div>
      </ReadingDashboardLayout>
    )
  }

  if (!reading) {
    return (
      <ReadingDashboardLayout>
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <LoaderCircle className="size-6 animate-spin" />
        </div>
      </ReadingDashboardLayout>
    )
  }

  return (
    <ReadingDashboardLayout
      reading={reading}
      isIndexOpen={isIndexOpen}
      onIndexOpenChange={setIsIndexOpen}
      readingProgress={readingProgress}
      fontScale={fontScale}
      onFontScaleChange={setFontScale}
      audioQueue={audioQueue}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main
        ref={readingContainerRef}
        onContextMenu={(event) => {
          if (window.getSelection()?.toString().trim()) {
            event.preventDefault()
            handleTextSelection({
              top: event.clientY + 4,
              left: event.clientX + 4,
            })
          }
        }}
        onMouseUp={(event) => {
          if (event.button !== 0) return
          if (window.getSelection()?.toString().trim()) {
            handleTextSelection({
              top: event.clientY,
              left: event.clientX,
            })
          }
        }}
        onTouchEnd={(event) => {
          if (window.getSelection()?.toString().trim()) {
            const touch = event.changedTouches?.[0]
            handleTextSelection(
              touch ? { top: touch.clientY, left: touch.clientX } : undefined
            )
          }
        }}
        className="min-w-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain scroll-smooth select-text"
      >
        <div className="mx-auto w-full max-w-3xl px-5 pt-10 pb-32 sm:px-8 sm:pb-36">
          <div className="space-y-1 pb-10 text-center">
            <p className="text-xs font-bold tracking-[0.16em] text-muted-foreground uppercase">
              Lei Seca
            </p>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">
              {reading.title}
            </h2>
          </div>
          {adminBanner ? <div className="mb-8">{adminBanner}</div> : null}
          <article className="space-y-7">
            {reading.nodes.map((node) => (
              <div
                key={`${node.nodeKey}-${node.sortOrder}`}
                id={`node-${node.nodeKey}`}
                data-node-key={node.nodeKey}
              >
                {adminNodeActions ? (
                  <div className="mb-1 flex justify-end gap-1">
                    {adminNodeActions(node)}
                  </div>
                ) : null}
                <ReadingNodeView
                  node={node}
                  readingPresentation={readingPresentation}
                  highlights={
                    highlightsByNodeKey.get(node.nodeKey) ?? EMPTY_HIGHLIGHTS
                  }
                  annotations={
                    annotationsByNodeKey.get(node.nodeKey) ?? EMPTY_ANNOTATIONS
                  }
                  onAnnotationUpdated={updateAnnotation}
                  fontScale={fontScale}
                />
              </div>
            ))}
          </article>
          {(reading.annexes ?? []).map((annex) => (
            <ReadingAnnexView key={annex.annexKey} annex={annex} />
          ))}
        </div>
        </main>

        {isAnnotationsOpen ? (
          <ReadingAnnotationsPanel
            annotations={annotations}
            selectedAnnotationId={selectedAnnotationId}
            onClose={() => setIsAnnotationsOpen(false)}
          />
        ) : null}
      </div>

      <ReadingIndexSheet
        reading={reading}
        readingPresentation={readingPresentation}
        open={isIndexOpen}
        onOpenChange={setIsIndexOpen}
      />

      {selection && (
        <ReadingSelectionMenu
          selection={selection}
          isSavingContent={isSavingContent}
          selectionHasHighlight={selectionHasHighlight}
          onAnnotate={() => setIsNoteOpen(true)}
          onHighlight={saveHighlight}
          onRemoveHighlight={(sel) => removeHighlight(sel)}
          onCancel={clearTextSelection}
          containerRef={readingContainerRef}
        />
      )}

      {(() => {
        const selectedNode = selection
          ? reading.nodes.find((node) => node.nodeKey === selection.nodeKey)
          : null
        const nodeLocation = selectedNode
          ? `${articleHeading(selectedNode, readingPresentation)} • ${reading.title}`
          : reading?.title

        return (
          <ReadingAnnotationDialog
            open={isNoteOpen}
            onOpenChange={setIsNoteOpen}
            isSavingContent={isSavingContent}
            onSave={async (note, details) => {
              await saveAnnotation(note, details)
              setIsNoteOpen(false)
            }}
            selectedText={selection?.selectedText}
            nodeLocation={nodeLocation}
            onClearSelection={clearTextSelection}
          />
        )
      })()}
    </ReadingDashboardLayout>
  )
}
