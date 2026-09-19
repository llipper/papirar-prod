"use client"

import React, { useMemo, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { LoaderCircle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"
import { useReadingScrollProgress } from "@/lib/biblioteca/use-reading-scroll"
import { useReadingData } from "@/lib/biblioteca/hooks/use-reading-data"
import { useReadingSelection } from "@/lib/biblioteca/hooks/use-reading-selection"
import { useReadingAnnotations } from "@/lib/biblioteca/hooks/use-reading-annotations"

import { ReadingDashboardLayout } from "./reading-dashboard-layout"
import { articleHeading } from "./node/reading-node-utils"
import { ReadingNodeView } from "./node/reading-node-view"
import { ReadingAnnexView } from "./node/reading-annex-view"
import { ReadingIndexSheet } from "./index/reading-index-sheet"
import { ReadingSelectionMenu } from "./annotations/reading-selection-menu"
import { ReadingAnnotationDialog } from "./annotations/reading-annotation-dialog"

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
    noteDraft,
    setNoteDraft,
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

  const readingPresentation = book?.readingPresentation

  return (
    <ReadingDashboardLayout
      reading={reading}
      isIndexOpen={isIndexOpen}
      onIndexOpenChange={setIsIndexOpen}
      readingProgress={readingProgress}
    >
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
                />
              </div>
            ))}
          </article>
          {(reading.annexes ?? []).map((annex) => (
            <ReadingAnnexView key={annex.annexKey} annex={annex} />
          ))}
        </div>
      </main>

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
            noteDraft={noteDraft}
            onNoteDraftChange={setNoteDraft}
            isSavingContent={isSavingContent}
            onSave={saveAnnotation}
            selectedText={selection?.selectedText}
            nodeLocation={nodeLocation}
            onClearSelection={clearTextSelection}
          />
        )
      })()}
    </ReadingDashboardLayout>
  )
}
