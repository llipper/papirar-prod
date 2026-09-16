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
import { DashboardHeader } from "@/components/dashboard-header"
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
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Biblioteca</p>
              <p className="truncate text-xs text-muted-foreground">Catálogo de legislação</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DashboardHeader />
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto w-full max-w-7xl">
            <div className="mb-10 text-center sm:mb-12">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Legislação & Códigos
              </p>
              <h1 className="mt-1 font-heading text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                Biblioteca Jurídica
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Explore leis organizadas, atualizadas e com áudio explicativo integrado.
              </p>
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
