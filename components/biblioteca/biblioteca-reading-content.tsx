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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import {
  bibliotecaBooks,
  type BibliotecaReadingPresentation,
} from "@/lib/biblioteca/catalog-data"
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
  const element =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement
  return element?.closest(selector) ?? null
}

export function BibliotecaReadingContent({
  bookId,
  initialNodeKey,
  initialSelectedText,
  adminBanner,
  adminNodeActions,
}: {
  bookId: string
  initialNodeKey?: string
  initialSelectedText?: string
  adminBanner?: ReactNode
  adminNodeActions?: (node: ReadingNode) => ReactNode
}) {
  const book = useMemo(
    () => bibliotecaBooks.find((item) => item.id === bookId),
    [bookId]
  )
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
  const readingProgress = useReadingScrollProgress(
    readingContainerRef,
    reading !== null
  )

  useEffect(() => {
    let cancelled = false
    if (!book) {
      // A rota pode mudar para um ID inválido durante a navegação.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError("Obra não encontrada.")
      return
    }
    setReading(null)
    setError(null)

    const handleBackgroundUpdate = (event: Event) => {
      const updatedReading = (event as CustomEvent<LawReading>).detail
      if (!updatedReading || updatedReading.lawId !== book.lawId || cancelled)
        return
      setReading(updatedReading)
      void loadLawUserContent(updatedReading)
        .then((content) => {
          if (!cancelled) {
            setHighlights(content.highlights)
            setAnnotations(content.annotations)
          }
        })
        .catch((reason: unknown) => {
          console.error(
            "[Papirar][Conteúdo do usuário] não foi possível atualizar",
            reason
          )
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
        return loadLawUserContent(value)
          .then((content) => {
            if (!cancelled) {
              setHighlights(content.highlights)
              setAnnotations(content.annotations)
            }
          })
          .catch((reason: unknown) => {
            console.error(
              "[Papirar][Conteúdo do usuário] não foi possível carregar",
              reason
            )
          })
      })
      .catch((reason: unknown) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar a lei."
          )
      })
    return () => {
      cancelled = true
      window.removeEventListener(
        LAW_READING_UPDATED_EVENT,
        handleBackgroundUpdate
      )
    }
  }, [book, initialNodeKey, initialSelectedText])

  useEffect(() => {
    if (!selection || isNoteOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target
      if (target instanceof Element && target.closest("[data-selection-menu]"))
        return
      window.getSelection()?.removeAllRanges()
      setSelection(null)
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    return () =>
      document.removeEventListener("pointerdown", closeOnOutsideClick)
  }, [selection, isNoteOpen])

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

  const handleTextSelection = (position?: { top: number; left: number }) => {
    window.setTimeout(() => {
      const browserSelection = window.getSelection()
      if (!browserSelection || browserSelection.rangeCount === 0) return

      const range = browserSelection.getRangeAt(0)
      const selectedText = browserSelection.toString().trim()
      const nodeRoot = closestElement(
        range.commonAncestorContainer,
        "[data-node-key]"
      )
      const textRoot =
        closestElement(range.startContainer, "[data-node-text]") ?? nodeRoot
      const endTextRoot =
        closestElement(range.endContainer, "[data-node-text]") ?? nodeRoot
      const selectionRoot = textRoot === endTextRoot ? textRoot : nodeRoot

      if (!selectedText || !selectionRoot || !nodeRoot) return
      if (
        !selectionRoot.contains(range.startContainer) ||
        !selectionRoot.contains(range.endContainer)
      )
        return

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
      const top =
        preferredTop + menuHeight > window.innerHeight
          ? Math.max(8, (position?.top ?? rect.top) - menuHeight - 4)
          : preferredTop

      setSelection({
        nodeKey: nodeRoot.getAttribute("data-node-key") ?? "",
        selectedText,
        startOffset: startRange.toString().length,
        endOffset: endRange.toString().length,
        top: Math.max(8, Math.min(window.innerHeight - 8, top)),
        left: Math.max(
          12,
          Math.min(window.innerWidth - menuWidth - 12, preferredLeft)
        ),
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
      const saved = await createLawAnnotation(reading, {
        ...selection,
        note: noteDraft.trim(),
      })
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
        setAnnotations((current) =>
          current.map((item) =>
            item.id === annotationId ? { ...item, note: saved.note } : item
          )
        )
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
        ...current.filter(
          (item) =>
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
    ? highlights.some(
        (item) =>
          item.nodeKey === selection.nodeKey &&
          item.endOffset > selection.startOffset &&
          item.startOffset < selection.endOffset
      )
    : false
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
        className="min-w-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain scroll-smooth select-text"
      >
        <div className="mx-auto w-full max-w-3xl px-5 pt-10 pb-28 sm:px-8">
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
                  highlights={highlights.filter(
                    (item) => item.nodeKey === node.nodeKey
                  )}
                  annotations={annotations.filter(
                    (item) => item.nodeKey === node.nodeKey
                  )}
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
        <div
          data-selection-menu
          className="fixed z-50 flex min-w-[220px] flex-col rounded-2xl border bg-background p-1.5 shadow-xl"
          style={{ top: selection.top, left: selection.left }}
          onMouseDown={(event) => event.preventDefault()}
          onWheel={(event) => {
            readingContainerRef.current?.scrollBy({
              top: event.deltaY,
              left: event.deltaX,
              behavior: "auto",
            })
          }}
        >
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm"
            disabled={isSavingContent}
            onClick={() => setIsNoteOpen(true)}
          >
            Anotar
          </Button>
          <div className="my-1 border-t" />
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm"
            disabled={isSavingContent}
            onClick={() => saveHighlight("yellow")}
          >
            Importante
          </Button>
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm"
            disabled={isSavingContent}
            onClick={() => saveHighlight("red")}
          >
            Cai muito
          </Button>
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm"
            disabled={isSavingContent}
            onClick={() => saveHighlight("blue")}
          >
            Revisar
          </Button>
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm"
            disabled={isSavingContent}
            onClick={() => saveHighlight("green")}
          >
            Dominado
          </Button>
          {selectionHasHighlight && (
            <>
              <div className="my-1 border-t" />
              <Button
                variant="ghost"
                className="h-9 justify-start rounded-xl px-3 text-sm text-destructive"
                disabled={isSavingContent}
                onClick={removeHighlight}
              >
                Desmarcar
              </Button>
            </>
          )}
          <div className="my-1 border-t" />
          <Button
            variant="ghost"
            className="h-9 justify-start rounded-xl px-3 text-sm text-muted-foreground"
            onClick={clearTextSelection}
          >
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
            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!noteDraft.trim() || isSavingContent}
              onClick={saveAnnotation}
            >
              Salvar anotação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ReadingDashboardLayout>
  )
}

function ReadingAnnexView({ annex }: { annex: LawReading["annexes"][number] }) {
  const isMatrix = annex.rows.some((row) => row.columns.length > 0)
  const matrixHeaders = [annex.leftHeader, annex.rightHeader]
  const matrixColumnCount = Math.max(
    2,
    ...annex.rows.map((row) => row.columns.length)
  )
  if (isMatrix) {
    matrixHeaders.length = matrixColumnCount
    matrixHeaders[0] = "Círculo"
    matrixHeaders[1] = "Hierarquização"
    matrixHeaders[2] = "Posto / Graduação"
    matrixHeaders[3] = "Marinha"
    matrixHeaders[4] = "Exército"
    matrixHeaders[5] = "Aeronáutica"
  }
  return (
    <section
      className="mt-14 space-y-4 pb-10"
      aria-labelledby={`annex-${annex.annexKey}`}
    >
      <div className="space-y-1 text-center">
        <h2
          id={`annex-${annex.annexKey}`}
          className="font-display text-base font-semibold uppercase"
        >
          {annex.title}
        </h2>
        {annex.subtitle && (
          <p className="font-display text-sm font-semibold uppercase">
            {annex.subtitle}
          </p>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[680px] border-collapse font-reading text-sm">
          <thead>
            <tr className="bg-muted/50 text-center font-display text-xs font-semibold uppercase">
              {matrixHeaders.map((header, index) => (
                <th
                  key={`${header}-${index}`}
                  className="border-r border-b border-border px-3 py-2 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {annex.rows.map((row) => (
              <tr key={row.rowKey} className="align-top">
                {isMatrix ? (
                  row.columns.map((column, index) => (
                    <td
                      key={`${row.rowKey}-${index}`}
                      className="border-r border-b border-border px-3 py-2"
                    >
                      {column || "—"}
                    </td>
                  ))
                ) : (
                  <>
                    <td
                      className={`border-r border-b border-border px-3 py-2 ${row.itemCode ? "font-medium" : "pl-8"}`}
                    >
                      {row.itemCode && (
                        <span className="mr-1">{row.itemCode} -</span>
                      )}
                      {row.description}
                      {row.note && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({row.note})
                        </span>
                      )}
                    </td>
                    <td className="border-b border-border px-3 py-2 text-center font-medium">
                      {row.amountDisplay || "—"}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
  const progressBarLeft =
    isMobile || state === "collapsed"
      ? "1rem"
      : "calc(var(--sidebar-width) + 1.25rem)"

  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-svh max-h-svh min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="text-black dark:text-white"
            aria-label="Voltar para a Biblioteca"
          >
            <Link href="/dashboard/biblioteca">
              <ChevronLeft />
            </Link>
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
                className="h-8 min-w-[104px] shrink-0 rounded-xl px-3 font-heading text-xs font-bold whitespace-nowrap text-inherit hover:bg-white/15 hover:text-inherit dark:hover:bg-black/10"
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

function isTreatyBodyNode(
  node: ReadingNode,
  readingPresentation?: BibliotecaReadingPresentation
) {
  return (
    readingPresentation === "treaty" &&
    node.nodeKey.split(".").some((segment) => segment.startsWith("parte_"))
  )
}

function articleHeading(
  node: ReadingNode,
  readingPresentation?: BibliotecaReadingPresentation
) {
  return isTreatyBodyNode(node, readingPresentation)
    ? `ARTIGO ${node.number}`
    : `Art. ${node.number}`
}

function structuralContent(
  node: ReadingNode,
  readingPresentation: BibliotecaReadingPresentation = "legislation"
) {
  const number = node.number.trim()
  const label = node.label.trim()
  const text = node.text.trim()
  const epigraphe = node.epigraphe.trim()
  const upperLabel = label.toLocaleUpperCase()
  const prefixByType: Record<string, string> = {
    parte: isTreatyBodyNode(node, readingPresentation) ? "PARTE" : "LIVRO",
    titulo: "TÍTULO",
    capitulo: "CAPÍTULO",
    secao: "SEÇÃO",
    subsecao: "SUBSEÇÃO",
  }
  const prefix = prefixByType[node.nodeType]
  const hasStoredPrefix = prefix
    ? upperLabel.startsWith(prefix) ||
      (prefix === "TÍTULO" && upperLabel.startsWith("TITULO")) ||
      (prefix === "CAPÍTULO" && upperLabel.startsWith("CAPITULO")) ||
      (prefix === "SEÇÃO" && upperLabel.startsWith("SECAO")) ||
      (prefix === "SUBSEÇÃO" && upperLabel.startsWith("SUBSECAO"))
    : false

  // Mantém a mesma normalização do Flutter: quando o banco guarda apenas o
  // número, o prefixo estrutural é aplicado somente a esse nó numerado. Nós
  // livres/encerramentos nunca recebem um título inventado.
  const heading = hasStoredPrefix
    ? label
    : prefix && number
      ? `${prefix} ${number}`
      : ""

  const description =
    node.nodeType === "capitulo" && !label
      ? text
      : node.nodeType === "titulo" || node.nodeType === "parte"
        ? ""
        : node.nodeType === "secao" || node.nodeType === "subsecao"
          ? ""
          : text

  return {
    heading,
    label: hasStoredPrefix ? "" : label,
    description,
    epigraphe,
  }
}

function ReadingIndexSheet({
  reading,
  readingPresentation,
  open,
  onOpenChange,
}: {
  reading: LawReading
  readingPresentation?: BibliotecaReadingPresentation
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = useState("")
  const entries = useMemo<ReadingIndexEntry[]>(() => {
    return reading.nodes
      .filter((node) =>
        ["parte", "titulo", "capitulo", "secao", "subsecao", "artigo"].includes(
          node.nodeType
        )
      )
      .map((node) => {
        const label =
          node.nodeType === "artigo"
            ? [
                articleHeading(node, readingPresentation),
                node.epigraphe || node.label,
              ]
                .filter(Boolean)
                .join(" — ")
            : (() => {
                const content = structuralContent(node, readingPresentation)
                return [
                  content.heading,
                  content.label,
                  content.description,
                  content.epigraphe,
                ]
                  .filter(Boolean)
                  .join(" — ")
              })()
        return {
          nodeKey: node.nodeKey,
          label,
          searchText: [label, node.text, node.epigraphe, node.number]
            .filter(Boolean)
            .join(" "),
          level:
            {
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
  }, [reading.nodes, readingPresentation])

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
      className:
        item.color === "red"
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
              className={`rounded-md box-decoration-clone px-1 py-0.5 underline decoration-2 underline-offset-4 ${mark.className}`}
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

function ReadingNodeView({
  node,
  readingPresentation,
  highlights,
  annotations,
  onAnnotationUpdated,
}: {
  node: ReadingNode
  readingPresentation?: BibliotecaReadingPresentation
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
}) {
  const structural = [
    "parte",
    "titulo",
    "capitulo",
    "secao",
    "subsecao",
  ].includes(node.nodeType)
  if (structural) {
    const content = structuralContent(node, readingPresentation)

    return (
      <section
        className={`space-y-2 text-center ${structuralSpacing[node.nodeType] ?? "py-3"}`}
      >
        {content.heading && (
          <h3
            className={`font-display leading-tight font-semibold uppercase ${structuralLabelSize[node.nodeType] ?? "text-base"}`}
          >
            {content.heading}
          </h3>
        )}
        {content.label && (
          <h3
            className={`font-display leading-tight font-semibold uppercase ${structuralLabelSize[node.nodeType] ?? "text-base"}`}
          >
            {content.label}
          </h3>
        )}
        {content.description && (
          <p
            className={`font-display leading-tight font-semibold ${structuralTextSize[node.nodeType] ?? "text-sm"}`}
          >
            <span data-node-text>
              {renderMarkedText(
                content.description,
                highlights,
                annotations,
                onAnnotationUpdated
              )}
            </span>
          </p>
        )}
        {content.epigraphe && (
          <p className="font-display leading-tight font-semibold">
            {content.epigraphe}
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
        {node.epigraphe && (
          <h4 className="font-display text-base leading-tight font-semibold uppercase">
            {node.epigraphe}
          </h4>
        )}
        {node.text && (
          <p className="text-left font-reading text-[1.05rem] leading-[1.65]">
            <span data-node-text className="whitespace-pre-line">
              {renderMarkedText(
                node.text,
                highlights,
                annotations,
                onAnnotationUpdated
              )}
            </span>
          </p>
        )}
        {!node.label && node.audio && <ReadingAudioButton audio={node.audio} />}
      </section>
    )
  }

  if (
    node.nodeType === "artigo" &&
    isTreatyBodyNode(node, readingPresentation)
  ) {
    return (
      <section className="space-y-3 pt-4">
        <div className="space-y-2 text-center">
          <h3 className="font-display text-base leading-tight font-semibold uppercase">
            ARTIGO {node.number}
          </h3>
          {node.epigraphe && (
            <h4 className="font-display text-sm leading-tight font-semibold">
              {node.epigraphe}
            </h4>
          )}
        </div>
        {node.text && (
          <p className="font-reading text-[1.05rem] leading-[1.65] text-foreground/85">
            {node.audio && <ReadingAudioButton audio={node.audio} />}
            <span data-node-text className="whitespace-pre-line">
              {renderMarkedText(
                node.text,
                highlights,
                annotations,
                onAnnotationUpdated
              )}
            </span>
          </p>
        )}
      </section>
    )
  }

  const prefix =
    node.nodeType === "artigo"
      ? `Art. ${node.number}`
      : node.nodeType === "paragrafo"
        ? node.number.toLowerCase() === "único"
          ? "Parágrafo único"
          : `§ ${node.number}`
        : node.nodeType === "inciso"
          ? node.number
          : node.nodeType === "alinea"
            ? `${node.number})`
            : ""

  const hierarchyClass =
    {
      artigo: "",
      paragrafo:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
      inciso:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
      alinea:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
    }[node.nodeType] ?? ""
  const hierarchyDepth = node.nodeKey
    .split(".")
    .filter(
      (part) =>
        part.startsWith("par_") ||
        part.startsWith("inciso_") ||
        part.startsWith("alinea_")
    ).length
  const hierarchyStyle =
    hierarchyDepth > 0
      ? { marginLeft: `${hierarchyDepth * 1.5}rem` }
      : undefined
  const incisoSeparator =
    node.nodeType === "inciso" && !node.audio ? " - " : " "

  return (
    <section
      className={`space-y-2 pt-3 ${hierarchyClass}`}
      style={hierarchyStyle}
    >
      {node.epigraphe && (
        <h4 className="font-reading text-[0.94rem] leading-[1.35] font-semibold">
          {node.epigraphe}
        </h4>
      )}
      <p className="font-reading text-[1.05rem] leading-[1.65] text-foreground/85">
        <strong className="font-reading font-semibold text-foreground">
          {prefix}
        </strong>
        {node.audio && <ReadingAudioButton audio={node.audio} />}
        {incisoSeparator}
        {node.text && (
          <span data-node-text className="whitespace-pre-line">
            {renderMarkedText(
              node.text,
              highlights,
              annotations,
              onAnnotationUpdated
            )}
          </span>
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
