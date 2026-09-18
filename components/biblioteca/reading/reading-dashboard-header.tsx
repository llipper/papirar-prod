"use client"

import React from "react"
import Link from "next/link"
import { BookOpen, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { LawReading } from "@/lib/biblioteca/reading-service"

export interface ReadingDashboardHeaderProps {
  reading?: LawReading | null
  onOpenIndex?: () => void
}

export function ReadingDashboardHeader({
  reading,
  onOpenIndex,
}: ReadingDashboardHeaderProps) {
  return (
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
        onClick={onOpenIndex}
        aria-label="Abrir índice da lei"
        title="Índice"
      >
        <BookOpen />
      </Button>
    </header>
  )
}
