import { waitForBrowserSession } from "@/lib/auth/browser-session"

export type AdminLawVersion = { id: string; version_label: string; source_file: string | null; scope_key: string; status: "draft" | "published" | "archived"; is_complete: boolean; imported_at: string }
export type AdminLaw = { law_id: string; official_name: string; short_title: string; updated_at: string; versions: AdminLawVersion[] }
export type AdminLegalNode = { id: string; node_key: string; parent_key: string | null; node_type: string; number: string | null; label: string | null; epigraphe: string; text_content: string; sort_order: number; revoked_at?: string | null }

const MIGRATION_MESSAGE = "A administração do catálogo está temporariamente indisponível durante a migração para o Cloudflare."

export async function currentFirebaseUserIsAdmin() {
  const user = await waitForBrowserSession()
  return Boolean(user && (await user.getIdTokenResult()).claims.admin === true)
}

function unavailable(...args: unknown[]): never {
  void args
  throw new Error(MIGRATION_MESSAGE)
}
export async function listAdminLaws(): Promise<AdminLaw[]> { return unavailable() }
export async function updateAdminLaw(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function updateAdminVersion(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function listAdminLegalNodes(...args: unknown[]): Promise<AdminLegalNode[]> { return unavailable(...args) }
export async function createAdminLegalNode(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function createAdminLegalNodeContent(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function updateAdminLegalNodeOrder(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function revokeAdminLegalNode(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function updateAdminLegalNode(...args: unknown[]): Promise<void> { return unavailable(...args) }
export async function updateAdminLegalNodeContent(...args: unknown[]): Promise<void> { return unavailable(...args) }
