import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"
import { getSupabasePublicConfig } from "@/lib/supabase/public-config"

export type UserProfile = {
  id: string
  email: string
  displayName: string
  username: string
  bio: string
  avatarUrl: string | null
  profileColor: string
  createdAt: string | null
}

type Session = {
  access_token?: string
  user?: { id?: string; email?: string; user_metadata?: { name?: string } }
}

function getSession() {
  if (typeof window === "undefined") throw new Error("Sessão indisponível.")
  const raw = window.localStorage.getItem("papirar.auth.session")
  const session = raw ? (JSON.parse(raw) as Session) : null
  if (!session?.access_token || !session.user?.id)
    throw new Error("Sessão expirada.")
  return session as Required<Pick<Session, "access_token" | "user">>
}

function config() {
  const { url, publicKey } = getSupabasePublicConfig()
  return { url, anonKey: publicKey }
}

function headers(session: Session, extra: Record<string, string> = {}) {
  return {
    apikey: config().anonKey,
    Authorization: `Bearer ${session.access_token}`,
    ...extra,
  }
}

function toProfile(
  row: Record<string, unknown>,
  session: Session
): UserProfile {
  const user = session.user ?? {}
  const avatarPath =
    typeof row.avatar_path === "string" ? row.avatar_path : null
  return {
    id: String(row.id ?? user.id ?? ""),
    email: user.email ?? "",
    displayName: String(
      row.display_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "Aluno Papirar"
    ),
    username: String(row.username ?? "papirar"),
    bio: String(row.bio ?? ""),
    profileColor: /^#[0-9A-Fa-f]{6}$/.test(String(row.profile_color ?? ""))
      ? String(row.profile_color)
      : "#f3f4f6",
    avatarUrl: avatarPath
      ? `${config().url}/storage/v1/object/public/avatars/${avatarPath}?v=${row.updated_at ?? ""}`
      : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
  }
}

export async function getCurrentProfile() {
  const session = getSession()
  const { url } = config()
  const response = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id!)}&select=*`,
    {
      headers: headers(session),
    }
  )
  if (!response.ok) throw new Error("Não foi possível carregar seu perfil.")
  const rows = (await response.json()) as Record<string, unknown>[]
  if (rows[0]) return toProfile(rows[0], session)

  const email = session.user.email ?? ""
  const username =
    `${(email.split("@")[0] || "aluno").replace(/[^a-z0-9_]/gi, "_")}_${session.user.id!.replaceAll("-", "").slice(0, 6)}`
      .slice(0, 30)
      .toLowerCase()
  const createResponse = await fetch(`${url}/rest/v1/profiles`, {
    method: "POST",
    headers: headers(session, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      id: session.user.id,
      display_name: session.user.user_metadata?.name ?? email.split("@")[0],
      username,
      bio: "",
    }),
  })
  if (!createResponse.ok) throw new Error("Não foi possível criar seu perfil.")
  return toProfile(
    ((await createResponse.json()) as Record<string, unknown>[])[0],
    session
  )
}

export async function updateProfile(
  input: Pick<UserProfile, "displayName" | "username" | "bio" | "profileColor">
) {
  const session = getSession()
  const { url } = config()
  const response = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id!)}`,
    {
      method: "PATCH",
      headers: headers(session, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({
        display_name: input.displayName.trim(),
        username: input.username.trim(),
        bio: input.bio.trim(),
        profile_color: input.profileColor,
      }),
    }
  )
  if (!response.ok) throw new Error("Não foi possível salvar seu perfil.")
  return toProfile(
    ((await response.json()) as Record<string, unknown>[])[0],
    session
  )
}

export async function uploadAvatar(file: File) {
  const session = getSession()
  const { url } = config()
  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg"
  const path = `${session.user.id}/avatar.${extension}`
  const uploadResponse = await fetch(
    `${url}/storage/v1/object/avatars/${path}`,
    {
      method: "POST",
      headers: headers(session, {
        "Content-Type": file.type || "image/jpeg",
        "x-upsert": "true",
      }),
      body: file,
    }
  )
  if (!uploadResponse.ok)
    throw new Error("Não foi possível atualizar seu avatar.")
  const updateResponse = await fetch(
    `${url}/rest/v1/profiles?id=eq.${encodeURIComponent(session.user.id!)}`,
    {
      method: "PATCH",
      headers: headers(session, {
        "Content-Type": "application/json",
        Prefer: "return=representation",
      }),
      body: JSON.stringify({ avatar_path: path }),
    }
  )
  if (!updateResponse.ok) throw new Error("Não foi possível salvar seu avatar.")
  return toProfile(
    ((await updateResponse.json()) as Record<string, unknown>[])[0],
    session
  )
}

export function clearBrowserSession() {
  getSupabaseBrowserClient()
  window.localStorage.removeItem("papirar.auth.session")
}
