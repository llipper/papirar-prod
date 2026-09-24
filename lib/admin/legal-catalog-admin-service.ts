import { waitForBrowserSession } from "@/lib/auth/browser-session"

export type AdminLawVersion = {
  id: string
  version_label: string
  source_file: string | null
  scope_key: string
  status: "draft" | "published" | "archived"
  is_complete: boolean
  imported_at: string
}

export type AdminLaw = {
  law_id: string
  official_name: string
  short_title: string
  updated_at: string
  versions: AdminLawVersion[]
}

export type AdminLegalNode = {
  id: string
  node_key: string
  parent_key: string | null
  node_type: string
  number: string | null
  label: string | null
  epigraphe: string
  text_content: string
  sort_order: number
  revoked_at?: string | null
}

export type AdminLegalNodePage = {
  nodes: AdminLegalNode[]
  next_offset: number | null
}

export type LegalChangeNotification = {
  id: string
  law_id: string
  law_title: string
  law_acronym: string
  change_type: "added" | "changed" | "revoked" | "published" | "law_revoked"
  node_key: string | null
  node_label: string
  summary: string
  created_at: string
  is_read: boolean | number
}

export type LegalChangeNotificationPage = {
  notifications: LegalChangeNotification[]
  unread_count: number
}

const apiBase = (
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ??
  "https://papirar-api.papirar-api-worker.workers.dev"
).replace(/\/$/, "")

const legacyNodeCache = new Map<string, AdminLegalNode[]>()
let legalNotificationsRequest: Promise<LegalChangeNotificationPage> | null = null
let legalNotificationsCache: {
  expiresAt: number
  value: LegalChangeNotificationPage
} | null = null

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = await waitForBrowserSession()
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.")

  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`)
  if (init.body !== undefined) headers.set("Content-Type", "application/json")

  let response: Response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    })
  } catch {
    throw new Error(
      "Não foi possível conectar ao catálogo. Verifique sua conexão e tente novamente.",
    )
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: unknown } | null
    const message = typeof body?.error === "string" ? body.error : `A API respondeu ${response.status}.`
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export async function currentFirebaseUserIsAdmin() {
  const user = await waitForBrowserSession()
  return Boolean(user && (await user.getIdTokenResult()).claims.admin === true)
}

export function listAdminLaws(): Promise<AdminLaw[]> {
  return adminRequest("/admin/catalog/laws")
}

export function listLegalChangeNotifications() {
  if (legalNotificationsCache && legalNotificationsCache.expiresAt > Date.now()) {
    return Promise.resolve(legalNotificationsCache.value)
  }
  if (legalNotificationsRequest) return legalNotificationsRequest

  legalNotificationsRequest = adminRequest<LegalChangeNotificationPage>("/notifications/legal-changes")
    .then((value) => {
      legalNotificationsCache = { value, expiresAt: Date.now() + 15_000 }
      return value
    })
    .finally(() => {
      legalNotificationsRequest = null
    })
  return legalNotificationsRequest
}

export function markLegalChangeNotificationRead(id: string) {
  return adminRequest<void>(`/notifications/legal-changes/${encodeURIComponent(id)}/read`, { method: "POST" })
}

export function markAllLegalChangeNotificationsRead() {
  return adminRequest<void>("/notifications/legal-changes/read-all", { method: "POST" })
}

export function updateAdminLaw(
  lawId: string,
  values: Pick<AdminLaw, "official_name" | "short_title">,
) {
  return adminRequest<void>(`/admin/catalog/laws/${encodeURIComponent(lawId)}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  })
}

export function updateAdminVersion(
  versionId: string,
  values: Pick<AdminLawVersion, "version_label" | "source_file" | "scope_key" | "status" | "is_complete">,
) {
  return adminRequest<void>(`/admin/catalog/versions/${encodeURIComponent(versionId)}`, {
    method: "PATCH",
    body: JSON.stringify(values),
  })
}

export function listAdminLegalNodes(lawId: string, versionId: string) {
  const query = new URLSearchParams({ lawId, versionId })
  return adminRequest<AdminLegalNode[]>(`/admin/catalog/nodes?${query}`)
}

export function listAdminLegalNodesPage(
  lawId: string,
  versionId: string,
  offset = 0,
  limit = 60,
) {
  const cacheKey = `${lawId}:${versionId}`
  const cached = legacyNodeCache.get(cacheKey)
  if (cached) {
    return Promise.resolve({
      nodes: cached.slice(offset, offset + limit),
      next_offset: offset + limit < cached.length ? offset + limit : null,
    })
  }
  const query = new URLSearchParams({
    lawId,
    versionId,
    offset: String(offset),
    limit: String(limit),
  })
  return adminRequest<unknown>(`/admin/catalog/nodes?${query}`).then((result) => {
    if (Array.isArray(result)) {
      const legacyNodes = result as AdminLegalNode[]
      legacyNodeCache.set(cacheKey, legacyNodes)
      return {
        nodes: legacyNodes.slice(offset, offset + limit),
        next_offset: offset + limit < legacyNodes.length ? offset + limit : null,
      }
    }
    if (
      typeof result === "object" &&
      result !== null &&
      "nodes" in result &&
      Array.isArray(result.nodes)
    ) {
      const page = result as AdminLegalNodePage
      return {
        nodes: page.nodes,
        next_offset:
          typeof page.next_offset === "number" ? page.next_offset : null,
      }
    }
    throw new Error("A API retornou uma página inválida do catálogo.")
  })
}

export function createAdminLegalNode(input: {
  law_id: string
  law_version_id: string
  node_key: string
  parent_key: string | null
  node_type: string
  number: string | null
  label: string | null
  epigraphe: string
  text_content: string
  sort_order: number
}) {
  return adminRequest<{ id?: string }>("/admin/catalog/nodes", {
    method: "POST",
    body: JSON.stringify(input),
  }).then((result) => {
    legacyNodeCache.clear()
    if (result && typeof result.id === "string") return { id: result.id }
    return adminRequest<void>("/admin/catalog/node-versions", {
      method: "POST",
      body: JSON.stringify({
        law_version_id: input.law_version_id,
        node_key: input.node_key,
        epigraphe: input.epigraphe,
        text_content: input.text_content,
        sort_order: Math.max(0, Math.round(input.sort_order)),
      }),
    }).then(async () => {
      const nodes = await listAdminLegalNodes(input.law_id, input.law_version_id)
      const created = nodes.find((node) => node.node_key === input.node_key)
      if (!created)
        throw new Error("O Worker está desatualizado e não confirmou a inclusão.")
      legacyNodeCache.set(`${input.law_id}:${input.law_version_id}`, nodes)
      return { id: created.id }
    })
  })
}

export async function updateAdminLegalNodeOrder(id: string, sort_order: number) {
  await adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ sort_order }),
  })
  legacyNodeCache.clear()
}

export async function revokeAdminLegalNode(id: string) {
  await adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  })
  legacyNodeCache.clear()
}

export function updateAdminLegalNode(
  node: Pick<AdminLegalNode, "node_key" | "number" | "label">,
) {
  return adminRequest<void>(`/admin/catalog/nodes/${encodeURIComponent(node.node_key)}`, {
    method: "PATCH",
    body: JSON.stringify({ number: node.number, label: node.label }),
  }).then(() => legacyNodeCache.clear())
}

export function updateAdminLegalNodeContent(
  node: Pick<AdminLegalNode, "id" | "epigraphe" | "text_content">,
) {
  return adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(node.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ epigraphe: node.epigraphe, text_content: node.text_content }),
  }).then(() => legacyNodeCache.clear())
}
