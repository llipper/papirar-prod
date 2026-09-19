import { Fragment, type ReactNode } from "react"

function safeExternalUrl(value: string): string | null {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null
  } catch {
    return null
  }
}

function inlineMarkdown(value: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>[^<]+<\/u>|\[[^\]]+\]\([^)]*\))/g
  const output: ReactNode[] = []
  let lastIndex = 0

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0
    if (index > lastIndex) output.push(value.slice(lastIndex, index))
    const token = match[0]
    const key = `${index}-${token.length}`
    if (token.startsWith("**")) output.push(<strong key={key}>{token.slice(2, -2)}</strong>)
    else if (token.startsWith("*")) output.push(<em key={key}>{token.slice(1, -1)}</em>)
    else if (token.startsWith("<u>")) output.push(<u key={key}>{token.slice(3, -4)}</u>)
    else {
      const link = /^\[([^\]]+)\]\(([^)]*)\)$/.exec(token)
      const href = link ? safeExternalUrl(link[2]) : null
      output.push(href && link ? <a key={key} href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">{link[1]}</a> : token)
    }
    lastIndex = index + token.length
  }
  if (lastIndex < value.length) output.push(value.slice(lastIndex))
  return output
}

/** Renders the limited Markdown emitted by the annotation editor without HTML injection. */
export function AnnotationNoteContent({ note, className }: { note: string; className?: string }) {
  const lines = note.split("\n")
  return (
    <div className={className}>
      {lines.map((line, index) => {
        const key = `${index}-${line.length}`
        if (line.startsWith("### ") || line.startsWith("#### ")) {
          return <p key={key} className="font-semibold">{inlineMarkdown(line.replace(/^#{3,4}\s/, ""))}</p>
        }
        if (line.startsWith("> ")) {
          return <blockquote key={key} className="border-l-2 border-primary/40 pl-2 italic">{inlineMarkdown(line.slice(2))}</blockquote>
        }
        if (/^-\s+/.test(line)) {
          return <div key={key} className="flex gap-1.5"><span>•</span><span>{inlineMarkdown(line.replace(/^-\s+/, ""))}</span></div>
        }
        if (/^\d+\.\s+/.test(line)) {
          return <div key={key} className="flex gap-1.5"><span>{line.match(/^\d+\./)?.[0]}</span><span>{inlineMarkdown(line.replace(/^\d+\.\s+/, ""))}</span></div>
        }
        return <Fragment key={key}>{inlineMarkdown(line)}{index < lines.length - 1 && <br />}</Fragment>
      })}
    </div>
  )
}
