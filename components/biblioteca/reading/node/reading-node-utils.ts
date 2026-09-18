import type { BibliotecaReadingPresentation } from "@/lib/biblioteca/catalog-data"
import type { ReadingNode } from "@/lib/biblioteca/reading-service"

export function closestElement(node: Node | null, selector: string): Element | null {
  const element =
    node?.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node?.parentElement
  return element?.closest(selector) ?? null
}

export function isTreatyBodyNode(
  node: ReadingNode,
  readingPresentation?: BibliotecaReadingPresentation
): boolean {
  return (
    readingPresentation === "treaty" &&
    node.nodeKey.split(".").some((segment) => segment.startsWith("parte_"))
  )
}

export function articleHeading(
  node: ReadingNode,
  readingPresentation?: BibliotecaReadingPresentation
): string {
  return isTreatyBodyNode(node, readingPresentation)
    ? `ARTIGO ${node.number}`
    : `Art. ${node.number}`
}

export function structuralContent(
  node: ReadingNode,
  readingPresentation: BibliotecaReadingPresentation = "legislation"
) {
  const number = node.number.trim()
  const label = node.label.trim()
  const text = node.text.trim()
  const epigraphe = node.epigraphe.trim()
  const upperLabel = label.toLocaleUpperCase()

  const prefixByType: Record<string, string> = {
    parte: isTreatyBodyNode(node, readingPresentation) ? "PARTE" : "LIVRO",
    titulo: "TÍTULO",
    capitulo: "CAPÍTULO",
    secao: "SEÇÃO",
    subsecao: "SUBSEÇÃO",
  }

  const prefix = prefixByType[node.nodeType]
  const hasStoredPrefix = prefix
    ? upperLabel.startsWith(prefix) ||
      (prefix === "TÍTULO" && upperLabel.startsWith("TITULO")) ||
      (prefix === "CAPÍTULO" && upperLabel.startsWith("CAPITULO")) ||
      (prefix === "SEÇÃO" && upperLabel.startsWith("SECAO")) ||
      (prefix === "SUBSEÇÃO" && upperLabel.startsWith("SUBSECAO"))
    : false

  const heading = hasStoredPrefix
    ? label
    : prefix && number
      ? `${prefix} ${number}`
      : ""

  const description =
    node.nodeType === "capitulo" && !label
      ? text
      : node.nodeType === "titulo" || node.nodeType === "parte"
        ? ""
        : node.nodeType === "secao" || node.nodeType === "subsecao"
          ? ""
          : text

  return {
    heading,
    label: hasStoredPrefix ? "" : label,
    description,
    epigraphe,
  }
}

export const structuralSpacing: Record<string, string> = {
  parte: "mt-8 py-3",
  titulo: "mt-7 py-3",
  capitulo: "mt-6 py-3",
  secao: "mt-5 py-2",
  subsecao: "mt-4 py-2",
}

export const structuralLabelSize: Record<string, string> = {
  parte: "text-xl",
  titulo: "text-lg",
  capitulo: "text-base",
  secao: "text-[0.95rem]",
  subsecao: "text-[0.9rem]",
}

export const structuralTextSize: Record<string, string> = {
  parte: "text-lg",
  titulo: "text-base",
  capitulo: "text-[0.95rem]",
  secao: "text-[0.9rem]",
  subsecao: "text-[0.85rem]",
}
