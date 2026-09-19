"use client"

import React, { useState } from "react"
import {
  Copy,
  Check,
  Headphones,
  Highlighter,
  MoreVertical,
  StickyNote,
  Trash2,
  Underline as UnderlineIcon,
  Search,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { LawHighlightColor, LawHighlightStyle } from "@/lib/biblioteca/law-user-content-service"
import type { TextSelection } from "@/lib/biblioteca/hooks/use-reading-selection"

export interface ReadingSelectionMenuProps {
  selection: TextSelection
  isSavingContent: boolean
  selectionHasHighlight: boolean
  onAnnotate: () => void
  onHighlight: (color: LawHighlightColor, style: LawHighlightStyle) => void
  onRemoveHighlight: (sel: TextSelection) => void
  onCancel: () => void
  containerRef?: React.RefObject<HTMLElement | null>
}

const PALETTE: Array<{ id: LawHighlightColor; bg: string; label: string }> = [
  { id: "yellow", bg: "#FBBF24", label: "Amarelo" },
  { id: "blue", bg: "#60A5FA", label: "Azul" },
  { id: "green", bg: "#4ADE80", label: "Verde" },
  { id: "red", bg: "#FB7185", label: "Rosa / Vermelho" },
  { id: "purple", bg: "#A855F7", label: "Roxo" },
  { id: "orange", bg: "#FB923C", label: "Laranja" },
  { id: "beige", bg: "#FEF3C7", label: "Bege" },
]

export function ReadingSelectionMenu({
  selection,
  isSavingContent,
  selectionHasHighlight,
  onAnnotate,
  onHighlight,
  onRemoveHighlight,
  onCancel,
  containerRef,
}: ReadingSelectionMenuProps) {
  const [activeColor, setActiveColor] = useState<LawHighlightColor>("yellow")
  const [copied, setCopied] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const handleColorClick = (colorId: LawHighlightColor) => {
    setActiveColor(colorId)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selection.selectedText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Ignora erro de clipboard se houver restrição
    }
  }

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(selection.selectedText)
    utterance.lang = "pt-BR"
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  const handleSearch = () => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      selection.selectedText
    )}`
    window.open(url, "_blank", "noopener,noreferrer")
    onCancel()
  }

  return (
    <div
      data-selection-menu
      className="fixed z-50 flex w-[300px] flex-col rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{ top: selection.top, left: selection.left }}
      onMouseDown={(event) => event.preventDefault()}
      onWheel={(event) => {
        containerRef?.current?.scrollBy({
          top: event.deltaY,
          left: event.deltaX,
          behavior: "auto",
        })
      }}
    >
      {/* LINHA 1: CORES */}
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        {PALETTE.map((c) => (
          <button
            key={c.bg}
            type="button"
            disabled={isSavingContent}
            onClick={() => handleColorClick(c.id)}
            className={`size-6 rounded-full transition-transform duration-150 ${
              activeColor === c.id
                ? "scale-110 ring-2 ring-foreground/40 ring-offset-2 dark:ring-offset-background"
                : "hover:scale-110 opacity-90 hover:opacity-100"
            }`}
            style={{ backgroundColor: c.bg }}
            aria-pressed={activeColor === c.id}
            title={`Destacar em ${c.label}`}
            aria-label={`Destacar em ${c.label}`}
          />
        ))}

        {/* 7º BOTÃO: DESMARCAR / REMOVER DESTAQUE */}
        <button
          type="button"
          disabled={isSavingContent}
          onClick={() => onRemoveHighlight(selection)}
          className={`size-6 rounded-md border border-border/80 bg-[#FEF3C7] dark:bg-[#78350f]/30 flex items-center justify-center transition-transform duration-150 hover:scale-110 ${
            selectionHasHighlight
              ? "ring-2 ring-destructive/60 scale-105"
              : "opacity-80 hover:opacity-100"
          }`}
          title="Desmarcar / Remover destaque"
          aria-label="Desmarcar / Remover destaque"
        >
          {selectionHasHighlight ? (
            <Trash2 className="size-3 text-destructive" />
          ) : (
            <X className="size-3 text-muted-foreground/60" />
          )}
        </button>
      </div>

      {/* LINHA 2: AÇÕES */}
      <div className="flex items-center justify-between border-t border-border/60 pt-1.5 px-0.5">
        {/* DESTACAR OU DESMARCAR */}
        {selectionHasHighlight ? (
          <button
            type="button"
            disabled={isSavingContent}
            onClick={() => onRemoveHighlight(selection)}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-destructive hover:bg-destructive/10 transition-colors"
            title="Desmarcar destaque"
          >
            <Trash2 className="size-4 stroke-[1.8]" />
            <span className="text-[10px] font-medium leading-none">Desmarcar</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isSavingContent}
            onClick={() => onHighlight(activeColor, "highlight")}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
            title="Destacar"
          >
            <Highlighter className="size-4 stroke-[1.8]" />
            <span className="text-[10px] font-medium leading-none">Destacar</span>
          </button>
        )}

        {/* SUBLINHAR */}
        <button
          type="button"
          disabled={isSavingContent}
            onClick={() => onHighlight(activeColor, "underline")}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
          title="Sublinhar"
        >
          <UnderlineIcon className="size-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-none">Sublinhar</span>
        </button>

        {/* ANOTAR */}
        <button
          type="button"
          disabled={isSavingContent}
          onClick={onAnnotate}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
          title="Anotar"
        >
          <StickyNote className="size-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-none">Anotar</span>
        </button>

        {/* DIVISOR VERTICAL */}
        <div className="h-6 w-px bg-border/70 mx-1 shrink-0" />

        {/* COPIAR */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
          title={copied ? "Copiado!" : "Copiar"}
        >
          {copied ? (
            <Check className="size-4 stroke-[1.8] text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy className="size-4 stroke-[1.8]" />
          )}
          <span className="text-[10px] font-medium leading-none">
            {copied ? "Copiado" : "Copiar"}
          </span>
        </button>

        {/* OUVIR */}
        <button
          type="button"
          onClick={handleSpeak}
          className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-colors ${
            isSpeaking
              ? "bg-primary/10 text-primary font-semibold"
              : "text-foreground/80 hover:bg-muted hover:text-foreground"
          }`}
          title={isSpeaking ? "Parar leitura" : "Ouvir trecho"}
        >
          <Headphones className="size-4 stroke-[1.8]" />
          <span className="text-[10px] font-medium leading-none">
            {isSpeaking ? "Parar" : "Ouvir"}
          </span>
        </button>

        {/* MAIS */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
              title="Mais opções"
            >
              <MoreVertical className="size-4 stroke-[1.8]" />
              <span className="text-[10px] font-medium leading-none">Mais</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl min-w-[170px]">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault()
                onRemoveHighlight(selection)
              }}
              disabled={isSavingContent}
              className="text-destructive focus:text-destructive gap-2 text-xs cursor-pointer"
            >
              <Trash2 className="size-3.5" />
              Desmarcar destaque
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSearch} className="gap-2 text-xs">
              <Search className="size-3.5" />
              Pesquisar no Google
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCancel} className="gap-2 text-xs text-muted-foreground">
              <X className="size-3.5" />
              Cancelar seleção
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
