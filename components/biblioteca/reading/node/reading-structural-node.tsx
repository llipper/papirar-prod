"use client"

import React from "react"
import type { BibliotecaReadingPresentation } from "@/lib/biblioteca/catalog-data"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"
import type {
  LawAnnotation,
  LawHighlight,
} from "@/lib/biblioteca/law-user-content-service"
import {
  structuralContent,
  structuralLabelSize,
  structuralSpacing,
  structuralTextSize,
} from "./reading-node-utils"
import { renderMarkedText } from "../annotations/annotation-text"
import { ReadingAudioButton } from "../audio/reading-audio-button"
import type { ReadingFontScale } from "../reading-dashboard-header"

export interface ReadingStructuralNodeProps {
  node: ReadingNode
  readingPresentation?: BibliotecaReadingPresentation
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
  fontScale: ReadingFontScale
}

export function ReadingStructuralNode({
  node,
  readingPresentation,
  highlights,
  annotations,
  onAnnotationUpdated,
  fontScale,
}: ReadingStructuralNodeProps) {
  const content = structuralContent(node, readingPresentation)
  const descriptionTextSize = {
    compact: "text-[0.85rem]",
    default: structuralTextSize[node.nodeType] ?? "text-sm",
    comfortable: "text-base",
  }[fontScale]

  return (
    <section
      className={`space-y-2 text-center ${structuralSpacing[node.nodeType] ?? "py-3"}`}
    >
      {content.heading && (
        <h3
          className={`font-display leading-tight font-semibold uppercase ${structuralLabelSize[node.nodeType] ?? "text-base"}`}
        >
          {content.heading}
        </h3>
      )}
      {content.label && (
        <h3
          className={`font-display leading-tight font-semibold uppercase ${structuralLabelSize[node.nodeType] ?? "text-base"}`}
        >
          {content.label}
        </h3>
      )}
      {content.description && (
        <p
          className={`font-display leading-tight font-semibold ${descriptionTextSize}`}
        >
          <span data-node-text>
            {renderMarkedText(
              content.description,
              highlights,
              annotations,
              onAnnotationUpdated
            )}
          </span>
        </p>
      )}
      {content.epigraphe && (
        <p className="font-display leading-tight font-semibold">
          {content.epigraphe}
        </p>
      )}
      {node.audio && (
        <ReadingAudioButton
          audio={node.audio}
          label={content.epigraphe || node.label || "Título"}
        />
      )}
    </section>
  )
}
