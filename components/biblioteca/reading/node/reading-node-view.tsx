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
import type { ReadingFontScale } from "../reading-dashboard-header"

export interface ReadingNodeViewProps {
  node: ReadingNode
  readingPresentation?: BibliotecaReadingPresentation
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
  fontScale: ReadingFontScale
}

function ReadingNodeViewComponent({
  node,
  readingPresentation,
  highlights,
  annotations,
  onAnnotationUpdated,
  fontScale,
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
        fontScale={fontScale}
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
      fontScale={fontScale}
    />
  )
}

export const ReadingNodeView = memo(ReadingNodeViewComponent)
