import type { LawReading } from "./reading-service"
import { getSupabasePublicConfig } from "@/lib/supabase/public-config"

export type LawHighlightColor = "yellow" | "red" | "blue" | "green"

export type LawHighlight = {
  id: string
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  color: LawHighlightColor
}

export type LawAnnotation = {
  id: string
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  note: string
}

export type LawUserContentOverviewItem = {
  id: string
  type: "highlight" | "annotation"
  lawId: string
  lawVersionId: string
  nodeKey: string
  selectedText: string
  startOffset: number
  endOffset: number
  color?: LawHighlightColor
  note?: string
  createdAt: string | null
  archivedAt: string | null
}

type StoredSession = {
  access_token?: string
  user?: { id?: string }
}

function getConfig() {
  const { url, publicKey } = getSupabasePublicConfig()
  return { url, anonKey: publicKey }
}

function getSession() {
  if (typeof window === "undefined") throw new Error("Sessão indisponível.")
  const raw = window.localStorage.getItem("papirar.auth.session")
  let session: StoredSession | null = null
  try {
    session = raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    session = null
  }
  if (!session?.access_token || !session.user?.id) throw new Error("Sessão expirada.")
  return session as Required<Pick<StoredSession, "access_token" | "user">>
}

async function request<T>(path: string, init: RequestInit = {}) {
  const { url, anonKey } = getConfig()
  const session = getSession()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  if (!response.ok) {
    const body = await response.text()
    console.error("[Papirar][Conteúdo do usuário] Supabase recusou a operação", {
      path,
      status: response.status,
      response: body.slice(0, 1000),
    })
    throw new Error("Não foi possível acessar o conteúdo do usuário.")
  }
  const body = await response.text()
  return body ? (JSON.parse(body) as T) : undefined
}

export async function loadLawUserContent(reading: LawReading) {
  const lawId = encodeURIComponent(reading.lawId)
  const versionId = encodeURIComponent(reading.versionId)
  const [highlights, annotations] = await Promise.all([
    request<Array<{
      id: string
      node_key: string
      selected_text: string
      start_offset: number
      end_offset: number
      color: LawHighlightColor
    }>>(
      `lei_highlights?select=id,node_key,selected_text,start_offset,end_offset,color&lei_id=eq.${lawId}&law_version_id=eq.${versionId}&archived_at=is.null&order=created_at.asc`
    ),
    request<Array<{
      id: string
      node_key: string
      selected_text: string
      start_offset: number
      end_offset: number
      note: string
    }>>(
      `lei_annotations?select=id,node_key,selected_text,start_offset,end_offset,note&law_id=eq.${lawId}&law_version_id=eq.${versionId}&archived_at=is.null&order=created_at.asc`
    ),
  ])

  return {
    highlights: (highlights ?? []).map((item) => ({
      id: item.id,
      nodeKey: item.node_key,
      selectedText: item.selected_text,
      startOffset: item.start_offset,
      endOffset: item.end_offset,
      color: item.color,
    })),
    annotations: (annotations ?? []).map((item) => ({
      id: item.id,
      nodeKey: item.node_key,
      selectedText: item.selected_text,
      startOffset: item.start_offset,
      endOffset: item.end_offset,
      note: item.note,
    })),
  }
}

export async function loadLawUserContentOverview(includeArchived = false) {
  const archivedFilter = includeArchived ? "" : "&archived_at=is.null"
  const [highlights, annotations] = await Promise.all([
    request<Array<{
      id: string
      lei_id: string
      law_version_id: string
      node_key: string
      selected_text: string
      start_offset: number
      end_offset: number
      color: LawHighlightColor
      created_at: string | null
      archived_at: string | null
    }>>(
      `lei_highlights?select=id,lei_id,law_version_id,node_key,selected_text,start_offset,end_offset,color,created_at,archived_at${archivedFilter}&order=created_at.desc`
    ),
    request<Array<{
      id: string
      law_id: string
      law_version_id: string
      node_key: string
      selected_text: string
      start_offset: number
      end_offset: number
      note: string
      created_at: string | null
      archived_at: string | null
    }>>(
      `lei_annotations?select=id,law_id,law_version_id,node_key,selected_text,start_offset,end_offset,note,created_at,archived_at${archivedFilter}&order=created_at.desc`
    ),
  ])

  return [
    ...(highlights ?? []).map((item): LawUserContentOverviewItem => ({
      id: item.id,
      type: "highlight",
      lawId: item.lei_id,
      lawVersionId: item.law_version_id,
      nodeKey: item.node_key,
      selectedText: item.selected_text,
      startOffset: item.start_offset,
      endOffset: item.end_offset,
      color: item.color,
      createdAt: item.created_at,
      archivedAt: item.archived_at,
    })),
    ...(annotations ?? []).map((item): LawUserContentOverviewItem => ({
      id: item.id,
      type: "annotation",
      lawId: item.law_id,
      lawVersionId: item.law_version_id,
      nodeKey: item.node_key,
      selectedText: item.selected_text,
      startOffset: item.start_offset,
      endOffset: item.end_offset,
      note: item.note,
      createdAt: item.created_at,
      archivedAt: item.archived_at,
    })),
  ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}

export async function archiveLawUserContent(item: LawUserContentOverviewItem) {
  const table = item.type === "highlight" ? "lei_highlights" : "lei_annotations"
  await request<void>(`${table}?id=eq.${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ archived_at: new Date().toISOString() }),
  })
}

export async function restoreLawUserContent(item: LawUserContentOverviewItem) {
  const table = item.type === "highlight" ? "lei_highlights" : "lei_annotations"
  await request<void>(`${table}?id=eq.${encodeURIComponent(item.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ archived_at: null }),
  })
}

export async function deleteLawUserContent(item: LawUserContentOverviewItem) {
  const table = item.type === "highlight" ? "lei_highlights" : "lei_annotations"
  await request<void>(`${table}?id=eq.${encodeURIComponent(item.id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  })
}

export async function createLawHighlight(
  reading: LawReading,
  input: Omit<LawHighlight, "id" | "nodeKey"> & { nodeKey: string }
) {
  const session = getSession()
  const result = await request<Array<{
    id: string
    node_key: string
    selected_text: string
    start_offset: number
    end_offset: number
    color: LawHighlightColor
  }>>("lei_highlights", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: session.user.id,
      lei_id: reading.lawId,
      law_version_id: reading.versionId,
      node_key: input.nodeKey,
      bloco_index: reading.nodes.find((node) => node.nodeKey === input.nodeKey)?.sortOrder ?? 0,
      part_index: 0,
      start_offset: input.startOffset,
      end_offset: input.endOffset,
      color: input.color,
      selected_text: input.selectedText,
    }),
  })
  const saved = result?.[0]
  return saved
    ? {
        id: saved.id,
        nodeKey: saved.node_key,
        selectedText: saved.selected_text,
        startOffset: saved.start_offset,
        endOffset: saved.end_offset,
        color: saved.color,
      }
    : undefined
}

export async function createLawAnnotation(
  reading: LawReading,
  input: Omit<LawAnnotation, "id" | "nodeKey"> & { nodeKey: string }
) {
  const session = getSession()
  const result = await request<Array<{
    id: string
    node_key: string
    selected_text: string
    start_offset: number
    end_offset: number
    note: string
  }>>("lei_annotations", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: session.user.id,
      law_id: reading.lawId,
      law_version_id: reading.versionId,
      node_key: input.nodeKey,
      selected_text: input.selectedText,
      start_offset: input.startOffset,
      end_offset: input.endOffset,
      note: input.note,
    }),
  })
  const saved = result?.[0]
  return saved
    ? {
        id: saved.id,
        nodeKey: saved.node_key,
        selectedText: saved.selected_text,
        startOffset: saved.start_offset,
        endOffset: saved.end_offset,
        note: saved.note,
      }
    : undefined
}

export async function updateLawAnnotation(
  annotationId: string,
  note: string,
) {
  const result = await request<Array<{
    id: string
    node_key: string
    selected_text: string
    start_offset: number
    end_offset: number
    note: string
  }>>(`lei_annotations?id=eq.${encodeURIComponent(annotationId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ note: note.trim() }),
  })
  const saved = result?.[0]
  return saved
    ? {
        id: saved.id,
        nodeKey: saved.node_key,
        selectedText: saved.selected_text,
        startOffset: saved.start_offset,
        endOffset: saved.end_offset,
        note: saved.note,
      }
    : undefined
}

export async function removeLawHighlights(
  reading: LawReading,
  input: { nodeKey: string; startOffset: number; endOffset: number }
) {
  const lawId = encodeURIComponent(reading.lawId)
  const versionId = encodeURIComponent(reading.versionId)
  const nodeKey = encodeURIComponent(input.nodeKey)
  const overlapping = await request<Array<{
    id: string
    start_offset: number
    end_offset: number
    color: LawHighlightColor
  }>>(
    `lei_highlights?select=id,start_offset,end_offset,color&lei_id=eq.${lawId}&law_version_id=eq.${versionId}&node_key=eq.${nodeKey}&start_offset=lt.${input.endOffset}&end_offset=gt.${input.startOffset}`
  )
  const nodeText = reading.nodes.find((node) => node.nodeKey === input.nodeKey)?.text ?? ""
  const remaining: LawHighlight[] = []

  for (const highlight of overlapping ?? []) {
    await request<void>(
      `lei_highlights?id=eq.${encodeURIComponent(highlight.id)}`,
      { method: "DELETE", headers: { Prefer: "return=minimal" } }
    )

    const fragments = [
      { start: highlight.start_offset, end: Math.min(highlight.end_offset, input.startOffset) },
      { start: Math.max(highlight.start_offset, input.endOffset), end: highlight.end_offset },
    ].filter((fragment) => fragment.end > fragment.start)

    for (const fragment of fragments) {
      const saved = await createLawHighlight(reading, {
        nodeKey: input.nodeKey,
        startOffset: fragment.start,
        endOffset: fragment.end,
        selectedText: nodeText.slice(fragment.start, fragment.end),
        color: highlight.color,
      })
      if (saved) remaining.push(saved)
    }
  }

  return remaining
}
