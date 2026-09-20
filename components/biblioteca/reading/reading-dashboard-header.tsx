"use client"

import React from "react"
import Link from "next/link"
import {
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  EllipsisVertical,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { LawReading } from "@/lib/biblioteca/reading-service"

export type ReadingFontScale = "compact" | "default" | "comfortable"

const fontScaleOptions: Array<{
  value: ReadingFontScale
  label: string
  description: string
}> = [
  { value: "compact", label: "Compacto", description: "Texto menor" },
  { value: "default", label: "Padrão", description: "Leitura equilibrada" },
  { value: "comfortable", label: "Ampliado", description: "Texto maior" },
]

export interface ReadingDashboardHeaderProps {
  reading?: LawReading | null
  onOpenIndex?: () => void
  fontScale?: ReadingFontScale
  onFontScaleChange?: (scale: ReadingFontScale) => void
}

export function ReadingDashboardHeader({
  reading,
  onOpenIndex,
  fontScale = "default",
  onFontScaleChange,
}: ReadingDashboardHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <header className="flex h-14 shrink-0 items-center gap-1 border-b px-2 sm:h-16 sm:gap-3 sm:px-4">
      <SidebarTrigger className="-ml-1 hidden sm:inline-flex" />
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="hidden min-[360px]:inline-flex text-black dark:text-white"
        aria-label="Voltar para a Biblioteca"
      >
        <Link href="/dashboard/biblioteca">
          <ChevronLeft />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-muted-foreground">
          {reading?.acronym ?? "Biblioteca"}
        </p>
        <h1 className="truncate font-heading text-base font-bold">
          {reading?.title ?? "Leitura"}
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="hidden text-black min-[360px]:inline-flex dark:text-white"
              aria-label="Ajustar tamanho do texto"
              title="Tamanho do texto"
            >
              <span className="font-serif text-xs font-semibold" aria-hidden="true">
                Aa
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Tamanho do texto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {fontScaleOptions.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onSelect={() => onFontScaleChange?.(option.value)}
                className="cursor-pointer"
              >
                <span className="flex-1">
                  <span className="block text-xs font-medium">{option.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{option.description}</span>
                </span>
                {fontScale === option.value ? <Check className="size-3.5 text-primary" /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="hidden text-black sm:inline-flex dark:text-white"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
          title={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>

        <Button
          asChild
          variant="ghost"
          size="icon"
          className="hidden text-black min-[360px]:inline-flex dark:text-white"
          aria-label="Ver marcações"
          title="Marcações"
        >
          <Link href="/dashboard/marcacoes">
            <Bookmark />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-black dark:text-white"
              aria-label="Mais opções de leitura"
              title="Mais opções"
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="sm:hidden">Leitura</DropdownMenuLabel>
            <div className="sm:hidden">
              {fontScaleOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={() => onFontScaleChange?.(option.value)}
                  className="cursor-pointer"
                >
                  <span className="flex-1 text-xs">Texto {option.label.toLowerCase()}</span>
                  {fontScale === option.value ? <Check className="size-3.5 text-primary" /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onSelect={() => setTheme(isDark ? "light" : "dark")}
                className="cursor-pointer"
              >
                {isDark ? <Sun /> : <Moon />}
                {isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="sm:hidden" />
            <DropdownMenuItem onSelect={onOpenIndex} className="cursor-pointer">
              <BookOpen />
              Abrir índice
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link href="/dashboard/marcacoes">
                <Bookmark />
                Ver marcações
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="hidden text-black sm:inline-flex dark:text-white"
          onClick={onOpenIndex}
          aria-label="Abrir índice da lei"
          title="Índice"
        >
          <BookOpen />
        </Button>
      </div>
    </header>
  )
}
