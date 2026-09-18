"use client"

import React, { useRef, useState } from "react"
import {
  AlertCircle,
  Bold,
  Calendar,
  ChevronDown,
  CircleHelp,
  FileEdit,
  FileText,
  HelpCircle,
  Italic,
  Layers,
  Link,
  Link2,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Trash2,
  Underline,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ReadingAnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  noteDraft: string
  onNoteDraftChange: (value: string) => void
  isSavingContent: boolean
  onSave: () => void
  selectedText?: string
  nodeLocation?: string
  onClearSelection?: () => void
}

const COLOR_OPTIONS = [
  { id: "yellow", bg: "#F5C563", label: "Amarelo" },
  { id: "red", bg: "#FB7185", label: "Vermelho" },
  { id: "blue", bg: "#60A5FA", label: "Azul" },
  { id: "green", bg: "#4ADE80", label: "Verde" },
  { id: "purple", bg: "#C084FC", label: "Roxo" },
  { id: "gray", bg: "#E2E8F0", label: "Cinza" },
]

const ANNOTATION_TYPES = [
  { id: "geral", label: "Geral", icon: FileText },
  { id: "duvida", label: "Dúvida", icon: HelpCircle },
  { id: "importante", label: "Importante", icon: AlertCircle },
  { id: "resumo", label: "Resumo", icon: Layers },
  { id: "revisar", label: "Revisar", icon: RotateCcw },
]

export function ReadingAnnotationDialog({
  open,
  onOpenChange,
  noteDraft,
  onNoteDraftChange,
  isSavingContent,
  onSave,
  selectedText,
  nodeLocation,
  onClearSelection,
}: ReadingAnnotationDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedColor, setSelectedColor] = useState("yellow")
  const [selectedType, setSelectedType] = useState("geral")
  const [tags, setTags] = useState<string[]>(["Conceito", "Princípio", "Federalismo"])
  const [tagInput, setTagInput] = useState("")
  const [reminderDate, setReminderDate] = useState("")

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = noteDraft.substring(start, end)
    const replacement = `${prefix}${selected || "texto"}${suffix}`

    const nextValue =
      noteDraft.substring(0, start) + replacement + noteDraft.substring(end)
    onNoteDraftChange(nextValue)

    window.setTimeout(() => {
      textarea.focus()
      const newPos = start + prefix.length + (selected ? selected.length : 5)
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const trimmed = tagInput.trim().replace(/^,|,$/g, "")
      if (trimmed && !tags.includes(trimmed)) {
        setTags([...tags, trimmed])
      }
      setTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleClearSelection = () => {
    onClearSelection?.()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-6 rounded-2xl max-h-[92vh] overflow-y-auto">
        {/* CABEÇALHO */}
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-2.5 text-xl font-heading">
            <span className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-foreground">
              <FileEdit className="size-5" />
            </span>
            Adicionar anotação
          </DialogTitle>
          <p className="text-xs sm:text-sm text-muted-foreground font-reading">
            Registre suas ideias, dúvidas ou lembretes para revisar depois.
          </p>
        </DialogHeader>

        {/* CORPO: 2 COLUNAS */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 pt-2 pb-2">
          {/* COLUNA ESQUERDA: EDITOR */}
          <div className="flex flex-col rounded-2xl border border-border/80 bg-muted/15 dark:bg-muted/5 p-3.5 space-y-3">
            {/* BARRA DE FERRAMENTAS */}
            <div className="flex flex-wrap items-center gap-1 border-b border-border/60 pb-2.5 text-muted-foreground">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Texto <ChevronDown className="size-3.5 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => insertFormatting("")}>
                    Normal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertFormatting("### ")}>
                    Título
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => insertFormatting("#### ")}>
                    Subtítulo
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-px bg-border/80 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("**", "**")}
                title="Negrito"
              >
                <Bold className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("*", "*")}
                title="Itálico"
              >
                <Italic className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("<u>", "</u>")}
                title="Sublinhado"
              >
                <Underline className="size-3.5" />
              </Button>

              <div className="h-4 w-px bg-border/80 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("- ")}
                title="Lista com marcadores"
              >
                <List className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("1. ")}
                title="Lista numerada"
              >
                <ListOrdered className="size-3.5" />
              </Button>

              <div className="h-4 w-px bg-border/80 mx-1" />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("[", "](url)")}
                title="Inserir link"
              >
                <Link className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onClick={() => insertFormatting("> ")}
                title="Citação"
              >
                <Quote className="size-3.5" />
              </Button>
            </div>

            {/* TEXTAREA DO EDITOR */}
            <Textarea
              ref={textareaRef}
              value={noteDraft}
              onChange={(event) => onNoteDraftChange(event.target.value)}
              placeholder="Escreva sua anotação aqui..."
              maxLength={5000}
              autoFocus
              className="min-h-[260px] flex-1 resize-none border-0 bg-transparent p-1 shadow-none focus-visible:ring-0 font-reading text-base leading-relaxed placeholder:text-muted-foreground/60"
            />

            {/* RODAPÉ DO EDITOR */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/40">
              <span>Esta anotação ficará vinculada ao trecho selecionado.</span>
              <span>{noteDraft.length}/5000</span>
            </div>
          </div>

          {/* COLUNA DIREITA: CONFIGURAÇÕES E VÍNCULO */}
          <div className="space-y-4">
            {/* 1. COR DA ANOTAÇÃO */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Cor da anotação
              </label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.id)}
                    className={`size-7 rounded-full transition-transform duration-150 ${
                      selectedColor === color.id
                        ? "scale-110 ring-2 ring-foreground/40 ring-offset-2 dark:ring-offset-background"
                        : "hover:scale-105 opacity-85 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: color.bg }}
                    aria-label={`Cor ${color.label}`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* 2. TIPO DE ANOTAÇÃO */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Tipo de anotação
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ANNOTATION_TYPES.map((type) => {
                  const Icon = type.icon
                  const isActive = selectedType === type.id
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                        isActive
                          ? "border-amber-400/80 bg-amber-100/70 text-amber-950 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100 font-semibold"
                          : "border-border/80 bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 3. TAGS (OPCIONAL) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Tags <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span>
              </label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Adicione uma tag..."
                className="h-8 rounded-xl text-xs"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Remover tag ${tag}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4. LEMBRETE (OPCIONAL) */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">
                Lembrete <span className="text-[11px] font-normal text-muted-foreground">(opcional)</span>
              </label>
              <div className="relative">
                <Calendar className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="datetime-local"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="flex h-8 w-full rounded-xl border border-input bg-background pl-8 pr-2.5 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Selecionar data e hora"
                />
              </div>
            </div>

            {/* 5. VINCULADA AO TRECHO */}
            <div className="rounded-xl border border-border/70 bg-muted/30 p-3 flex items-start gap-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-background border border-border/80 text-muted-foreground mt-0.5">
                <Link2 className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Vinculada ao trecho
                </p>
                <p className="line-clamp-2 text-xs font-medium text-foreground leading-snug">
                  {selectedText ? `“${selectedText}”` : "Trecho selecionado"}
                </p>
                {nodeLocation && (
                  <p className="truncate text-[11px] text-muted-foreground pt-0.5">
                    {nodeLocation}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div className="flex items-center justify-between pt-3 border-t border-border/80 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Excluir seleção
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!noteDraft.trim() || isSavingContent}
              onClick={onSave}
              className="rounded-xl text-xs bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 font-medium px-4 gap-1.5 shadow-xs"
            >
              <FileEdit className="size-3.5" />
              {isSavingContent ? "Salvando..." : "Salvar anotação"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
