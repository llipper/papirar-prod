"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export type TextSelection = {
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  top: number
  left: number
}

function closestElement(node: Node | null, selector: string): Element | null {
  const element =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement
  return element?.closest(selector) ?? null
}

export function useReadingSelection(isNoteOpen: boolean) {
  const [selection, setSelection] = useState<TextSelection | null>(null)
  const selectionFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (selectionFrameRef.current !== null) {
        window.cancelAnimationFrame(selectionFrameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selection || isNoteOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.button !== 0) return
      const target = event.target
      if (
        target instanceof Element &&
        (target.closest("[data-selection-menu]") ||
          target.closest("[data-radix-popper-content-wrapper]") ||
          target.closest("[role='menu']") ||
          target.closest("[role='menuitem']") ||
          target.closest("[role='dialog']"))
      ) {
        return
      }
      window.getSelection()?.removeAllRanges()
      setSelection(null)
    }

    document.addEventListener("pointerdown", closeOnOutsideClick)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick)
    }
  }, [selection, isNoteOpen])

  const handleTextSelection = useCallback((position?: { top: number; left: number }) => {
    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current)
    }

    selectionFrameRef.current = window.requestAnimationFrame(() => {
      selectionFrameRef.current = null
      const browserSelection = window.getSelection()
      if (!browserSelection || browserSelection.rangeCount === 0) return

      const range = browserSelection.getRangeAt(0)
      const selectedText = browserSelection.toString().trim()
      const nodeRoot = closestElement(
        range.commonAncestorContainer,
        "[data-node-key]"
      )
      const textRoot =
        closestElement(range.startContainer, "[data-node-text]") ?? nodeRoot
      const endTextRoot =
        closestElement(range.endContainer, "[data-node-text]") ?? nodeRoot
      const selectionRoot = textRoot === endTextRoot ? textRoot : nodeRoot

      if (!selectedText || !selectionRoot || !nodeRoot) return
      if (
        !selectionRoot.contains(range.startContainer) ||
        !selectionRoot.contains(range.endContainer)
      ) {
        return
      }

      const startRange = document.createRange()
      startRange.selectNodeContents(selectionRoot)
      startRange.setEnd(range.startContainer, range.startOffset)
      const endRange = document.createRange()
      endRange.selectNodeContents(selectionRoot)
      endRange.setEnd(range.endContainer, range.endOffset)
      const rect = range.getBoundingClientRect()
      const menuWidth = 310
      const menuHeight = 96
      const spaceAbove = rect.top
      const preferredTop =
        position?.top ??
        (spaceAbove > menuHeight + 14
          ? rect.top - menuHeight - 8
          : rect.bottom + 8)
      const preferredLeft =
        position?.left ?? rect.left + rect.width / 2 - menuWidth / 2
      const top = Math.max(
        8,
        Math.min(window.innerHeight - menuHeight - 8, preferredTop)
      )
      const left = Math.max(
        12,
        Math.min(window.innerWidth - menuWidth - 12, preferredLeft)
      )

      const nextSelection: TextSelection = {
        nodeKey: nodeRoot.getAttribute("data-node-key") ?? "",
        selectedText,
        startOffset: startRange.toString().length,
        endOffset: endRange.toString().length,
        top: Math.max(8, Math.min(window.innerHeight - 8, top)),
        left,
      }

      setSelection((current) => {
        if (
          current &&
          current.nodeKey === nextSelection.nodeKey &&
          current.selectedText === nextSelection.selectedText &&
          current.startOffset === nextSelection.startOffset &&
          current.endOffset === nextSelection.endOffset &&
          current.top === nextSelection.top &&
          current.left === nextSelection.left
        ) {
          return current
        }
        return nextSelection
      })
    })
  }, [])

  const clearTextSelection = useCallback(() => {
    if (selectionFrameRef.current !== null) {
      window.cancelAnimationFrame(selectionFrameRef.current)
      selectionFrameRef.current = null
    }
    window.getSelection()?.removeAllRanges()
    setSelection(null)
  }, [])

  return {
    selection,
    setSelection,
    handleTextSelection,
    clearTextSelection,
  }
}
