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

const apiBase = (
  process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ??
  "https://papirar-api.papirar-api-worker.workers.dev"
).replace(/\/$/, "")

async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = await waitForBrowserSession()
  if (!user) throw new Error("Sua sessão expirou. Entre novamente.")

  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${await user.getIdToken()}`)
  if (init.body !== undefined) headers.set("Content-Type", "application/json")

  const response = await fetch(`${apiBase}${path}`, { ...init, headers })
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

export function createAdminLegalNode(input: {
  law_id: string
  node_key: string
  parent_key: string | null
  node_type: string
  number: string | null
  label: string | null
}) {
  return adminRequest<void>("/admin/catalog/nodes", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function createAdminLegalNodeContent(input: {
  law_version_id: string
  node_key: string
  epigraphe: string
  text_content: string
  sort_order: number
}) {
  return adminRequest<void>("/admin/catalog/node-versions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateAdminLegalNodeOrder(id: string, sort_order: number) {
  return adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ sort_order }),
  })
}

export function revokeAdminLegalNode(id: string) {
  return adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  })
}

export function updateAdminLegalNode(
  node: Pick<AdminLegalNode, "node_key" | "number" | "label">,
) {
  return adminRequest<void>(`/admin/catalog/nodes/${encodeURIComponent(node.node_key)}`, {
    method: "PATCH",
    body: JSON.stringify({ number: node.number, label: node.label }),
  })
}

export function updateAdminLegalNodeContent(
  node: Pick<AdminLegalNode, "id" | "epigraphe" | "text_content">,
) {
  return adminRequest<void>(`/admin/catalog/node-versions/${encodeURIComponent(node.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ epigraphe: node.epigraphe, text_content: node.text_content }),
  })
}
