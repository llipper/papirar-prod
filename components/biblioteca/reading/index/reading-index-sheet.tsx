"use client"

import React, { useMemo, useState } from "react"
import { BookOpen, ChevronRight, FolderOpen, List, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import type { BibliotecaReadingPresentation } from "@/lib/biblioteca/catalog-data"
import type { LawReading } from "@/lib/biblioteca/reading-service"
import { articleHeading, structuralContent } from "../node/reading-node-utils"

export type ReadingIndexEntry = {
  nodeKey: string
  label: string
  searchText: string
  level: number
  nodeType: string
}

export function ReadingIndexSheet({
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
