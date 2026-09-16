import type { BibliotecaBook } from "./catalog-data"
import { collection, getDocs, query, where } from "firebase/firestore"
import { firestore } from "@/lib/firebase/client"
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
}

export type ReadingAudio = {
  key: string
  title: string
  url: string
  durationMs: number | null
}

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

const R2_AUDIOS_PUBLIC_BASE = "https://pub-a3c9a956d81e471cb098b03163f85414.r2.dev"

export function normalizeAudioUrl(rawUrl: string): string {
  if (!rawUrl) return ""
  try {
    const parsed = new URL(rawUrl)
    // O worker transforma a public_url em /assets/laws/... com assinatura temporária,
    // mas o endpoint /assets/ lê do bucket papirar-assets (que não tem os áudios),
    // retornando 404. O arquivo real está no bucket público papirar-audios (pub-a3c9a956d81e471cb098b03163f85414.r2.dev):
    if (parsed.pathname.includes("/laws/") || parsed.pathname.includes("/audio/")) {
      const match = parsed.pathname.match(/\/(laws\/.*|audio\/.*)/)
      if (match) {
        const cleanPath = match[1].replace(/^\/+/, "")
        return `${R2_AUDIOS_PUBLIC_BASE}/${cleanPath}`
      }
    }
  } catch {
    // mantém original se não for URL válida
  }
  return rawUrl
}

export function normalizeReadingAudios(reading: LawReading): LawReading {
  return {
    ...reading,
    nodes: reading.nodes.map((n) => {
      if (!n.audio) return n
      return {
        ...n,
        audio: {
          ...n.audio,
          url: normalizeAudioUrl(n.audio.url),
        },
      }
    }),
  }
}

async function firestoreRows<T>(name: string, field: string, value: string): Promise<T[]> {
  const constraints = [where(field, "==", value)]
  constraints.push(name === "law_versions" ? where("status", "==", "published") : where("published", "==", true))
  if (name === "legal_node_versions") constraints.push(where("revoked_at", "==", null))
  if (name === "lei_audio_assets") constraints.push(where("status", "==", "ready"))
  const snapshot = await getDocs(query(collection(firestore, name), ...constraints))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T)
}

export const LAW_READING_UPDATED_EVENT = "papirar:law-reading-updated"
const LAW_READING_REVALIDATION_MS = 15 * 60 * 1000

async function loadLawReadingFromRemote(book: BibliotecaBook): Promise<LawReading> {
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
  const token = getAuth().currentUser ? await getAuth().currentUser!.getIdToken() : null
  const response = await fetch(`${process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev"}/catalog/reading?lawId=${encodeURIComponent(catalogLawId)}&version=${encodeURIComponent(catalogVersion)}&scope=${encodeURIComponent(catalogScope)}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
  if (!response.ok) throw new Error("Não foi possível carregar o conteúdo da lei.")
  const catalog = await response.json() as { law: { id: string; title: string; acronym: string }; version: { id: string }; nodes: Array<{ node_key: string; node_type: string; number?: string; label?: string }>; contents: Array<{ node_key: string; epigraphe?: string; text_content?: string; sort_order: number }>; audios: Array<{ node_key?: string; audio_key: string; title: string; public_url: string; duration_ms?: number | null }> }
  const catalogNodeByKey = new Map(catalog.nodes.map((node) => [node.node_key, node]))
  const catalogAudioByNode = new Map(catalog.audios.filter((audio) => audio.node_key && audio.public_url).map((audio) => [audio.node_key as string, { key: audio.audio_key, title: audio.title || "Áudio da lei", url: normalizeAudioUrl(audio.public_url), durationMs: audio.duration_ms ?? null }]))
  return { lawId: catalog.law.id, versionId: catalog.version.id, title: catalog.law.title, acronym: catalog.law.acronym, nodes: catalog.contents.map((content) => { const node = catalogNodeByKey.get(content.node_key); return { nodeKey: content.node_key, nodeType: node?.node_type ?? "", number: node?.number ?? "", label: node?.label ?? "", epigraphe: content.epigraphe ?? "", text: content.text_content ?? "", sortOrder: content.sort_order, audio: catalogAudioByNode.get(content.node_key) } }), annexes: [] }
  /* Firestore fallback retained below for rollback during the cutover. */

  const lawId = book.lawId!
  const versionRows = (await firestoreRows<{ id: string; version_label: string; scope_key: string; status: string }>(
    "law_versions", "law_id", lawId
  )).filter((row) => row.version_label === book.version && row.scope_key === book.scope && row.status === "published")
  const versionId = versionRows[0]?.id
  if (!versionId) {
    console.error(`${READING_LOG_PREFIX} versão não encontrada`, {
      lawId: book.lawId,
      version: book.version,
      scope: book.scope,
      expectedStatus: "published",
    })
    throw new Error("Versão da lei não encontrada.")
  }

  console.info(`${READING_LOG_PREFIX} versão encontrada`, {
    lawId: book.lawId,
    versionId,
  })

  const nodeRows = await firestoreRows<{
    node_key: string
    node_type: string
    number: string | null
    label: string | null
  }>("legal_nodes", "law_id", lawId)
  const nodeByKey = new Map(nodeRows.map((node) => [node.node_key, node]))

  const contentRows = (await firestoreRows<{
    node_key: string
    epigraphe: string | null
    text_content: string | null
    sort_order: number
    revoked_at?: unknown
  }>("legal_node_versions", "law_version_id", versionId))
    .filter((row) => row.revoked_at == null)
    .sort((a, b) => a.sort_order - b.sort_order)

  const audioRows = (await firestoreRows<{
      node_key: string | null
      audio_key: string
      title: string
      public_url: string
      duration_ms: number | null
      law_version_id: string
      status: string
    }
  >("lei_audio_assets", "law_id", lawId))
    .filter((row) => row.law_version_id === versionId && row.status === "ready")
  const audioByNode = new Map(
    audioRows
      .filter((audio) => audio.node_key && audio.public_url)
      .map((audio) => [
        audio.node_key as string,
        {
          key: audio.audio_key,
          title: audio.title || "Áudio da lei",
          url: audio.public_url,
          durationMs: audio.duration_ms,
        },
      ])
  )

  const nodes = contentRows
    .map((content) => {
      const node = nodeByKey.get(content.node_key)
      if (!node) return null
      return {
        nodeKey: content.node_key,
        nodeType: node.node_type,
        number: node.number ?? "",
        label: node.label?.trim() ?? "",
        epigraphe: content.epigraphe?.trim() ?? "",
        text: content.text_content?.trim() ?? "",
        sortOrder: content.sort_order,
        audio: audioByNode.get(content.node_key),
      }
    })
    .filter((node): node is ReadingNode => node !== null)

  const annexRows = (await firestoreRows<{
    id: string
    annex_key: string
    title: string
    subtitle: string | null
    left_header: string
    right_header: string
    sort_order: number
  }>("legal_annexes", "law_version_id", versionId)).sort((a, b) => a.sort_order - b.sort_order)

  const annexes: ReadingAnnex[] = []
  for (const annex of annexRows) {
    const rows = (await firestoreRows<{
      row_key: string
      item_code: string | null
      description: string
      amount_display: string | null
      note: string | null
      columns: unknown
      sort_order: number
    }>("legal_annex_rows", "annex_id", annex.id)).sort((a, b) => a.sort_order - b.sort_order)

    annexes.push({
      annexKey: annex.annex_key,
      title: annex.title.trim(),
      subtitle: annex.subtitle?.trim() ?? "",
      leftHeader: annex.left_header.trim(),
      rightHeader: annex.right_header.trim(),
      rows: rows.map((row) => ({
        rowKey: row.row_key,
        itemCode: row.item_code?.trim() ?? "",
        description: row.description.trim(),
        amountDisplay: row.amount_display?.trim() ?? "",
        note: row.note?.trim() ?? "",
        columns: Array.isArray(row.columns) ? row.columns.map((value) => String(value ?? "")) : [],
        sortOrder: row.sort_order,
      })),
    })
  }

  console.info(`${READING_LOG_PREFIX} leitura pronta`, {
    lawId: book.lawId,
    nodes: nodes.length,
    audios: audioByNode.size,
    annexes: annexes.length,
  })

  return { lawId: book.lawId!, versionId, title: book.title, acronym: book.acronym, nodes, annexes }
}

export async function loadLawReading(book: BibliotecaBook): Promise<LawReading> {
  if (!book.lawId || !book.version || !book.scope) {
    return loadLawReadingFromRemote(book)
  }

  const cacheKey = createLawReadingCacheKey(book.lawId, book.version, book.scope)
  const cached = await readCachedLawReading(cacheKey)

  if (cached) {
    console.info(`${READING_LOG_PREFIX} cache local utilizado`, {
      lawId: book.lawId,
      versionId: cached.reading.versionId,
      ageMs: Date.now() - cached.savedAt,
    })

    const normalizedCachedReading = normalizeReadingAudios(cached.reading)

    if (Date.now() - cached.savedAt < LAW_READING_REVALIDATION_MS) {
      return normalizedCachedReading
    }

    void loadLawReadingFromRemote(book)
      .then(async (freshReading) => {
        await writeCachedLawReading(cacheKey, freshReading)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent<LawReading>(LAW_READING_UPDATED_EVENT, {
              detail: freshReading,
            })
          )
        }
      })
      .catch((reason: unknown) => {
        console.warn(`${READING_LOG_PREFIX} atualização em segundo plano indisponível`, {
          lawId: book.lawId,
          reason,
        })
      })

    return normalizedCachedReading
  }

  const freshReading = await loadLawReadingFromRemote(book)
  await writeCachedLawReading(cacheKey, freshReading)
  console.info(`${READING_LOG_PREFIX} leitura salva no cache local`, {
    lawId: book.lawId,
    versionId: freshReading.versionId,
    nodes: freshReading.nodes.length,
  })
  return freshReading
}
