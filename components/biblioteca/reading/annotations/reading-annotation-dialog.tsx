"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
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
import {
  defaultAnnotationDetails,
  type AnnotationDetails,
  type LawAnnotationColor,
  type LawAnnotationType,
} from "@/lib/biblioteca/law-user-content-service"

export interface ReadingAnnotationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isSavingContent: boolean
  onSave: (note: string, details: AnnotationDetails) => Promise<void>
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
] as const satisfies ReadonlyArray<{ id: LawAnnotationColor; bg: string; label: string }>

const ANNOTATION_TYPES = [
  { id: "general", label: "Geral", icon: FileText },
  { id: "question", label: "Dúvida", icon: HelpCircle },
  { id: "important", label: "Importante", icon: AlertCircle },
  { id: "summary", label: "Resumo", icon: Layers },
  { id: "review", label: "Revisar", icon: RotateCcw },
] as const satisfies ReadonlyArray<{ id: LawAnnotationType; label: string; icon: typeof FileText }>

function markdownFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? ""
  if (node.nodeType !== Node.ELEMENT_NODE) return ""

  const element = node as HTMLElement
  const content = Array.from(element.childNodes).map(markdownFromNode).join("")

  switch (element.tagName) {
    case "BR":
      return "\n"
    case "STRONG":
    case "B":
      return `**${content}**`
    case "EM":
    case "I":
      return `*${content}*`
    case "U":
      return `<u>${content}</u>`
    case "A": {
      const href = element.getAttribute("href") ?? ""
      return /^https?:\/\//i.test(href) ? `[${content}](${href})` : content
    }
    case "H3":
      return `### ${content.trim()}\n\n`
    case "H4":
      return `#### ${content.trim()}\n\n`
    case "BLOCKQUOTE":
      return `> ${content.trim()}\n\n`
    case "LI": {
      const parent = element.parentElement
      const index = Array.from(parent?.children ?? []).indexOf(element) + 1
      const prefix = parent?.tagName === "OL" ? `${index}. ` : "- "
      return `${prefix}${content.trim()}\n`
    }
    case "P":
    case "DIV":
      return `${content}\n`
    default:
      return content
  }
}

function editorMarkdown(editor: HTMLElement): string {
  return Array.from(editor.childNodes)
    .map(markdownFromNode)
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function ReadingAnnotationDialog({
  open,
  onOpenChange,
  isSavingContent,
  onSave,
  selectedText,
  nodeLocation,
  onClearSelection,
}: ReadingAnnotationDialogProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const selectionRangeRef = useRef<Range | null>(null)
  const [selectedColor, setSelectedColor] = useState<LawAnnotationColor>(defaultAnnotationDetails.color)
  const [selectedType, setSelectedType] = useState<LawAnnotationType>(defaultAnnotationDetails.type)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [reminderDate, setReminderDate] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [noteLength, setNoteLength] = useState(0)

  const syncNoteLength = useCallback(() => {
    if (!editorRef.current) return ""
    const note = editorMarkdown(editorRef.current)
    setNoteLength(note.length)
    return note
  }, [])

  const rememberSelection = useCallback(() => {
    const editor = editorRef.current
    const selection = window.getSelection()
    if (!editor || !selection?.rangeCount) return
    const range = selection.getRangeAt(0)
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = range.cloneRange()
    }
  }, [])

  const restoreSelection = useCallback(() => {
    const range = selectionRangeRef.current
    if (!range) return
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [])

  useEffect(() => {
    if (!open || !editorRef.current) return
    editorRef.current.replaceChildren()
    selectionRangeRef.current = null
    setNoteLength(0)
    window.requestAnimationFrame(() => editorRef.current?.focus())
  }, [open])

  const resetDetails = () => {
    setSelectedColor(defaultAnnotationDetails.color)
    setSelectedType(defaultAnnotationDetails.type)
    setTags([])
    setTagInput("")
    setReminderDate("")
    setSaveError(null)
  }

  const commitTag = () => {
    const trimmed = tagInput.trim().replace(/^,|,$/g, "")
    if (trimmed && !tags.some((tag) => tag.localeCompare(trimmed, undefined, { sensitivity: "accent" }) === 0) && tags.length < 12) {
      setTags((current) => [...current, trimmed.slice(0, 48)])
    }
    setTagInput("")
  }

  const applyCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand(command, false, value)
    rememberSelection()
    syncNoteLength()
  }

  const applyNormalText = () => {
    editorRef.current?.focus()
    restoreSelection()
    document.execCommand("formatBlock", false, "p")
    document.execCommand("removeFormat", false)
    rememberSelection()
    syncNoteLength()
  }

  const insertLink = () => {
    const selected = window.getSelection()?.toString().trim()
    if (!selected) return
    const url = window.prompt("Cole o link completo (https://...)")?.trim()
    if (!url || !/^https?:\/\//i.test(url)) return
    applyCommand("createLink", url)
  }

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      commitTag()
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleClearSelection = () => {
    editorRef.current?.replaceChildren()
    setNoteLength(0)
    resetDetails()
    onClearSelection?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    editorRef.current?.replaceChildren()
    setNoteLength(0)
    resetDetails()
    onOpenChange(false)
  }

  const handleSave = async () => {
    const note = syncNoteLength()
    const pendingTag = tagInput.trim().replace(/^,|,$/g, "")
    const finalTags = pendingTag && !tags.some((tag) => tag.localeCompare(pendingTag, undefined, { sensitivity: "accent" }) === 0)
      ? [...tags, pendingTag.slice(0, 48)].slice(0, 12)
      : tags
    setSaveError(null)
    try {
      await onSave(note, {
        color: selectedColor,
        type: selectedType,
        tags: finalTags,
        reminderAt: reminderDate ? new Date(reminderDate).toISOString() : null,
      })
      resetDetails()
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Não foi possível salvar a anotação.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => nextOpen ? onOpenChange(true) : handleCancel()}>
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
                  <DropdownMenuItem onClick={applyNormalText}>
                    Normal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyCommand("formatBlock", "h3")}>
                    Título
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => applyCommand("formatBlock", "h4")}>
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
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("bold")}
                title="Negrito"
              >
                <Bold className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("italic")}
                title="Itálico"
              >
                <Italic className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("underline")}
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
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertUnorderedList")}
                title="Lista com marcadores"
              >
                <List className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("insertOrderedList")}
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
                onMouseDown={(event) => event.preventDefault()}
                onClick={insertLink}
                title="Inserir link"
              >
                <Link className="size-3.5" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 rounded-md hover:bg-muted hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyCommand("formatBlock", "blockquote")}
                title="Citação"
              >
                <Quote className="size-3.5" />
              </Button>
            </div>

            {/* EDITOR VISUAL: o conteúdo só sai do modal ao salvar. */}
            <div
              ref={editorRef}
              contentEditable
              role="textbox"
              aria-multiline="true"
              aria-label="Conteúdo da anotação"
              data-placeholder="Escreva sua anotação aqui..."
              suppressContentEditableWarning
              onBeforeInput={(event) => {
                const typed = (event.nativeEvent as InputEvent).data ?? ""
                const currentLength = editorRef.current?.innerText.length ?? 0
                if (typed && currentLength + typed.length > 5000) {
                  event.preventDefault()
                }
              }}
              onInput={() => {
                rememberSelection()
                syncNoteLength()
              }}
              onKeyUp={rememberSelection}
              onMouseUp={rememberSelection}
              onPaste={(event) => {
                event.preventDefault()
                const available = Math.max(
                  0,
                  5000 - (editorRef.current?.innerText.length ?? 0)
                )
                const text = event.clipboardData
                  .getData("text/plain")
                  .slice(0, available)
                document.execCommand("insertText", false, text)
                rememberSelection()
                syncNoteLength()
              }}
              className="min-h-[260px] flex-1 whitespace-pre-wrap rounded-md p-1 font-reading text-base leading-relaxed outline-none empty:before:pointer-events-none empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)]"
            />

            {/* RODAPÉ DO EDITOR */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground border-t border-border/40">
              <span>Esta anotação ficará vinculada ao trecho selecionado.</span>
              <span>{noteLength}/5000</span>
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
                onBlur={commitTag}
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

        {saveError && (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {saveError}
          </p>
        )}

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
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={noteLength === 0 || isSavingContent}
              onClick={handleSave}
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
