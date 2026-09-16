"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, BookOpen, X } from "lucide-react"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"

export function HeaderSearch() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
  }, [searchOpen])

  const results = query.trim()
    ? bibliotecaBooks.filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.acronym.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  function handleSelect(bookId: string) {
    setSearchOpen(false)
    setQuery("")
    router.push(`/dashboard/biblioteca/${bookId}`)
  }

  return (
    <div className="relative">
      {searchOpen ? (
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearchOpen(false)
                setQuery("")
              }
            }}
            aria-label="Buscar legislação"
            placeholder="Buscar legislação, códigos..."
            className="h-8 w-56 sm:w-64 rounded-full border border-border/60 bg-muted px-3 pr-8 text-xs text-foreground ring-1 ring-transparent outline-none transition-all focus:border-border focus:ring-ring/40"
          />
          <button
            type="button"
            onClick={() => {
              setSearchOpen(false)
              setQuery("")
            }}
            className="absolute right-2 text-muted-foreground hover:text-foreground cursor-pointer"
            aria-label="Fechar busca"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Buscar"
          onClick={() => setSearchOpen(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer transition-colors"
        >
          <Search className="size-3.5" />
          <span>Buscar</span>
        </button>
      )}

      {searchOpen && query.trim() && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setSearchOpen(false)}
          />
          <div className="absolute top-10 left-0 z-50 w-72 sm:w-80 rounded-2xl bg-popover p-2 shadow-lg ring-1 ring-border/50 animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="max-h-72 overflow-y-auto">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs hover:bg-muted cursor-pointer transition-colors"
                >
                  <BookOpen className="size-3.5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.category} • {item.acronym}</p>
                  </div>
                </button>
              ))}
              {results.length === 0 && (
                <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Nenhuma legislação encontrada para &quot;{query}&quot;.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
