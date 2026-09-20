"use client"

import { BookMarked, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { annotationTypeLabels } from "@/lib/biblioteca/law-user-content-service"
import type { LawAnnotation } from "@/lib/biblioteca/law-user-content-service"
import { AnnotationNoteContent } from "./annotation-note-content"

const accentClasses = {
  yellow: "bg-amber-400",
  red: "bg-red-400",
  blue: "bg-blue-400",
  green: "bg-emerald-400",
  purple: "bg-purple-400",
  gray: "bg-slate-400",
} as const

export function ReadingAnnotationsPanel({
  annotations,
  selectedAnnotationId,
  onClose,
}: {
  annotations: LawAnnotation[]
  selectedAnnotationId: string | null
  onClose: () => void
}) {
  const selected =
    annotations.find((annotation) => annotation.id === selectedAnnotationId) ??
    annotations[0]

  return (
    <aside aria-label="Painel de anotações" className="hidden h-full min-h-0 w-[340px] shrink-0 flex-col overflow-hidden border-l bg-background xl:flex">
        <header className="shrink-0 border-b px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <BookMarked className="size-4" /> Anotações
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {annotations.length} {annotations.length === 1 ? "anotação salva" : "anotações salvas"}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-8" onClick={onClose} aria-label="Fechar anotações">
              <X className="size-4" />
            </Button>
          </div>
        </header>

        {selected ? (
          <div className="max-h-[46vh] shrink-0 overflow-y-auto border-b bg-muted/25 px-5 py-4 [scrollbar-gutter:stable]">
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${accentClasses[selected.color]}`} />
              <p className="text-sm font-semibold">Minha anotação</p>
              <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                {annotationTypeLabels[selected.type]}
              </span>
            </div>
            <AnnotationNoteContent note={selected.note} className="mt-3 text-sm leading-6 text-foreground" />
            {selected.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1">
                {selected.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-background px-2 py-0.5 text-[10px] text-muted-foreground">#{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma anotação nesta leitura.
          </div>
        )}
    </aside>
  )
}
