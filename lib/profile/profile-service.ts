import { signOut, updateProfile as updateAuthProfile, type User } from "firebase/auth"
import { waitForBrowserSession } from "@/lib/auth/browser-session"
import { firebaseAuth } from "@/lib/firebase/client"

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

async function requireUser() {
  const user = firebaseAuth.currentUser ?? (await waitForBrowserSession())
  if (!user) throw new Error("Sessão expirada.")
  return user
}

function defaultUsername(user: User) {
  const base = (user.email?.split("@")[0] || "aluno")
    .replace(/[^a-z0-9_]/gi, "_")
    .toLowerCase()
  return `${base}_${user.uid.replaceAll("-", "").slice(0, 6)}`.slice(0, 30)
}

function validColor(value: unknown) {
  const color = String(value ?? "")
  return /^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#f3f4f6"
}

function toProfile(data: Record<string, unknown>, user: User): UserProfile {
  return {
    id: user.uid,
    email: user.email ?? String(data.email ?? ""),
    displayName:
      String(data.display_name || "") ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Aluno Papirar",
    username: String(data.username || defaultUsername(user)),
    bio: String(data.bio || ""),
    avatarUrl: typeof data.avatar_url === "string" ? data.avatar_url : user.photoURL || null,
    profileColor: validColor(data.profile_color),
    createdAt: typeof data.created_at === "string" ? data.created_at : user.metadata.creationTime || null,
  }
}

const apiBase = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev").replace(/\/$/, "")

async function profileRequest(method: "GET" | "PATCH", body?: unknown) {
  const user = await requireUser()
  const response = await fetch(`${apiBase}/profile`, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null
  if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Não foi possível carregar o perfil.")
  return payload ?? {}
}

export async function getCurrentProfile() {
  const user = await requireUser()
  return toProfile(await profileRequest("GET"), user)
}

export async function updateProfile(
  input: Pick<UserProfile, "displayName" | "username" | "bio" | "profileColor">,
) {
  const user = await requireUser()
  const normalized = {
    display_name: input.displayName.trim(),
    username: input.username.trim().toLowerCase(),
    bio: input.bio.trim(),
    profile_color: validColor(input.profileColor),
  }
  await updateAuthProfile(user, { displayName: normalized.display_name })
  return toProfile(await profileRequest("PATCH", { displayName: normalized.display_name, username: normalized.username, bio: normalized.bio, profileColor: normalized.profile_color }), user)
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const user = await requireUser()
  const form = new FormData()
  form.append("file", file)
  const response = await fetch(`${apiBase}/profile/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: form,
  })
  if (!response.ok) throw new Error(`Não foi possível enviar o avatar (${response.status}).`)
  const payload = await response.json() as { url?: string; path?: string }
  if (!payload.url) throw new Error("O serviço de avatar retornou uma resposta inválida.")
  await updateAuthProfile(user, { photoURL: payload.url })
  return toProfile(await profileRequest("GET"), user)
}

export function clearBrowserSession() {
  void signOut(firebaseAuth)
}
