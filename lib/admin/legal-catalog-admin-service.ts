import { getSupabasePublicConfig } from "@/lib/supabase/public-config"

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

function getHeaders() {
  const { publicKey } = getSupabasePublicConfig()
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem("papirar.auth.session")
  const token = raw ? (JSON.parse(raw) as { access_token?: string }).access_token : undefined
  if (!token) throw new Error("Sua sessão expirou. Faça login novamente.")
  return {
    apikey: publicKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  }
}

async function request<T>(path: string, init?: RequestInit) {
  const { url } = getSupabasePublicConfig()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { ...getHeaders(), ...init?.headers },
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Supabase respondeu ${response.status}.`)
  }
  if (response.status === 204 || response.status === 205) return undefined as T
  const body = await response.text()
  return (body ? JSON.parse(body) : undefined) as T
}

export async function listAdminLaws(): Promise<AdminLaw[]> {
  const laws = await request<Array<Omit<AdminLaw, "versions">>>(
    "laws?select=law_id,official_name,short_title,updated_at&order=updated_at.desc"
  )
  const versions = await request<Array<AdminLawVersion & { law_id: string }>>(
    "law_versions?select=id,law_id,version_label,source_file,scope_key,status,is_complete,imported_at&order=imported_at.desc"
  )
  return laws.map((law) => ({
    ...law,
    versions: versions.filter((version) => version.law_id === law.law_id),
  }))
}

export async function updateAdminLaw(
  lawId: string,
  values: Pick<AdminLaw, "official_name" | "short_title">
) {
  await request(`laws?law_id=eq.${encodeURIComponent(lawId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...values, updated_at: new Date().toISOString() }),
  })
}

export async function updateAdminVersion(
  versionId: string,
  values: Pick<AdminLawVersion, "version_label" | "source_file" | "scope_key" | "status" | "is_complete">
) {
  await request(`law_versions?id=eq.${encodeURIComponent(versionId)}`, {
    method: "PATCH",
    body: JSON.stringify({ ...values, imported_at: new Date().toISOString() }),
  })
}

export async function listAdminLegalNodes(lawId: string, versionId: string) {
  const [nodes, contents] = await Promise.all([
    request<Array<Omit<AdminLegalNode, "id" | "epigraphe" | "text_content" | "sort_order">>>(
      `legal_nodes?select=node_key,parent_key,node_type,number,label&law_id=eq.${encodeURIComponent(lawId)}&order=node_key.asc`
    ),
    request<Array<Pick<AdminLegalNode, "id" | "node_key" | "epigraphe" | "text_content" | "sort_order">>>(
      `legal_node_versions?select=id,node_key,epigraphe,text_content,sort_order,revoked_at&law_version_id=eq.${encodeURIComponent(versionId)}&revoked_at=is.null&order=sort_order.asc`
    ),
  ])
  const contentByKey = new Map(contents.map((content) => [content.node_key, content]))
  return nodes
    .map((node) => {
      const content = contentByKey.get(node.node_key)
      if (!content) return null
      return { ...node, ...content, epigraphe: content.epigraphe ?? "", text_content: content.text_content ?? "" }
    })
    .filter((node): node is AdminLegalNode => node !== null)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export async function createAdminLegalNode(input: {
  law_id: string
  node_key: string
  parent_key: string | null
  node_type: string
  number: string | null
  label: string | null
}) {
  await request("legal_nodes", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function createAdminLegalNodeContent(input: {
  law_version_id: string
  node_key: string
  epigraphe: string
  text_content: string
  sort_order: number
}) {
  await request("legal_node_versions", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateAdminLegalNodeOrder(id: string, sort_order: number) {
  await request(`legal_node_versions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ sort_order }),
  })
}

export async function revokeAdminLegalNode(id: string) {
  await request(`legal_node_versions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  })
}

export async function updateAdminLegalNode(node: Pick<AdminLegalNode, "node_key" | "number" | "label">) {
  await request(`legal_nodes?node_key=eq.${encodeURIComponent(node.node_key)}`, {
    method: "PATCH",
    body: JSON.stringify({ number: node.number, label: node.label }),
  })
}

export async function updateAdminLegalNodeContent(node: Pick<AdminLegalNode, "id" | "epigraphe" | "text_content">) {
  await request(`legal_node_versions?id=eq.${encodeURIComponent(node.id)}`, {
    method: "PATCH",
    body: JSON.stringify({ epigraphe: node.epigraphe, text_content: node.text_content }),
  })
}
