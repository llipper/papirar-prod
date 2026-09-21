import type { BibliotecaBook } from "./catalog-data"
import { getAuth } from "firebase/auth"
import {
  createLawReadingCacheKey,
  readCachedLawReading,
  writeCachedLawReading,
} from "./law-reading-cache"

export type ReadingNode = {
  nodeKey: string
  nodeType: string
  number: string
  label: string
  epigraphe: string
  text: string
  sortOrder: number
  audio: ReadingAudio | undefined
  inlineAudios: ReadingInlineAudio[]
}

export type ReadingAudio = {
  key: string
  title: string
  url: string
  durationMs: number | null
}

export type ReadingInlineAudio = ReadingAudio & { itemNumber: string; subitem?: string }

export type ReadingAnnexRow = {
  rowKey: string
  itemCode: string
  description: string
  amountDisplay: string
  note: string
  columns: string[]
  sortOrder: number
}

export type ReadingAnnex = {
  annexKey: string
  title: string
  subtitle: string
  leftHeader: string
  rightHeader: string
  rows: ReadingAnnexRow[]
}

export type LawReading = {
  lawId: string
  versionId: string
  title: string
  acronym: string
  nodes: ReadingNode[]
  annexes: ReadingAnnex[]
}

const READING_LOG_PREFIX = "[Papirar][Leitura]"

const API_BASE = process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev"
const AUDIO_CACHE_TTL_MS = 10 * 60 * 1000

type RemoteAudio = {
  node_key?: string
  audio_key: string
  title: string
  public_url: string
  duration_ms?: number | null
}

type SessionAudioCacheEntry = {
  expiresAt: number
  audios: RemoteAudio[]
}

const sessionAudioCache = new Map<string, SessionAudioCacheEntry>()
const sessionAudioRequests = new Map<string, Promise<RemoteAudio[]>>()

export const LAW_READING_UPDATED_EVENT = "papirar:law-reading-updated"

export type LawReadingUpdate = {
  reading: LawReading
  authUid: string | null
}

function inlineAudiosFor(nodeKey: string, audios: RemoteAudio[]): ReadingInlineAudio[] {
  const escapedNodeKey = nodeKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`^${escapedNodeKey}\\.item_([^.]+)(?:\\.subitem_([a-z]))?$`)

  return audios.flatMap((audio) => {
    const match = audio.node_key?.match(pattern)
    return match && audio.public_url
      ? [{ key: audio.audio_key, title: audio.title || "Áudio da lei", url: audio.public_url, durationMs: audio.duration_ms ?? null, itemNumber: match[1], subitem: match[2] }]
      : []
  })
}

function applyAudiosToReading(reading: LawReading, audios: RemoteAudio[]): LawReading {
  const audioByNode = new Map(
    audios
      .filter((audio) => audio.node_key && audio.public_url)
      .map((audio) => [audio.node_key as string, { key: audio.audio_key, title: audio.title || "Áudio da lei", url: audio.public_url, durationMs: audio.duration_ms ?? null }]),
  )

  return {
    ...reading,
    nodes: reading.nodes.map((node) => ({
      ...node,
      audio: audioByNode.get(node.nodeKey),
      inlineAudios: inlineAudiosFor(node.nodeKey, audios),
    })),
  }
}

async function loadLawReadingFromRemote(
  book: BibliotecaBook,
  authToken: string | null
): Promise<LawReading> {
  console.info(`${READING_LOG_PREFIX} iniciando leitura`, {
    bookId: book.id,
    title: book.title,
    lawId: book.lawId,
    version: book.version,
    scope: book.scope,
  })

  if (!book.lawId || !book.version || !book.scope) {
    console.error(`${READING_LOG_PREFIX} metadados incompletos no catálogo`, {
      bookId: book.id,
      title: book.title,
      lawId: book.lawId,
      version: book.version,
      scope: book.scope,
    })
    throw new Error("Esta obra ainda não está disponível para leitura.")
  }

  const catalogLawId = book.lawId
  const catalogVersion = book.version
  const catalogScope = book.scope
  if (!catalogLawId || !catalogVersion || !catalogScope) throw new Error("Metadados da lei incompletos.")
  const response = await fetch(`${API_BASE}/catalog/reading?lawId=${encodeURIComponent(catalogLawId)}&version=${encodeURIComponent(catalogVersion)}&scope=${encodeURIComponent(catalogScope)}`, {
    cache: "no-store",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  })
  if (!response.ok) throw new Error("Não foi possível carregar o conteúdo da lei.")
  const catalog = await response.json() as {
    law: { id: string; title: string; acronym: string }
    version: { id: string }
    nodes: Array<{ node_key: string; node_type: string; number?: string; label?: string }>
    contents: Array<{ node_key: string; epigraphe?: string; text_content?: string; sort_order: number }>
    audios: RemoteAudio[]
    annexes: Array<{ id: string; annex_key: string; title: string; subtitle?: string | null; left_header: string; right_header: string }>
    annexRows: Array<{ annex_id: string; row_key: string; item_code?: string | null; description: string; amount_display?: string | null; note?: string | null; columns?: unknown; sort_order: number }>
  }
  const catalogNodeByKey = new Map(catalog.nodes.map((node) => [node.node_key, node]))
  const annexRowsById = new Map<string, typeof catalog.annexRows>()
  for (const row of catalog.annexRows) {
    const rows = annexRowsById.get(row.annex_id) ?? []
    rows.push(row)
    annexRowsById.set(row.annex_id, rows)
  }
  return applyAudiosToReading({
    lawId: catalog.law.id,
    versionId: catalog.version.id,
    title: catalog.law.title,
    acronym: catalog.law.acronym,
    nodes: catalog.contents.map((content) => {
      const node = catalogNodeByKey.get(content.node_key)
      return { nodeKey: content.node_key, nodeType: node?.node_type ?? "", number: node?.number ?? "", label: node?.label ?? "", epigraphe: content.epigraphe ?? "", text: content.text_content ?? "", sortOrder: content.sort_order, audio: undefined, inlineAudios: [] }
    }),
    annexes: catalog.annexes.map((annex) => ({
      annexKey: annex.annex_key,
      title: annex.title,
      subtitle: annex.subtitle ?? "",
      leftHeader: annex.left_header,
      rightHeader: annex.right_header,
      rows: (annexRowsById.get(annex.id) ?? [])
        .sort((left, right) => left.sort_order - right.sort_order)
        .map((row) => ({
          rowKey: row.row_key,
          itemCode: row.item_code ?? "",
          description: row.description,
          amountDisplay: row.amount_display ?? "",
          note: row.note ?? "",
          columns: Array.isArray(row.columns) ? row.columns.map((value) => String(value ?? "")) : [],
          sortOrder: row.sort_order,
        })),
    })),
  }, catalog.audios)
}

async function loadReadingForCurrentUser(book: BibliotecaBook): Promise<LawReadingUpdate> {
  const auth = getAuth()
  const user = auth.currentUser
  const authUid = user?.uid ?? null
  const authToken = user ? await user.getIdToken() : null

  if ((auth.currentUser?.uid ?? null) !== authUid) {
    throw new Error("A sessão mudou durante o carregamento da leitura.")
  }

  const reading = await loadLawReadingFromRemote(book, authToken)

  if ((auth.currentUser?.uid ?? null) !== authUid) {
    throw new Error("A sessão mudou durante o carregamento da leitura.")
  }

  return { reading, authUid }
}

async function loadCachedReadingAudios(reading: LawReading, authUid: string, authToken: string): Promise<RemoteAudio[]> {
  const key = `${authUid}::${reading.lawId}::${reading.versionId}`
  const cached = sessionAudioCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.audios

  const inFlight = sessionAudioRequests.get(key)
  if (inFlight) return inFlight

  const request = fetch(`${API_BASE}/catalog/audio?lawId=${encodeURIComponent(reading.lawId)}&versionId=${encodeURIComponent(reading.versionId)}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${authToken}` },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("Não foi possível atualizar os áudios da lei.")
      const payload = await response.json() as { audios: RemoteAudio[] }
      const audios = payload.audios ?? []
      sessionAudioCache.set(key, { audios, expiresAt: Date.now() + AUDIO_CACHE_TTL_MS })
      return audios
    })
    .finally(() => sessionAudioRequests.delete(key))

  sessionAudioRequests.set(key, request)
  return request
}

function refreshCachedReadingAudios(reading: LawReading) {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) return

  const expectedUid = user.uid
  void user.getIdToken()
    .then((token) => loadCachedReadingAudios(reading, expectedUid, token))
    .then((audios) => {
      if (getAuth().currentUser?.uid !== expectedUid || typeof window === "undefined") return
      window.dispatchEvent(new CustomEvent<LawReadingUpdate>(LAW_READING_UPDATED_EVENT, {
        detail: { reading: applyAudiosToReading(reading, audios), authUid: expectedUid },
      }))
    })
    .catch((reason: unknown) => {
      console.warn(`${READING_LOG_PREFIX} atualização de áudio indisponível`, {
        lawId: reading.lawId,
        reason,
      })
    })
}

export async function loadLawReading(book: BibliotecaBook): Promise<LawReading> {
  if (!book.lawId || !book.version || !book.scope) {
    return (await loadReadingForCurrentUser(book)).reading
  }

  const cacheKey = createLawReadingCacheKey(book.lawId, book.version, book.scope)
  const cached = await readCachedLawReading(cacheKey)

  if (cached) {
    console.info(`${READING_LOG_PREFIX} cache local utilizado`, {
      lawId: book.lawId,
      versionId: cached.reading.versionId,
      ageMs: Date.now() - cached.savedAt,
    })

    // O texto permanece local. Somente os áudios, que são exclusivos da
    // sessão e expiram, são atualizados por uma rota pequena e deduplicada.
    refreshCachedReadingAudios(cached.reading)

    return cached.reading
  }

  const fresh = await loadReadingForCurrentUser(book)
  await writeCachedLawReading(cacheKey, fresh.reading)
  console.info(`${READING_LOG_PREFIX} leitura salva no cache local`, {
    lawId: book.lawId,
    versionId: fresh.reading.versionId,
    nodes: fresh.reading.nodes.length,
  })
  return fresh.reading
}
