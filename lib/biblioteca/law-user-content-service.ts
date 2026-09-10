import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"

import { waitForBrowserSession } from "@/lib/auth/browser-session"
import { firebaseAuth, firestore } from "@/lib/firebase/client"
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

async function userCollection(name: "highlights" | "annotations") {
  const uid = await requireUid()
  return { uid, reference: collection(firestore, "users", uid, name) }
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
  const highlightsRef = await userCollection("highlights")
  const annotationsRef = await userCollection("annotations")
  const [highlights, annotations] = await Promise.all([
    getDocs(query(highlightsRef.reference, orderBy("created_at", "desc"))),
    getDocs(query(annotationsRef.reference, orderBy("created_at", "desc"))),
  ])
  return [
    ...highlights.docs.map((item): LawUserContentOverviewItem => ({ id: item.id, type: "highlight", lawId: item.data().lei_id, lawVersionId: item.data().law_version_id, nodeKey: item.data().node_key, selectedText: item.data().selected_text, startOffset: item.data().start_offset, endOffset: item.data().end_offset, color: item.data().color, createdAt: iso(item.data().created_at), archivedAt: iso(item.data().archived_at) })),
    ...annotations.docs.map((item): LawUserContentOverviewItem => ({ id: item.id, type: "annotation", lawId: item.data().law_id, lawVersionId: item.data().law_version_id, nodeKey: item.data().node_key, selectedText: item.data().selected_text, startOffset: item.data().start_offset, endOffset: item.data().end_offset, note: item.data().note, createdAt: iso(item.data().created_at), archivedAt: iso(item.data().archived_at) })),
  ].filter((item) => includeArchived || !item.archivedAt).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}

async function contentRef(item: LawUserContentOverviewItem) {
  const uid = await requireUid()
  const name = item.type === "highlight" ? "highlights" : "annotations"
  return doc(firestore, "users", uid, name, item.id)
}

export async function archiveLawUserContent(item: LawUserContentOverviewItem) { await updateDoc(await contentRef(item), { archived_at: serverTimestamp() }) }
export async function restoreLawUserContent(item: LawUserContentOverviewItem) { await updateDoc(await contentRef(item), { archived_at: null }) }
export async function deleteLawUserContent(item: LawUserContentOverviewItem) { await deleteDoc(await contentRef(item)) }

export async function createLawHighlight(reading: LawReading, input: Omit<LawHighlight, "id" | "nodeKey"> & { nodeKey: string }) {
  const saved = await d1Content("POST", { type: "highlight", lawId: reading.lawId, lawVersionId: reading.versionId, nodeKey: input.nodeKey, startOffset: input.startOffset, endOffset: input.endOffset, color: input.color, selectedText: input.selectedText }) as { id: string }
  return { id: saved.id, ...input }
}

export async function createLawAnnotation(reading: LawReading, input: Omit<LawAnnotation, "id" | "nodeKey"> & { nodeKey: string }) {
  const saved = await d1Content("POST", { type: "annotation", lawId: reading.lawId, lawVersionId: reading.versionId, nodeKey: input.nodeKey, startOffset: input.startOffset, endOffset: input.endOffset, note: input.note, selectedText: input.selectedText }) as { id: string }
  return { id: saved.id, ...input }
}

export async function updateLawAnnotation(annotationId: string, note: string) {
  const uid = await requireUid()
  const reference = doc(firestore, "users", uid, "annotations", annotationId)
  await updateDoc(reference, { note: note.trim(), updated_at: serverTimestamp() })
  const saved = await getDoc(reference)
  if (!saved.exists()) return undefined
  return { id: saved.id, nodeKey: saved.data().node_key, selectedText: saved.data().selected_text, startOffset: saved.data().start_offset, endOffset: saved.data().end_offset, note: saved.data().note }
}

export async function removeLawHighlights(reading: LawReading, input: { nodeKey: string; startOffset: number; endOffset: number }) {
  const { reference } = await userCollection("highlights")
  const snapshot = await getDocs(query(reference, where("lei_id", "==", reading.lawId), where("law_version_id", "==", reading.versionId), where("node_key", "==", input.nodeKey)))
  const nodeText = reading.nodes.find((node) => node.nodeKey === input.nodeKey)?.text ?? ""
  const remaining: LawHighlight[] = []
  for (const item of snapshot.docs) {
    const data = item.data()
    if (data.start_offset >= input.endOffset || data.end_offset <= input.startOffset) continue
    await deleteDoc(item.ref)
    const fragments = [{ start: data.start_offset, end: Math.min(data.end_offset, input.startOffset) }, { start: Math.max(data.start_offset, input.endOffset), end: data.end_offset }].filter((part) => part.end > part.start)
    for (const fragment of fragments) {
      const saved = await createLawHighlight(reading, { nodeKey: input.nodeKey, startOffset: fragment.start, endOffset: fragment.end, selectedText: nodeText.slice(fragment.start, fragment.end), color: data.color })
      remaining.push(saved)
    }
  }
  return remaining
}
