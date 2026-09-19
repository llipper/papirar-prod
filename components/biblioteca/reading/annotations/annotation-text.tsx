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
import type {
  LawAnnotation,
  LawHighlight,
} from "@/lib/biblioteca/law-user-content-service"

export function AnnotationText({
  text,
  note,
  className,
  onSave,
}: {
  text: string
  note: string
  className: string
  onSave: (note: string) => Promise<void>
}) {
  const [draft, setDraft] = useState(note)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraft(note)
    setOpen(nextOpen)
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
            event.currentTarget.style.setProperty(
              "--annotation-x",
              `${event.clientX}px`
            )
            event.currentTarget.style.setProperty(
              "--annotation-y",
              `${Math.max(96, event.clientY)}px`
            )
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
              className="pointer-events-none fixed z-40 hidden w-64 max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-xl border bg-popover p-3 text-left font-sans text-xs leading-5 text-popover-foreground shadow-xl group-hover:block"
              style={{
                left: "var(--annotation-x)",
                top: "var(--annotation-y)",
              }}
            >
              <span className="mb-1 block text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                Anotação
              </span>
              {note}
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-72 rounded-2xl p-3"
      >
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">
              Anotação
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique para editar este lembrete.
            </p>
          </div>
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={5000}
            className="min-h-20 resize-none rounded-xl text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving || !draft.trim()}
              onClick={handleSave}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
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
      start: item.startOffset,
      end: item.endOffset,
      note: item.note,
      className: "border-b-2 border-dashed border-primary/70",
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
