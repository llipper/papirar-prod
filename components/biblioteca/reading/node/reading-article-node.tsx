"use client"

import React from "react"
import type { BibliotecaReadingPresentation } from "@/lib/biblioteca/catalog-data"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"
import type {
  LawAnnotation,
  LawHighlight,
} from "@/lib/biblioteca/law-user-content-service"
import { isTreatyBodyNode } from "./reading-node-utils"
import { renderMarkedText } from "../annotations/annotation-text"
import { ReadingAudioButton } from "../audio/reading-audio-button"
import type { ReadingFontScale } from "../reading-dashboard-header"

export interface ReadingArticleNodeProps {
  node: ReadingNode
  readingPresentation?: BibliotecaReadingPresentation
  highlights: LawHighlight[]
  annotations: LawAnnotation[]
  onAnnotationUpdated: (annotationId: string, note: string) => Promise<void>
  fontScale: ReadingFontScale
}

export function ReadingArticleNode({
  node,
  readingPresentation,
  highlights,
  annotations,
  onAnnotationUpdated,
  fontScale,
}: ReadingArticleNodeProps) {
  const bodyTextSize = {
    compact: "text-[0.96rem]",
    default: "text-[1.05rem]",
    comfortable: "text-[1.18rem]",
  }[fontScale]

  if (node.nodeType === "preambulo") {
    return (
      <section className="space-y-3 py-3 text-center">
        {node.label && (
          <div className="flex items-center justify-center">
            <h3 className="font-display text-lg font-semibold">{node.label}</h3>
            {node.audio && (
              <ReadingAudioButton
                audio={node.audio}
                label={node.label || "Preâmbulo"}
              />
            )}
          </div>
        )}
        {node.epigraphe && (
          <h4 className="font-display text-base leading-tight font-semibold uppercase">
            {node.epigraphe}
          </h4>
        )}
        {node.text && (
          <p className={`text-left font-reading ${bodyTextSize} leading-[1.65]`}>
            <span data-node-text className="whitespace-pre-line">
              {renderMarkedText(
                node.text,
                highlights,
                annotations,
                onAnnotationUpdated
              )}
            </span>
          </p>
        )}
        {!node.label && node.audio && (
          <ReadingAudioButton audio={node.audio} label="Preâmbulo" />
        )}
      </section>
    )
  }

  if (
    node.nodeType === "artigo" &&
    isTreatyBodyNode(node, readingPresentation)
  ) {
    return (
      <section className="space-y-3 pt-4">
        <div className="space-y-2 text-center">
          <h3 className="font-display text-base leading-tight font-semibold uppercase">
            ARTIGO {node.number}
          </h3>
          {node.epigraphe && (
            <h4 className="font-display text-sm leading-tight font-semibold">
              {node.epigraphe}
            </h4>
          )}
        </div>
        {node.text && (
          <p className={`font-reading ${bodyTextSize} leading-[1.65] text-foreground/85`}>
            {node.audio && (
              <ReadingAudioButton
                audio={node.audio}
                label={`Art. ${node.number}`}
              />
            )}
            <span data-node-text className="whitespace-pre-line">
              {renderMarkedText(
                node.text,
                highlights,
                annotations,
                onAnnotationUpdated
              )}
            </span>
          </p>
        )}
      </section>
    )
  }

  const prefix =
    node.nodeType === "artigo"
      ? `Art. ${node.number}`
      : node.nodeType === "paragrafo"
        ? node.number.toLowerCase() === "único"
          ? "Parágrafo único"
          : `§ ${node.number}`
        : node.nodeType === "inciso"
          ? node.number
          : node.nodeType === "alinea"
            ? `${node.number})`
            : ""

  const hierarchyClass =
    {
      artigo: "",
      paragrafo:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
      inciso:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
      alinea:
        "relative border-l border-border pl-5 before:absolute before:top-7 before:-left-px before:w-4 before:rounded-full before:border-t before:border-border",
    }[node.nodeType] ?? ""

  const hierarchyDepth = node.nodeKey
    .split(".")
    .filter(
      (part) =>
        part.startsWith("par_") ||
        part.startsWith("inciso_") ||
        part.startsWith("alinea_")
    ).length

  const hierarchyStyle =
    hierarchyDepth > 0
      ? { marginLeft: `${hierarchyDepth * 1.5}rem` }
      : undefined

  const incisoSeparator =
    node.nodeType === "inciso" && !node.audio ? " - " : " "

  return (
    <section
      className={`space-y-2 pt-3 ${hierarchyClass}`}
      style={hierarchyStyle}
    >
      {node.epigraphe && (
        <h4 className="font-reading text-[0.94rem] leading-[1.35] font-semibold">
          {node.epigraphe}
        </h4>
      )}
      <p className={`font-reading ${bodyTextSize} leading-[1.65] text-foreground/85`}>
        <strong className="font-reading font-semibold text-foreground">
          {prefix}
        </strong>
        {node.audio && (
          <ReadingAudioButton
            audio={node.audio}
            label={prefix || node.label || "Áudio da lei"}
          />
        )}
        {incisoSeparator}
        {node.text && (
          <span data-node-text className="whitespace-pre-line">
            {renderMarkedText(
              node.text,
              highlights,
              annotations,
              onAnnotationUpdated
            )}
          </span>
        )}
      </p>
    </section>
  )
}
