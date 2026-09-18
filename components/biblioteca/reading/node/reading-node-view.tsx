"use client"

import React, { memo } from "react"
import type { BibliotecaReadingPresentation } from "@/lib/biblioteca/catalog-data"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"
import type {
  LawAnnotation,
  LawHighlight,
} from "@/lib/biblioteca/law-user-content-service"
import { ReadingStructuralNode } from "./reading-structural-node"
import { ReadingArticleNode } from "./reading-article-node"

export interface ReadingNodeViewProps {
  node: ReadingNode
  readingPresentation?: BibliotecaReadingPresentation
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
}

function ReadingNodeViewComponent({
  node,
  readingPresentation,
  highlights,
  annotations,
  onAnnotationUpdated,
}: ReadingNodeViewProps) {
  const isStructural = [
    "parte",
    "titulo",
    "capitulo",
    "secao",
    "subsecao",
  ].includes(node.nodeType)

  if (isStructural) {
    return (
      <ReadingStructuralNode
        node={node}
        readingPresentation={readingPresentation}
        highlights={highlights}
        annotations={annotations}
        onAnnotationUpdated={onAnnotationUpdated}
      />
    )
  }

  return (
    <ReadingArticleNode
      node={node}
      readingPresentation={readingPresentation}
      highlights={highlights}
      annotations={annotations}
      onAnnotationUpdated={onAnnotationUpdated}
    />
  )
}

export const ReadingNodeView = memo(ReadingNodeViewComponent)
