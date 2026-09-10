import { addDoc, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore"

import { waitForBrowserSession } from "@/lib/auth/browser-session"
import { firestore } from "@/lib/firebase/client"

export type AdminLawVersion = { id: string; version_label: string; source_file: string | null; scope_key: string; status: "draft" | "published" | "archived"; is_complete: boolean; imported_at: string }
export type AdminLaw = { law_id: string; official_name: string; short_title: string; updated_at: string; versions: AdminLawVersion[] }
export type AdminLegalNode = { id: string; node_key: string; parent_key: string | null; node_type: string; number: string | null; label: string | null; epigraphe: string; text_content: string; sort_order: number; revoked_at?: string | null }

async function requireAdmin() {
  const user = await waitForBrowserSession()
  if (!user) throw new Error("Sua sessão expirou. Faça login novamente.")
  if ((await user.getIdTokenResult()).claims.admin !== true) throw new Error("Esta operação exige uma conta administradora.")
}

function rows<T>(snapshot: Awaited<ReturnType<typeof getDocs>>) {
  return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) }) as T)
}

export async function currentFirebaseUserIsAdmin() {
  const user = await waitForBrowserSession()
  return user ? (await user.getIdTokenResult()).claims.admin === true : false
}

export async function listAdminLaws(): Promise<AdminLaw[]> {
  await requireAdmin()
  const [lawSnapshot, versionSnapshot] = await Promise.all([getDocs(collection(firestore, "laws")), getDocs(collection(firestore, "law_versions"))])
  const laws = rows<Omit<AdminLaw, "versions">>(lawSnapshot)
  const versions = rows<AdminLawVersion & { law_id: string }>(versionSnapshot)
  return laws.map((law) => ({ ...law, versions: versions.filter((version) => version.law_id === law.law_id).sort((a, b) => b.imported_at.localeCompare(a.imported_at)) })).sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export async function updateAdminLaw(lawId: string, values: Pick<AdminLaw, "official_name" | "short_title">) {
  await requireAdmin()
  await updateDoc(doc(firestore, "laws", lawId), { ...values, updated_at: new Date().toISOString() })
}

export async function updateAdminVersion(versionId: string, values: Pick<AdminLawVersion, "version_label" | "source_file" | "scope_key" | "status" | "is_complete">) {
  await requireAdmin()
  await updateDoc(doc(firestore, "law_versions", versionId), { ...values, imported_at: new Date().toISOString() })
}

export async function listAdminLegalNodes(lawId: string, versionId: string) {
  await requireAdmin()
  const [nodeSnapshot, contentSnapshot] = await Promise.all([
    getDocs(query(collection(firestore, "legal_nodes"), where("law_id", "==", lawId))),
    getDocs(query(collection(firestore, "legal_node_versions"), where("law_version_id", "==", versionId))),
  ])
  const nodes = rows<Omit<AdminLegalNode, "id" | "epigraphe" | "text_content" | "sort_order">>(nodeSnapshot)
  const contents = rows<Pick<AdminLegalNode, "id" | "node_key" | "epigraphe" | "text_content" | "sort_order" | "revoked_at">>(contentSnapshot).filter((item) => item.revoked_at == null)
  const contentByKey = new Map(contents.map((content) => [content.node_key, content]))
  return nodes.map((node) => { const content = contentByKey.get(node.node_key); return content ? { ...node, ...content, epigraphe: content.epigraphe ?? "", text_content: content.text_content ?? "" } : null }).filter((node): node is AdminLegalNode => node !== null).sort((a, b) => a.sort_order - b.sort_order)
}

export async function createAdminLegalNode(input: { law_id: string; node_key: string; parent_key: string | null; node_type: string; number: string | null; label: string | null }) {
  await requireAdmin()
  await setDoc(doc(firestore, "legal_nodes", input.node_key), { ...input, published: false })
}

export async function createAdminLegalNodeContent(input: { law_version_id: string; node_key: string; epigraphe: string; text_content: string; sort_order: number }) {
  await requireAdmin()
  await addDoc(collection(firestore, "legal_node_versions"), { ...input, revoked_at: null, published: false, created_at: serverTimestamp() })
}

export async function updateAdminLegalNodeOrder(id: string, sort_order: number) { await requireAdmin(); await updateDoc(doc(firestore, "legal_node_versions", id), { sort_order }) }
export async function revokeAdminLegalNode(id: string) { await requireAdmin(); await updateDoc(doc(firestore, "legal_node_versions", id), { revoked_at: new Date().toISOString() }) }
export async function updateAdminLegalNode(node: Pick<AdminLegalNode, "node_key" | "number" | "label">) { await requireAdmin(); await updateDoc(doc(firestore, "legal_nodes", node.node_key), { number: node.number, label: node.label }) }
export async function updateAdminLegalNodeContent(node: Pick<AdminLegalNode, "id" | "epigraphe" | "text_content">) { await requireAdmin(); await updateDoc(doc(firestore, "legal_node_versions", node.id), { epigraphe: node.epigraphe, text_content: node.text_content }) }
