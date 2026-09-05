import type { BibliotecaBook } from "./catalog-data"
import { getSupabasePublicConfig } from "@/lib/supabase/public-config"
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

type Session = { access_token?: string }

class SessionExpiredError extends Error {
  constructor() {
    super("Sua sessão expirou. Faça login novamente.")
    this.name = "SessionExpiredError"
  }
}

const READING_LOG_PREFIX = "[Papirar][Leitura]"

function getConfig() {
  const { url, publicKey } = getSupabasePublicConfig()
  return { url, anonKey: publicKey }
}

function expireBrowserSession() {
  if (typeof window === "undefined") return

  window.localStorage.removeItem("papirar.auth.session")
  console.warn(`${READING_LOG_PREFIX} sessão expirada; redirecionando para o login`)

  if (!window.location.pathname.startsWith("/login")) {
    window.location.replace("/login?reason=session_expired")
  }
}

function getHeaders() {
  const { anonKey } = getConfig()
  let token: string | undefined
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem("papirar.auth.session")
    try {
      token = raw ? (JSON.parse(raw) as Session).access_token : undefined
    } catch (reason: unknown) {
      console.error(`${READING_LOG_PREFIX} sessão inválida no armazenamento local`, { reason })
      expireBrowserSession()
      throw new SessionExpiredError()
    }
  }

  if (!token) {
    expireBrowserSession()
    throw new SessionExpiredError()
  }

  return {
    apikey: anonKey,
    Authorization: `Bearer ${token}`,
  }
}

async function query<T>(path: string) {
  const { url } = getConfig()
  const endpoint = `${url}/rest/v1/${path}`
  const startedAt = performance.now()

  console.info(`${READING_LOG_PREFIX} consultando`, { path })

  try {
    const response = await fetch(endpoint, {
      headers: getHeaders(),
    })
    const responseText = await response.text()
    const durationMs = Math.round(performance.now() - startedAt)

    if (!response.ok) {
      console.error(`${READING_LOG_PREFIX} Supabase recusou a consulta`, {
        path,
        status: response.status,
        statusText: response.statusText,
        durationMs,
        response: responseText.slice(0, 1000),
      })

      if (
        response.status === 401 &&
        (responseText.includes("PGRST303") || responseText.toLowerCase().includes("jwt expired"))
      ) {
        expireBrowserSession()
        throw new SessionExpiredError()
      }

      throw new Error(`Supabase respondeu ${response.status} ao carregar a lei.`)
    }

    console.info(`${READING_LOG_PREFIX} consulta concluída`, {
      path,
      status: response.status,
      durationMs,
      responseBytes: responseText.length,
    })

    return JSON.parse(responseText) as T
  } catch (reason: unknown) {
    if (reason instanceof SessionExpiredError) {
      throw reason
    }

    if (reason instanceof Error && reason.message.startsWith("Supabase respondeu")) {
      throw reason
    }

    console.error(`${READING_LOG_PREFIX} erro de rede ou JSON`, {
      path,
      reason,
    })
    throw new Error("Não foi possível conectar ao Supabase para carregar a lei.")
  }
}

async function queryAll<T>(path: string) {
  const pageSize = 1000
  const rows: T[] = []
  for (let start = 0; ; start += pageSize) {
    const page = await query<T[]>(`${path}&offset=${start}&limit=${pageSize}`)
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
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

  const lawId = encodeURIComponent(book.lawId)
  const version = encodeURIComponent(book.version)
  const scope = encodeURIComponent(book.scope)
  const versionRows = await query<{ id: string }[]>(
    `law_versions?select=id&law_id=eq.${lawId}&version_label=eq.${version}&scope_key=eq.${scope}&status=eq.published&limit=1`
  )
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

  const nodeRows = await queryAll<{
    node_key: string
    node_type: string
    number: string | null
    label: string | null
  }>(
    `legal_nodes?select=node_key,node_type,number,label&law_id=eq.${lawId}&order=node_key.asc`
  )
  const nodeByKey = new Map(nodeRows.map((node) => [node.node_key, node]))

  const contentRows = await queryAll<{
    node_key: string
    epigraphe: string | null
    text_content: string | null
    sort_order: number
  }>(
    `legal_node_versions?select=node_key,epigraphe,text_content,sort_order&law_version_id=eq.${encodeURIComponent(versionId)}&revoked_at=is.null&order=sort_order.asc`
  )

  const audioRows = await query<
    Array<{
      node_key: string | null
      audio_key: string
      title: string
      public_url: string
      duration_ms: number | null
    }>
  >(
    `lei_audio_assets?select=node_key,audio_key,title,public_url,duration_ms&law_id=eq.${lawId}&law_version_id=eq.${encodeURIComponent(versionId)}&status=eq.ready`
  )
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

  const annexRows = await queryAll<{
    id: string
    annex_key: string
    title: string
    subtitle: string | null
    left_header: string
    right_header: string
    sort_order: number
  }>(
    `legal_annexes?select=id,annex_key,title,subtitle,left_header,right_header,sort_order&law_version_id=eq.${encodeURIComponent(versionId)}&order=sort_order.asc`
  )

  const annexes: ReadingAnnex[] = []
  for (const annex of annexRows) {
    const rows = await queryAll<{
      row_key: string
      item_code: string | null
      description: string
      amount_display: string | null
      note: string | null
      columns: unknown
      sort_order: number
    }>(
      `legal_annex_rows?select=row_key,item_code,description,amount_display,note,columns,sort_order&annex_id=eq.${encodeURIComponent(annex.id)}&order=sort_order.asc`
    )

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

  return { lawId: book.lawId, versionId, title: book.title, acronym: book.acronym, nodes, annexes }
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

    if (Date.now() - cached.savedAt < LAW_READING_REVALIDATION_MS) {
      return cached.reading
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

    return cached.reading
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
