import { waitForBrowserSession } from "@/lib/auth/browser-session"
import { firebaseAuth } from "@/lib/firebase/client"
import type { LawReading } from "./reading-service"

export type LawHighlightColor = "yellow" | "red" | "blue" | "green"
export type LawHighlight = { id: string; nodeKey: string; selectedText: string; startOffset: number; endOffset: number; color: LawHighlightColor }
export type LawAnnotation = { id: string; nodeKey: string; selectedText: string; startOffset: number; endOffset: number; note: string }
export type LawUserContentOverviewItem = { id: string; type: "highlight" | "annotation"; lawId: string; lawVersionId: string; nodeKey: string; selectedText: string; startOffset: number; endOffset: number; color?: LawHighlightColor; note?: string; createdAt: string | null; archivedAt: string | null }

async function requireUid() {
  const user = await waitForBrowserSession()
  if (!user) throw new Error("Sessão expirada.")
  return user.uid
}

function iso(value: unknown) {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate()
    return date.toISOString()
  }
  return null
}

const apiBase = process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev"
async function d1Content(method: string, body?: unknown, query = "") {
  const token = await firebaseAuth.currentUser?.getIdToken()
  if (!token) throw new Error("Sessão expirada.")
  const response = await fetch(`${apiBase}/user-content${query}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) })
  if (!response.ok) throw new Error("Não foi possível salvar o conteúdo.")
  return response.json()
}

export async function loadLawUserContent(reading: LawReading) {
  const rows = await d1Content("GET", undefined, `?lawId=${encodeURIComponent(reading.lawId)}&lawVersionId=${encodeURIComponent(reading.versionId)}`) as Array<Record<string, unknown>>
  return {
    highlights: rows.filter((item) => item.type === "highlight" && !item.archived_at).map((item) => ({ id: String(item.id), nodeKey: String(item.node_key), selectedText: String(item.selected_text), startOffset: Number(item.start_offset), endOffset: Number(item.end_offset), color: item.color as LawHighlightColor })),
    annotations: rows.filter((item) => item.type === "annotation" && !item.archived_at).map((item) => ({ id: String(item.id), nodeKey: String(item.node_key), selectedText: String(item.selected_text), startOffset: Number(item.start_offset), endOffset: Number(item.end_offset), note: String(item.note ?? "") })),
  }
}

export async function loadLawUserContentOverview(includeArchived = false) {
  const rows = await d1Content("GET") as Array<Record<string, unknown>>
  return rows.map((item) => ({ id: String(item.id), type: item.type as "highlight" | "annotation", lawId: String(item.law_id), lawVersionId: String(item.law_version_id), nodeKey: String(item.node_key), selectedText: String(item.selected_text), startOffset: Number(item.start_offset), endOffset: Number(item.end_offset), color: item.color as LawHighlightColor, note: item.note ? String(item.note) : undefined, createdAt: iso(item.created_at), archivedAt: iso(item.archived_at) })).filter((item) => includeArchived || !item.archivedAt).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}

export async function archiveLawUserContent(item: LawUserContentOverviewItem) { await d1Content("PATCH", { id: item.id, archivedAt: new Date().toISOString() }) }
export async function restoreLawUserContent(item: LawUserContentOverviewItem) { await d1Content("PATCH", { id: item.id, archivedAt: null }) }
export async function deleteLawUserContent(item: LawUserContentOverviewItem) { await d1Content("DELETE", { id: item.id }) }

export async function createLawHighlight(reading: LawReading, input: Omit<LawHighlight, "id" | "nodeKey"> & { nodeKey: string }) {
  const saved = await d1Content("POST", { type: "highlight", lawId: reading.lawId, lawVersionId: reading.versionId, nodeKey: input.nodeKey, startOffset: input.startOffset, endOffset: input.endOffset, color: input.color, selectedText: input.selectedText }) as { id: string }
  return { id: saved.id, ...input }
}

export async function createLawAnnotation(reading: LawReading, input: Omit<LawAnnotation, "id" | "nodeKey"> & { nodeKey: string }) {
  const saved = await d1Content("POST", { type: "annotation", lawId: reading.lawId, lawVersionId: reading.versionId, nodeKey: input.nodeKey, startOffset: input.startOffset, endOffset: input.endOffset, note: input.note, selectedText: input.selectedText }) as { id: string }
  return { id: saved.id, ...input }
}

export async function updateLawAnnotation(annotationId: string, note: string) {
  await d1Content("PATCH", { id: annotationId, note: note.trim() })
  return { id: annotationId, nodeKey: "", selectedText: "", startOffset: 0, endOffset: 0, note: note.trim() }
}

export async function removeLawHighlights(reading: LawReading, input: { nodeKey: string; startOffset: number; endOffset: number }) {
  const existing = (await loadLawUserContent(reading)).highlights.filter((item) => item.nodeKey === input.nodeKey)
  const nodeText = reading.nodes.find((node) => node.nodeKey === input.nodeKey)?.text ?? ""
  const remaining: LawHighlight[] = []
  for (const item of existing) {
    if (item.startOffset >= input.endOffset || item.endOffset <= input.startOffset) continue
    await d1Content("DELETE", { id: item.id })
    const fragments = [{ start: item.startOffset, end: Math.min(item.endOffset, input.startOffset) }, { start: Math.max(item.startOffset, input.endOffset), end: item.endOffset }].filter((part) => part.end > part.start)
    for (const fragment of fragments) {
      const saved = await createLawHighlight(reading, { nodeKey: input.nodeKey, startOffset: fragment.start, endOffset: fragment.end, selectedText: nodeText.slice(fragment.start, fragment.end), color: item.color })
      remaining.push(saved)
    }
  }
  return remaining
}
