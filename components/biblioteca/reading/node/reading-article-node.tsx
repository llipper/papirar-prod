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
          <div className="flex items-center justify-center gap-1">
            <h3 className="font-display text-base leading-tight font-semibold uppercase">
              ARTIGO {node.number}
            </h3>
            {node.audio && (
              <ReadingAudioButton
                audio={node.audio}
                label={`Art. ${node.number}`}
              />
            )}
          </div>
          {node.epigraphe && (
            <h4 className="font-display text-sm leading-tight font-semibold">
              {node.epigraphe}
            </h4>
          )}
        </div>
        {node.text && (
          <div className={`space-y-4 font-reading ${bodyTextSize} leading-[1.65] text-foreground/85`}>
            {node.text.split(/\n\s*\n/).map((paragraph, index) => {
              const match = paragraph.match(/^(\d+)\.\s+([\s\S]*)$/)
              const itemAudio = match
                ? node.inlineAudios.find((audio) => audio.itemNumber === match[1] && !audio.subitem)
                : undefined
              return (
                <p key={`${node.nodeKey}-${index}`} data-node-text className="whitespace-pre-line">
                  {match && <strong className="font-reading font-semibold text-foreground">{match[1]}. </strong>}
                  {itemAudio && <ReadingAudioButton audio={itemAudio} label={`Artigo ${node.number}, item ${match?.[1]}`} />}
                  {renderMarkedText(match?.[2] ?? paragraph, highlights, annotations, onAnnotationUpdated)}
                </p>
              )
            })}
          </div>
        )}
      </section>
    )
  }

  const prefix =
    node.nodeType === "artigo"
      ? `Art. ${node.number}`
      : node.nodeType === "treaty_item"
        ? `${node.number}.`
        : node.nodeType === "treaty_subitem"
          ? `${node.number})`
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
      treaty_item: "pl-4",
      treaty_subitem: "pl-8",
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
