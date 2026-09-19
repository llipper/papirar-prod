export const annotationColors = [
  "yellow",
  "red",
  "blue",
  "green",
  "purple",
  "gray",
] as const

export type LawAnnotationColor = (typeof annotationColors)[number]

export const annotationTypes = [
  "general",
  "question",
  "important",
  "summary",
  "review",
] as const

export type LawAnnotationType = (typeof annotationTypes)[number]

export type AnnotationDetails = {
  color: LawAnnotationColor
  type: LawAnnotationType
  tags: string[]
  reminderAt: string | null
}

export type LawAnnotation = AnnotationDetails & {
  id: string
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  note: string
}

export const defaultAnnotationDetails: AnnotationDetails = {
  color: "yellow",
  type: "general",
  tags: [],
  reminderAt: null,
}

export function normalizeAnnotationDetails(value: {
  annotation_color?: unknown
  annotation_type?: unknown
  tags_json?: unknown
  reminder_at?: unknown
}): AnnotationDetails {
  const color = annotationColors.includes(value.annotation_color as LawAnnotationColor)
    ? (value.annotation_color as LawAnnotationColor)
    : defaultAnnotationDetails.color
  const type = annotationTypes.includes(value.annotation_type as LawAnnotationType)
    ? (value.annotation_type as LawAnnotationType)
    : defaultAnnotationDetails.type

  let tags: string[] = []
  if (typeof value.tags_json === "string") {
    try {
      const parsed = JSON.parse(value.tags_json)
      if (Array.isArray(parsed)) {
        tags = parsed
          .filter((tag): tag is string => typeof tag === "string")
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 12)
      }
    } catch {
      tags = []
    }
  }

  return {
    color,
    type,
    tags,
    reminderAt: typeof value.reminder_at === "string" && !Number.isNaN(Date.parse(value.reminder_at))
      ? value.reminder_at
      : null,
  }
}
