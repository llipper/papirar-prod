"use client"

import React, { useState } from "react"
import type { CSSProperties, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { annotationTypeLabels } from "@/lib/biblioteca/law-user-content-service"
import type { LawAnnotation, LawHighlight } from "@/lib/biblioteca/law-user-content-service"
import { AnnotationNoteContent } from "./annotation-note-content"

export const READING_ANNOTATION_VIEW_EVENT = "papirar:open-annotation-panel"

export function openReadingAnnotationPanel(annotationId: string) {
  window.dispatchEvent(
    new CustomEvent<string>(READING_ANNOTATION_VIEW_EVENT, {
      detail: annotationId,
    })
  )
}

export function AnnotationText({
  text,
  note,
  annotation,
  className,
  onSave,
}: {
  text: string
  note: string
  annotation: LawAnnotation
  className: string
  onSave: (note: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(note)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewPosition, setPreviewPosition] = useState<{
    top: number
    left: number
  } | null>(null)
  const isLongNote = note.length > 220
  const accentClass =
    annotation.color === "red"
      ? "bg-red-400"
      : annotation.color === "blue"
        ? "bg-blue-400"
        : annotation.color === "green"
          ? "bg-emerald-400"
          : annotation.color === "purple"
            ? "bg-purple-400"
            : annotation.color === "gray"
              ? "bg-slate-400"
              : "bg-amber-400"

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setDraft(note)
      setEditing(false)
    }
    setOpen(nextOpen)
  }

  const positionPreview = (target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const width = 320
    const gap = 14
    const canShowRight = window.innerWidth - rect.right >= width + gap
    const canShowLeft = rect.left >= width + gap
    const left = canShowRight
      ? rect.right + gap
      : canShowLeft
        ? rect.left - width - gap
        : Math.max(12, Math.min(window.innerWidth - width - 12, rect.left))
    const top = Math.max(12, Math.min(window.innerHeight - 180, rect.top - 10))
    setPreviewPosition({ top, left })
  }

  const handleSave = async () => {
    if (!draft.trim()) return
    setSaving(true)
    try {
      await onSave(draft)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label="Abrir anotação"
          className={`group font-inherit leading-inherit relative inline cursor-help align-baseline text-inherit ${className}`}
          style={
            {
              "--annotation-x": "0px",
              "--annotation-y": "0px",
            } as CSSProperties
          }
          onMouseMove={(event) => {
            if (!previewPosition) positionPreview(event.currentTarget)
          }}
          onMouseLeave={() => {
            setPreviewPosition(null)
          }}
          onFocus={(event) => {
            positionPreview(event.currentTarget)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault()
              event.currentTarget.click()
            }
          }}
        >
          {text}
          {!open && (
            <span
              className="fixed z-40 hidden w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border/80 bg-popover p-3 text-left font-sans text-xs leading-5 text-popover-foreground shadow-lg group-hover:block group-focus:block"
              style={{
                left: `${previewPosition?.left ?? -9999}px`,
                top: `${previewPosition?.top ?? -9999}px`,
              }}
            >
              <span className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${accentClass}`} />
                <span className="text-[11px] font-semibold text-foreground">Minha anotação</span>
              </span>
              <span className={`mt-2 block text-foreground ${isLongNote ? "max-h-24 overflow-hidden" : ""}`}>
                <AnnotationNoteContent note={note} />
              </span>
              <span className="mt-2 flex items-center justify-between gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{annotationTypeLabels[annotation.type]}</span>
                {isLongNote ? (
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-primary hover:underline"
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      openReadingAnnotationPanel(annotation.id)
                    }}
                  >
                    Ver completo
                  </button>
                ) : null}
              </span>
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-72 rounded-2xl p-3"
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${accentClass}`} />
              <p className="text-sm font-semibold">Minha anotação</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
              <span className="rounded-full bg-muted px-1.5 py-0.5">{annotationTypeLabels[annotation.type]}</span>
              {annotation.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5">#{tag}</span>)}
              {annotation.reminderAt && <span className="rounded-full bg-muted px-1.5 py-0.5">Lembrete: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(annotation.reminderAt))}</span>}
            </div>
          </div>
          {editing ? (
            <>
              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={5000}
                className="min-h-24 resize-none rounded-xl text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" disabled={saving || !draft.trim()} onClick={handleSave}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <AnnotationNoteContent note={note} className="text-sm leading-6" />
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                  Editar anotação
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function renderMarkedText(
  text: string,
  highlights: LawHighlight[],
  annotations: LawAnnotation[],
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
): ReactNode {
  const highlightClass = (item: LawHighlight) => {
    const colorClass =
      item.color === "red"
        ? "red"
        : item.color === "blue"
          ? "blue"
          : item.color === "green"
            ? "emerald"
            : item.color === "purple"
              ? "purple"
              : item.color === "orange"
                ? "orange"
                : item.color === "beige"
                  ? "amber"
                  : "amber"

    if (item.style === "underline") {
      return colorClass === "red"
        ? "underline decoration-2 underline-offset-4 decoration-red-500"
        : colorClass === "blue"
          ? "underline decoration-2 underline-offset-4 decoration-blue-500"
          : colorClass === "emerald"
            ? "underline decoration-2 underline-offset-4 decoration-emerald-500"
            : colorClass === "purple"
              ? "underline decoration-2 underline-offset-4 decoration-purple-500"
              : colorClass === "orange"
                ? "underline decoration-2 underline-offset-4 decoration-orange-500"
                : "underline decoration-2 underline-offset-4 decoration-amber-500"
    }

    return colorClass === "red"
      ? "bg-red-100 dark:bg-red-500/30 decoration-red-500"
      : colorClass === "blue"
        ? "bg-blue-100 dark:bg-blue-500/30 decoration-blue-500"
        : colorClass === "emerald"
          ? "bg-emerald-100 dark:bg-emerald-500/30 decoration-emerald-500"
          : colorClass === "purple"
            ? "bg-purple-100 dark:bg-purple-500/30 decoration-purple-500"
            : colorClass === "orange"
              ? "bg-orange-100 dark:bg-orange-500/30 decoration-orange-500"
              : item.color === "beige"
                ? "bg-amber-50 dark:bg-amber-200/20 decoration-amber-400"
                : "bg-amber-100 dark:bg-amber-500/30 decoration-amber-500"
  }

  const annotationClass = (item: LawAnnotation) => {
    const color = item.color === "red" ? "red" : item.color === "blue" ? "blue" : item.color === "green" ? "emerald" : item.color === "purple" ? "purple" : item.color === "gray" ? "slate" : "amber"
    return color === "red" ? "border-red-400" : color === "blue" ? "border-blue-400" : color === "emerald" ? "border-emerald-400" : color === "purple" ? "border-purple-400" : color === "slate" ? "border-slate-400" : "border-amber-400"
  }

  const marks = [
    ...highlights.map((item) => ({
      type: "highlight" as const,
      start: item.startOffset,
      end: item.endOffset,
      className: highlightClass(item),
    })),
    ...annotations.map((item) => ({
      type: "annotation" as const,
      id: item.id,
      annotation: item,
      start: item.startOffset,
      end: item.endOffset,
      note: item.note,
      className: `border-b-2 border-dashed ${annotationClass(item)}`,
    })),
  ]
    .filter(
      (item) =>
        item.start >= 0 && item.end > item.start && item.start < text.length
    )
    .sort((a, b) => a.start - b.start)

  if (marks.length === 0) return text

  const output: ReactNode[] = []
  let cursor = 0
  marks.forEach((mark, index) => {
    const start = Math.max(cursor, Math.min(mark.start, text.length))
    const end = Math.max(start, Math.min(mark.end, text.length))
    if (start > cursor) output.push(text.slice(cursor, start))
    if (end > start) {
      output.push(
        <span key={`${start}-${end}-${index}`} className="inline">
          {mark.type === "highlight" ? (
            <mark
              className={`rounded-md box-decoration-clone px-1 py-0.5 underline decoration-2 underline-offset-4 cursor-pointer transition-opacity hover:opacity-85 ${mark.className}`}
              title="Clique para desmarcar ou editar destaque"
              onClick={(e) => {
                const target = e.currentTarget
                const sel = window.getSelection()
                if (sel) {
                  const range = document.createRange()
                  range.selectNodeContents(target)
                  sel.removeAllRanges()
                  sel.addRange(range)
                }
              }}
            >
              {text.slice(start, end)}
            </mark>
          ) : (
            <AnnotationText
              text={text.slice(start, end)}
              note={mark.note}
              annotation={mark.annotation}
              className={mark.className}
              onSave={(note) => onAnnotationUpdated(mark.id, note)}
            />
          )}
        </span>
      )
      cursor = end
    }
  })
  if (cursor < text.length) output.push(text.slice(cursor))
  return output
}
