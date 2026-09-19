"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Archive, ArrowUpRight, FilePenLine, Highlighter, LoaderCircle, Search, Trash2 } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import { annotationTypeLabels, archiveLawUserContent, deleteLawUserContent, loadLawUserContentOverview, restoreLawUserContent, type LawHighlightColor, type LawUserContentOverviewItem } from "@/lib/biblioteca/law-user-content-service"
import { AnnotationNoteContent } from "@/components/biblioteca/reading/annotations/annotation-note-content"

type ContentPageMode = "annotations" | "highlights"

const colorStyles: Record<LawHighlightColor, string> = {
  yellow: "bg-amber-100 text-amber-950",
  red: "bg-red-100 text-red-950",
  blue: "bg-blue-100 text-blue-950",
  green: "bg-emerald-100 text-emerald-950",
  purple: "bg-purple-100 text-purple-950",
  orange: "bg-orange-100 text-orange-950",
  beige: "bg-amber-50 text-amber-950",
}

const annotationColorStyles = {
  yellow: "bg-amber-300",
  red: "bg-red-400",
  blue: "bg-blue-400",
  green: "bg-emerald-400",
  purple: "bg-purple-400",
  gray: "bg-slate-300",
} as const

function formatDate(value: string | null) {
  if (!value) return "Sem data"
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value))
}

export function UserContentPage({ mode }: { mode: ContentPageMode }) {
  const [items, setItems] = useState<LawUserContentOverviewItem[]>([])
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<LawUserContentOverviewItem | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    loadLawUserContentOverview(includeArchived)
      .then((value) => {
        if (!cancelled) setItems(value)
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Não foi possível carregar seu conteúdo.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [includeArchived])

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return items
      .filter((item) => item.type === (mode === "annotations" ? "annotation" : "highlight"))
      .filter((item) => {
        if (!normalized) return true
        const book = bibliotecaBooks.find((entry) => entry.lawId === item.lawId)
        return `${book?.title ?? item.lawId} ${book?.acronym ?? ""} ${item.nodeKey} ${item.selectedText} ${item.note ?? ""}`.toLocaleLowerCase().includes(normalized)
      })
  }, [items, mode, query])

  const groups = useMemo(() => {
    const grouped = new Map<string, LawUserContentOverviewItem[]>()
    visibleItems.forEach((item) => grouped.set(item.lawId, [...(grouped.get(item.lawId) ?? []), item]))
    return [...grouped.entries()]
  }, [visibleItems])

  const title = mode === "annotations" ? "Anotações" : "Marcações"
  const description = mode === "annotations"
    ? "Suas observações organizadas por lei."
    : "Seus trechos destacados, prontos para revisar."

  const updateItem = async (item: LawUserContentOverviewItem, action: "archive" | "restore" | "delete") => {
    if (action === "delete") {
      setPendingDelete(item)
      return
    }
    setBusyId(item.id)
    try {
      if (action === "archive") await archiveLawUserContent(item)
      if (action === "restore") await restoreLawUserContent(item)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar o conteúdo.")
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    const item = pendingDelete
    setPendingDelete(null)
    setBusyId(item.id)
    try {
      await deleteLawUserContent(item)
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Não foi possível apagar o conteúdo.")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-4 border-b px-4 py-1.5">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <div className="min-w-0">
              <h1 className="font-heading text-base font-bold">{title}</h1>
              <p className="truncate text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="flex w-full max-w-xs items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar em ${title.toLocaleLowerCase()}`} className="h-9 rounded-lg pl-9" />
            </div>
            <Button
              type="button"
              variant={includeArchived ? "secondary" : "ghost"}
              size="icon"
              className="size-9 shrink-0 rounded-lg"
              onClick={() => setIncludeArchived((value) => !value)}
              aria-label={includeArchived ? "Ocultar arquivados" : "Mostrar arquivados"}
              title={includeArchived ? "Ocultar arquivados" : "Mostrar arquivados"}
            >
              <Archive className="size-4" />
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-5 lg:px-8">
            {isLoading ? (
              <div className="flex min-h-64 items-center justify-center"><LoaderCircle className="size-6 animate-spin text-muted-foreground" /></div>
            ) : error ? (
              <div className="mt-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-sm text-destructive">{error}</div>
            ) : groups.length === 0 ? (
              <div className="mt-10 rounded-2xl border border-dashed p-12 text-center">
                {mode === "annotations" ? <FilePenLine className="mx-auto size-8 text-muted-foreground" /> : <Highlighter className="mx-auto size-8 text-muted-foreground" />}
                <h3 className="mt-4 font-semibold">Nenhum conteúdo encontrado</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Selecione um trecho na Biblioteca para criar sua primeira {mode === "annotations" ? "anotação" : "marcação"}.</p>
                <Button asChild className="mt-5 rounded-xl"><Link href="/dashboard/biblioteca">Abrir Biblioteca</Link></Button>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {groups.map(([lawId, lawItems]) => {
                  const book = bibliotecaBooks.find((entry) => entry.lawId === lawId)
                  return (
                    <section key={lawId}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-heading text-lg font-bold">{book?.title ?? lawId}</h3>
                          <p className="text-xs text-muted-foreground">{book?.acronym ?? "Lei"} · {lawItems.length} {mode === "annotations" ? "anotações" : "marcações"}</p>
                        </div>
                        {book && <Button asChild variant="ghost" size="sm" className="rounded-xl"><Link href={`/dashboard/biblioteca/${book.id}`}>Abrir lei <ArrowUpRight className="ml-1 size-4" /></Link></Button>}
                      </div>
                      <div className="grid gap-3 lg:grid-cols-3">
                        {lawItems.map((item) => (
                          <article key={`${item.type}-${item.id}`} className="rounded-xl border bg-card p-3.5 shadow-sm transition-shadow hover:shadow-md">
                            <div className="flex items-start justify-between gap-4">
                              <Badge variant="secondary" className="max-w-[75%] truncate rounded-md px-2 py-0.5 font-reading text-[10px]">
                                {item.nodeKey?.replaceAll("_", " ") || "Localização pelo texto"}
                              </Badge>
                              <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.createdAt)}</span>
                            </div>
                            <p className={`mt-3 rounded-md px-2.5 py-2 font-reading text-sm leading-5 ${item.color ? colorStyles[item.color] : "bg-muted"}`}>&ldquo;{item.selectedText}&rdquo;</p>
                            {item.note && <AnnotationNoteContent note={item.note} className="mt-3 border-l-2 border-primary/40 pl-2.5 text-xs leading-5 text-muted-foreground" />}
                            {item.annotation && (
                              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className={`size-2 rounded-full ${annotationColorStyles[item.annotation.color]}`} aria-label={`Cor ${item.annotation.color}`} />
                                <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium text-foreground">{annotationTypeLabels[item.annotation.type]}</span>
                                {item.annotation.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-1.5 py-0.5">#{tag}</span>)}
                                {item.annotation.reminderAt && <span className="rounded-full bg-muted px-1.5 py-0.5">Lembrete: {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.annotation.reminderAt))}</span>}
                              </div>
                            )}
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            {book && (
                              <Link
                                href={item.nodeKey
                                  ? `/dashboard/biblioteca/${book.id}?node=${encodeURIComponent(item.nodeKey)}`
                                  : `/dashboard/biblioteca/${book.id}?text=${encodeURIComponent(item.selectedText)}`}
                                className="inline-flex items-center text-[11px] font-semibold text-primary hover:underline"
                              >
                                Abrir no trecho <ArrowUpRight className="ml-1 size-3.5" />
                              </Link>
                            )}
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={busyId === item.id}
                                  className="h-7 rounded-md px-1.5 text-[11px] text-muted-foreground"
                                  onClick={() => updateItem(item, item.archivedAt ? "restore" : "archive")}
                                >
                                  <Archive className="mr-1.5 size-3.5" />
                                  {item.archivedAt ? "Restaurar" : "Arquivar"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  disabled={busyId === item.id}
                                  className="h-7 rounded-md px-1.5 text-[11px] text-destructive hover:text-destructive"
                                  onClick={() => updateItem(item, "delete")}
                                >
                                  <Trash2 className="mr-1.5 size-3.5" />
                                  Apagar
                                </Button>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}
          </div>
        </main>
        <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar conteúdo?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação remove permanentemente {mode === "annotations" ? "a anotação" : "a marcação"}. O conteúdo não poderá ser recuperado depois.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Apagar permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
