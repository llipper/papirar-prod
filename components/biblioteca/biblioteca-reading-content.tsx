"use client"

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FolderOpen,
  LoaderCircle,
  List,
  MessageSquarePlus,
  RotateCcw,
  Search,
} from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import {
  LAW_READING_UPDATED_EVENT,
  loadLawReading,
  type LawReading,
  type ReadingNode,
} from "@/lib/biblioteca/reading-service"
import {
  createLawAnnotation,
  createLawHighlight,
  loadLawUserContent,
  removeLawHighlights,
  updateLawAnnotation,
  type LawAnnotation,
  type LawHighlight,
  type LawHighlightColor,
} from "@/lib/biblioteca/law-user-content-service"
import { useReadingScrollProgress } from "@/lib/biblioteca/use-reading-scroll"
import { ReadingAudioButton } from "./reading-audio-button"

type TextSelection = {
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  top: number
  left: number
}

function closestElement(node: Node | null, selector: string) {
  const element = node?.nodeType === Node.ELEMENT_NODE
    ? (node as Element)
    : node?.parentElement
  return element?.closest(selector) ?? null
}

export function BibliotecaReadingContent({ bookId, initialNodeKey, initialSelectedText }: { bookId: string; initialNodeKey?: string; initialSelectedText?: string }) {
  const book = useMemo(() => bibliotecaBooks.find((item) => item.id === bookId), [bookId])
  const [reading, setReading] = useState<LawReading | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isIndexOpen, setIsIndexOpen] = useState(false)
  const [highlights, setHighlights] = useState<LawHighlight[]>([])
  const [annotations, setAnnotations] = useState<LawAnnotation[]>([])
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const [isNoteOpen, setIsNoteOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const [isSavingContent, setIsSavingContent] = useState(false)
  const readingContainerRef = useRef<HTMLElement>(null)
  const readingProgress = useReadingScrollProgress(readingContainerRef, reading !== null)

  useEffect(() => {
    let cancelled = false
    if (!book) {
      setError("Obra não encontrada.")
      return
    }
    setReading(null)
    setError(null)

    const handleBackgroundUpdate = (event: Event) => {
      const updatedReading = (event as CustomEvent<LawReading>).detail
      if (!updatedReading || updatedReading.lawId !== book.lawId || cancelled) return
      setReading(updatedReading)
      void loadLawUserContent(updatedReading)
        .then((content) => {
          if (!cancelled) {
            setHighlights(content.highlights)
            setAnnotations(content.annotations)
          }
        })
        .catch((reason: unknown) => {
          console.error("[Papirar][Conteúdo do usuário] não foi possível atualizar", reason)
        })
    }
    window.addEventListener(LAW_READING_UPDATED_EVENT, handleBackgroundUpdate)

    loadLawReading(book)
      .then((value) => {
        if (cancelled) return
        setReading(value)
        setHighlights([])
        setAnnotations([])
        if (initialNodeKey || initialSelectedText) {
          window.setTimeout(() => {
            const target = initialNodeKey
              ? document.getElementById(`node-${initialNodeKey}`)
              : value.nodes
                .filter((node) => node.text)
                .find((node) => node.text?.toLocaleLowerCase().includes(initialSelectedText?.toLocaleLowerCase() ?? ""))
            const targetElement = target instanceof HTMLElement
              ? target
              : target
                ? document.getElementById(`node-${target.nodeKey}`)
                : null
            targetElement?.scrollIntoView({ behavior: "smooth", block: "start" })
          }, 250)
        }
        return loadLawUserContent(value)
          .then((content) => {
            if (!cancelled) {
              setHighlights(content.highlights)
              setAnnotations(content.annotations)
            }
          })
          .catch((reason: unknown) => {
            console.error("[Papirar][Conteúdo do usuário] não foi possível carregar", reason)
          })
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Não foi possível carregar a lei.")
      })
    return () => {
      cancelled = true
      window.removeEventListener(LAW_READING_UPDATED_EVENT, handleBackgroundUpdate)
    }
  }, [book, initialNodeKey, initialSelectedText])

  useEffect(() => {
    if (!selection || isNoteOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target
      if (target instanceof Element && target.closest("[data-selection-menu]")) return
      window.getSelection()?.removeAllRanges()
      setSelection(null)
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick)
  }, [selection, isNoteOpen])

  if (error) {
    return (
      <ReadingDashboardLayout>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
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

  const handleTextSelection = (position?: { top: number; left: number }) => {
    window.setTimeout(() => {
      const browserSelection = window.getSelection()
      if (!browserSelection || browserSelection.rangeCount === 0) return

      const range = browserSelection.getRangeAt(0)
      const selectedText = browserSelection.toString().trim()
      const nodeRoot = closestElement(range.commonAncestorContainer, "[data-node-key]")
      const textRoot = closestElement(range.startContainer, "[data-node-text]") ?? nodeRoot
      const endTextRoot = closestElement(range.endContainer, "[data-node-text]") ?? nodeRoot
      const selectionRoot = textRoot === endTextRoot ? textRoot : nodeRoot

      if (!selectedText || !selectionRoot || !nodeRoot) return
      if (!selectionRoot.contains(range.startContainer) || !selectionRoot.contains(range.endContainer)) return

      const startRange = document.createRange()
      startRange.selectNodeContents(selectionRoot)
      startRange.setEnd(range.startContainer, range.startOffset)
      const endRange = document.createRange()
      endRange.selectNodeContents(selectionRoot)
      endRange.setEnd(range.endContainer, range.endOffset)
      const rect = range.getBoundingClientRect()
      const menuWidth = 220
      const menuHeight = 300
      const preferredTop = position?.top ?? rect.bottom + 8
      const preferredLeft = position?.left ?? rect.left
      const top = preferredTop + menuHeight > window.innerHeight
        ? Math.max(8, (position?.top ?? rect.top) - menuHeight - 4)
        : preferredTop

      setSelection({
        nodeKey: nodeRoot.getAttribute("data-node-key") ?? "",
        selectedText,
        startOffset: startRange.toString().length,
        endOffset: endRange.toString().length,
        top: Math.max(8, Math.min(window.innerHeight - 8, top)),
        left: Math.max(12, Math.min(window.innerWidth - menuWidth - 12, preferredLeft)),
      })
    }, 0)
  }

  const clearTextSelection = () => {
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }

  const saveHighlight = async (color: LawHighlightColor) => {
    if (!selection) return
    setIsSavingContent(true)
    try {
      const saved = await createLawHighlight(reading, { ...selection, color })
      if (saved) setHighlights((current) => [...current, saved])
      clearTextSelection()
    } finally {
      setIsSavingContent(false)
    }
  }

  const saveAnnotation = async () => {
    if (!selection || !noteDraft.trim()) return
    setIsSavingContent(true)
    try {
      const saved = await createLawAnnotation(reading, { ...selection, note: noteDraft.trim() })
      if (saved) setAnnotations((current) => [...current, saved])
      setNoteDraft("")
      setIsNoteOpen(false)
      clearTextSelection()
    } finally {
      setIsSavingContent(false)
    }
  }

  const updateAnnotation = async (annotationId: string, note: string) => {
    if (!note.trim()) return
    setIsSavingContent(true)
    try {
      const saved = await updateLawAnnotation(annotationId, note)
      if (saved) {
        setAnnotations((current) => current.map((item) => item.id === annotationId ? { ...item, note: saved.note } : item))
      }
    } finally {
      setIsSavingContent(false)
    }
  }

  const removeHighlight = async () => {
    if (!selection) return
    setIsSavingContent(true)
    try {
      const remaining = await removeLawHighlights(reading, selection)
      setHighlights((current) => [
        ...current.filter((item) =>
          item.nodeKey !== selection.nodeKey ||
          item.endOffset <= selection.startOffset ||
          item.startOffset >= selection.endOffset
        ),
        ...remaining,
      ])
      clearTextSelection()
    } finally {
      setIsSavingContent(false)
    }
  }

  const selectionHasHighlight = selection
    ? highlights.some((item) =>
      item.nodeKey === selection.nodeKey &&
      item.endOffset > selection.startOffset &&
      item.startOffset < selection.endOffset
    )
    : false

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
            handleTextSelection({ top: event.clientY + 4, left: event.clientX + 4 })
          }
        }}
        className="min-w-0 flex-1 select-text overflow-y-auto overscroll-contain scroll-smooth [scrollbar-gutter:stable]"
      >
        <div className="mx-auto w-full max-w-3xl px-5 pb-28 pt-10 sm:px-8">
          <div className="space-y-1 pb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Lei Seca</p>
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">{reading.title}</h2>
          </div>
          <article className="space-y-7">
            {reading.nodes.map((node) => (
              <div key={`${node.nodeKey}-${node.sortOrder}`} id={`node-${node.nodeKey}`} data-node-key={node.nodeKey}>
                <ReadingNodeView
                  node={node}
                  highlights={highlights.filter((item) => item.nodeKey === node.nodeKey)}
                  annotations={annotations.filter((item) => item.nodeKey === node.nodeKey)}
                  onAnnotationUpdated={updateAnnotation}
                />
              </div>
            ))}
          </article>
        </div>
      </main>
      <ReadingIndexSheet
        reading={reading}
        open={isIndexOpen}
        onOpenChange={setIsIndexOpen}
      />
      {selection && (
        <div
          data-selection-menu
          className="fixed z-50 flex min-w-[220px] flex-col rounded-2xl border bg-background p-1.5 shadow-xl"
          style={{ top: selection.top, left: selection.left }}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm" disabled={isSavingContent} onClick={() => setIsNoteOpen(true)}>
            Anotar
          </Button>
          <div className="my-1 border-t" />
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm" disabled={isSavingContent} onClick={() => saveHighlight("yellow")}>
            Importante
          </Button>
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm" disabled={isSavingContent} onClick={() => saveHighlight("red")}>
            Cai muito
          </Button>
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm" disabled={isSavingContent} onClick={() => saveHighlight("blue")}>
            Revisar
          </Button>
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm" disabled={isSavingContent} onClick={() => saveHighlight("green")}>
            Dominado
          </Button>
          {selectionHasHighlight && (
            <>
              <div className="my-1 border-t" />
              <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm text-destructive" disabled={isSavingContent} onClick={removeHighlight}>
                Desmarcar
              </Button>
            </>
          )}
          <div className="my-1 border-t" />
          <Button variant="ghost" className="h-9 justify-start rounded-xl px-3 text-sm text-muted-foreground" onClick={clearTextSelection}>
            Cancelar
          </Button>
        </div>
      )}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <MessageSquarePlus className="size-5" />
              </span>
              Adicionar anotação
            </DialogTitle>
            <DialogDescription className="font-reading">
              Registre uma ideia, dúvida ou lembrete para revisar depois.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="Escreva sua anotação aqui..."
              maxLength={5000}
              autoFocus
              className="min-h-36 resize-none rounded-xl p-4 font-reading leading-6"
            />
            <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
              <span>Vinculada ao trecho selecionado.</span>
              <span>{noteDraft.length}/5000</span>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>Cancelar</Button>
            <Button disabled={!noteDraft.trim() || isSavingContent} onClick={saveAnnotation}>Salvar anotação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReadingDashboardLayout>
  )
}

function ReadingDashboardLayout({
  children,
  reading,
  isIndexOpen = false,
  onIndexOpenChange,
  readingProgress,
}: {
  children: ReactNode
  reading?: LawReading
  isIndexOpen?: boolean
  onIndexOpenChange?: (open: boolean) => void
  readingProgress?: number
}) {
  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      <ReadingDashboardFrame
        reading={reading}
        onIndexOpenChange={onIndexOpenChange}
        readingProgress={readingProgress}
      >
        {children}
      </ReadingDashboardFrame>
    </SidebarProvider>
  )
}

function ReadingDashboardFrame({
  children,
  reading,
  onIndexOpenChange,
  readingProgress,
}: {
  children: ReactNode
  reading?: LawReading
  onIndexOpenChange?: (open: boolean) => void
  readingProgress?: number
}) {
  const { isMobile, state } = useSidebar()
  const progressBarLeft = isMobile || state === "collapsed"
    ? "1rem"
    : "calc(var(--sidebar-width) + 1.25rem)"

  return (
    <>
      <AppSidebar />
      <SidebarInset className="min-w-0 h-svh max-h-svh overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-black dark:text-white"
            aria-label="Voltar para a Biblioteca"
          >
            <Link href="/dashboard/biblioteca"><ChevronLeft /></Link>
          </Button>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-muted-foreground">
              {reading?.acronym ?? "Biblioteca"}
            </p>
            <h1 className="truncate font-heading text-base font-bold">
              {reading?.title ?? "Leitura"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-black dark:text-white"
            onClick={() => onIndexOpenChange?.(true)}
            aria-label="Abrir índice da lei"
            title="Índice"
          >
            <BookOpen />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        {reading && !isMobile && (
          <div
            className="pointer-events-none fixed bottom-5 z-30 px-4"
            style={{ left: progressBarLeft }}
          >
            <div className="pointer-events-auto flex h-[44px] w-[166px] min-w-[166px] shrink-0 items-center gap-1 rounded-[18px] bg-black p-1.5 text-white shadow-lg dark:bg-white dark:text-black">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 min-w-[104px] shrink-0 whitespace-nowrap rounded-xl px-3 font-heading text-xs font-bold text-inherit hover:bg-white/15 hover:text-inherit dark:hover:bg-black/10"
                onClick={() => onIndexOpenChange?.(true)}
              >
                <BookOpen className="size-4" />
                Índice
                <ChevronsUpDown className="size-3.5 opacity-75" />
              </Button>
              <span className="min-w-[42px] shrink-0 rounded-[10px] bg-white/20 px-2.5 py-1 text-center font-heading text-xs font-bold dark:bg-black/15">
                {readingProgress ?? 1}%
              </span>
            </div>
          </div>
        )}
      </SidebarInset>
    </>
  )
}

type ReadingIndexEntry = {
  nodeKey: string
  label: string
  searchText: string
  level: number
  nodeType: string
}

function ReadingIndexSheet({
  reading,
  open,
  onOpenChange,
}: {
  reading: LawReading
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState("")
  const entries = useMemo<ReadingIndexEntry[]>(() => {
    return reading.nodes
      .filter((node) =>
        ["parte", "titulo", "capitulo", "secao", "subsecao", "artigo"].includes(node.nodeType)
      )
      .map((node) => {
        const label = node.nodeType === "artigo"
          ? [`Art. ${node.number}`, node.epigraphe || node.label].filter(Boolean).join(" — ")
          : [node.label, node.text].filter(Boolean).join(" — ")
        return {
          nodeKey: node.nodeKey,
          label,
          searchText: [label, node.text, node.epigraphe, node.number].filter(Boolean).join(" "),
          level: {
            parte: 0,
            titulo: 1,
            capitulo: 2,
            secao: 3,
            subsecao: 4,
            artigo: 5,
          }[node.nodeType] ?? 0,
          nodeType: node.nodeType,
        }
      })
      .filter((entry) => entry.label)
  }, [reading.nodes])

  const visibleEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return entries
    return entries.filter((entry) =>
      entry.searchText.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [entries, query])

  const selectEntry = (entry: ReadingIndexEntry) => {
    onOpenChange(false)
    window.setTimeout(() => {
      document.getElementById(`node-${entry.nodeKey}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 120)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[min(92vw,380px)] p-0 sm:max-w-md">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <BookOpen className="size-5" /> Índice
          </SheetTitle>
          <SheetDescription className="truncate font-reading text-xs">
            {reading.title}
          </SheetDescription>
          <div className="relative pt-2">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar no índice"
              className="h-9 rounded-xl pl-9"
            />
          </div>
          <p className="pt-1 text-left font-reading text-xs text-muted-foreground">
            {visibleEntries.length} divisões
          </p>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {visibleEntries.length === 0 ? (
            <p className="py-10 text-center font-reading text-sm text-muted-foreground">
              Nenhum resultado encontrado.
            </p>
          ) : (
            <div className="space-y-1">
              {visibleEntries.map((entry) => (
                <button
                  key={entry.nodeKey}
                  type="button"
                  onClick={() => selectEntry(entry)}
                  className="flex w-full items-start gap-2 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-accent"
                  style={{ paddingLeft: `${8 + entry.level * 16}px` }}
                >
                  {entry.level === 0 ? (
                    <BookOpen className="mt-0.5 size-4 shrink-0" />
                  ) : entry.level <= 2 ? (
                    <FolderOpen className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <List className="mt-0.5 size-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 font-reading text-sm leading-[1.35]">
                    {entry.label}
                  </span>
                  <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function renderMarkedText(
  text: string,
  highlights: LawHighlight[],
  annotations: LawAnnotation[],
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
) {
  const marks = [
    ...highlights.map((item) => ({
      type: "highlight" as const,
      start: item.startOffset,
      end: item.endOffset,
      className: item.color === "red"
        ? "bg-red-100 dark:bg-red-500/30 decoration-red-500"
        : item.color === "blue"
          ? "bg-blue-100 dark:bg-blue-500/30 decoration-blue-500"
          : item.color === "green"
            ? "bg-emerald-100 dark:bg-emerald-500/30 decoration-emerald-500"
            : "bg-amber-100 dark:bg-amber-500/30 decoration-amber-500",
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
    .filter((item) => item.start >= 0 && item.end > item.start && item.start < text.length)
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
        <span
          key={`${start}-${end}-${index}`}
          className="inline"
        >
          {mark.type === "highlight" ? (
            <mark className={`box-decoration-clone rounded-md px-1 py-0.5 underline decoration-2 underline-offset-4 ${mark.className}`}>
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

function AnnotationText({
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
          className={`group relative inline cursor-help align-baseline font-inherit leading-inherit text-inherit ${className}`}
          style={{ "--annotation-x": "0px", "--annotation-y": "0px" } as CSSProperties}
          onMouseMove={(event) => {
            event.currentTarget.style.setProperty("--annotation-x", `${event.clientX}px`)
            event.currentTarget.style.setProperty("--annotation-y", `${Math.max(96, event.clientY)}px`)
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
              style={{ left: "var(--annotation-x)", top: "var(--annotation-y)" }}
            >
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Anotação</span>
              {note}
            </span>
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent side="top" align="center" className="w-72 rounded-2xl p-3">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Anotação</p>
            <p className="mt-1 text-xs text-muted-foreground">Clique para editar este lembrete.</p>
          </div>
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} className="min-h-20 resize-none rounded-xl text-sm" autoFocus />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="button" size="sm" disabled={saving || !draft.trim()} onClick={handleSave}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ReadingNodeView({
  node,
  highlights,
  annotations,
  onAnnotationUpdated,
}: {
  node: ReadingNode
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
}) {
  const structural = ["parte", "titulo", "capitulo", "secao", "subsecao"].includes(node.nodeType)
  if (structural) {
    return (
      <section className={`space-y-2 text-center ${structuralSpacing[node.nodeType] ?? "py-3"}`}>
        {node.label && <h3 className={`font-display font-semibold uppercase leading-tight ${structuralLabelSize[node.nodeType] ?? "text-base"}`}>{node.label}</h3>}
        {node.text && (
          <p className={`font-display font-semibold leading-tight ${structuralTextSize[node.nodeType] ?? "text-sm"}`}>
            <span data-node-text>{renderMarkedText(node.text, highlights, annotations, onAnnotationUpdated)}</span>
          </p>
        )}
        {node.audio && <ReadingAudioButton audio={node.audio} />}
      </section>
    )
  }

  if (node.nodeType === "preambulo") {
    return (
      <section className="space-y-3 py-3 text-center">
        {node.label && (
          <div className="flex items-center justify-center">
            <h3 className="font-display text-lg font-semibold">{node.label}</h3>
            {node.audio && <ReadingAudioButton audio={node.audio} />}
          </div>
        )}
        {node.text && (
          <p className="text-left font-reading text-[1.05rem] leading-[1.65]">
            <span data-node-text className="whitespace-pre-line">{renderMarkedText(node.text, highlights, annotations, onAnnotationUpdated)}</span>
          </p>
        )}
        {!node.label && node.audio && <ReadingAudioButton audio={node.audio} />}
      </section>
    )
  }

  const prefix = node.nodeType === "artigo"
    ? `Art. ${node.number}`
    : node.nodeType === "paragrafo"
      ? node.number.toLowerCase() === "único" ? "Parágrafo único" : `§ ${node.number}`
      : node.nodeType === "inciso" ? node.number
      : node.nodeType === "alinea" ? `${node.number})`
      : ""

  const hierarchyClass = {
    artigo: "",
    paragrafo: "relative ml-2 border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
    inciso: "relative ml-2 border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
    alinea: "relative ml-10 border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
  }[node.nodeType] ?? ""
  const incisoSeparator = node.nodeType === "inciso" && !node.audio ? " - " : " "

  return (
    <section className={`space-y-2 pt-3 ${hierarchyClass}`}>
      {node.epigraphe && <h4 className="font-reading text-[0.94rem] font-semibold leading-[1.35]">{node.epigraphe}</h4>}
      <p className="font-reading text-[1.05rem] leading-[1.65] text-foreground/85">
        <strong className="font-reading font-semibold text-foreground">{prefix}</strong>{node.audio && <ReadingAudioButton audio={node.audio} />}{incisoSeparator}{node.text && (
          <span data-node-text className="whitespace-pre-line">{renderMarkedText(node.text, highlights, annotations, onAnnotationUpdated)}</span>
        )}
      </p>
    </section>
  )
}

const structuralSpacing: Record<string, string> = {
  parte: "mt-8 py-3",
  titulo: "mt-7 py-3",
  capitulo: "mt-6 py-3",
  secao: "mt-5 py-2",
  subsecao: "mt-4 py-2",
}

const structuralLabelSize: Record<string, string> = {
  parte: "text-xl",
  titulo: "text-lg",
  capitulo: "text-base",
  secao: "text-[0.95rem]",
  subsecao: "text-[0.9rem]",
}

const structuralTextSize: Record<string, string> = {
  parte: "text-lg",
  titulo: "text-base",
  capitulo: "text-[0.95rem]",
  secao: "text-[0.9rem]",
  subsecao: "text-[0.85rem]",
}
