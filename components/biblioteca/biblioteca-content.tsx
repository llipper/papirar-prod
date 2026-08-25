"use client"

import { Search, X } from "lucide-react"
import { useMemo, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  bibliotecaBooks,
  bibliotecaCategories,
} from "@/lib/biblioteca/catalog-data"
import { BibliotecaCategorySection } from "./biblioteca-category-section"

export function BibliotecaContent() {
  const [query, setQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const categories = useMemo(() => {
    const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean)
    return bibliotecaCategories
      .map((category) => ({
        category,
        books: bibliotecaBooks.filter((book) => {
          const text = `${book.title} ${book.acronym} ${book.category}`.toLocaleLowerCase()
          return book.category === category && words.every((word) => text.includes(word))
        }),
      }))
      .filter(({ books }) => books.length > 0)
  }, [query])

  const clearSearch = () => {
    setQuery("")
    setIsSearchOpen(false)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          {isSearchOpen ? (
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar"
                  className="h-9 rounded-full pl-9 pr-9"
                  aria-label="Buscar na Biblioteca"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label="Limpar busca"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={clearSearch} aria-label="Fechar busca">
                <X />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Buscar na Biblioteca"
            >
              <Search />
            </Button>
          )}
        </header>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="mx-auto min-w-0 w-full max-w-7xl flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 lg:px-10">
            <div className="mb-10 text-center sm:mb-12">
              <p className="font-serif text-[8px] font-bold text-foreground">
                My Favourite
              </p>
              <h1 className="font-serif text-4xl font-black leading-none tracking-tight sm:text-5xl">
                BOOKS
              </h1>
            </div>

            <div className="space-y-10 pb-10">
              {categories.length > 0 ? (
                categories.map(({ category, books }) => (
                  <BibliotecaCategorySection key={category} category={category} books={books} />
                ))
              ) : (
                <p className="py-12 text-center text-sm font-semibold text-muted-foreground">
                  Nenhum livro encontrado para “{query.trim()}”.
                </p>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
