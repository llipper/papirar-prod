import { waitForBrowserSession } from "@/lib/auth/browser-session"

export type AdminLawVersion = { id: string; version_label: string; source_file: string | null; scope_key: string; status: "draft" | "published" | "archived"; is_complete: boolean; imported_at: string }
export type AdminLaw = { law_id: string; official_name: string; short_title: string; updated_at: string; versions: AdminLawVersion[] }
export type AdminLegalNode = { id: string; node_key: string; parent_key: string | null; node_type: string; number: string | null; label: string | null; epigraphe: string; text_content: string; sort_order: number; revoked_at?: string | null }

const MIGRATION_MESSAGE = "A administração do catálogo está temporariamente indisponível durante a migração para o Cloudflare."

export async function currentFirebaseUserIsAdmin() {
  const user = await waitForBrowserSession()
  return Boolean(user && (await user.getIdTokenResult()).claims.admin === true)
}

function unavailable(): never { throw new Error(MIGRATION_MESSAGE) }
export async function listAdminLaws(): Promise<AdminLaw[]> { return unavailable() }
export async function updateAdminLaw(..._args: unknown[]): Promise<void> { return unavailable() }
export async function updateAdminVersion(..._args: unknown[]): Promise<void> { return unavailable() }
export async function listAdminLegalNodes(..._args: unknown[]): Promise<AdminLegalNode[]> { return unavailable() }
export async function createAdminLegalNode(..._args: unknown[]): Promise<void> { return unavailable() }
export async function createAdminLegalNodeContent(..._args: unknown[]): Promise<void> { return unavailable() }
export async function updateAdminLegalNodeOrder(..._args: unknown[]): Promise<void> { return unavailable() }
export async function revokeAdminLegalNode(..._args: unknown[]): Promise<void> { return unavailable() }
export async function updateAdminLegalNode(..._args: unknown[]): Promise<void> { return unavailable() }
export async function updateAdminLegalNodeContent(..._args: unknown[]): Promise<void> { return unavailable() }
