import { signOut, updateProfile as updateAuthProfile, type User } from "firebase/auth"
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { waitForBrowserSession } from "@/lib/auth/browser-session"
import { firebaseAuth, firestore } from "@/lib/firebase/client"

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

type ProfileDocument = {
  user_id?: string
  email?: string
  display_name?: string
  username?: string
  bio?: string
  avatar_url?: string | null
  profile_color?: string
  created_at?: { toDate?: () => Date } | string | null
}

async function requireUser() {
  const user = firebaseAuth.currentUser ?? (await waitForBrowserSession())
  if (!user) throw new Error("Sessão expirada.")
  return user
}

function profileRef(uid: string) {
  return doc(firestore, "users", uid, "profiles", "main")
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

function createdAtValue(value: ProfileDocument["created_at"]) {
  if (typeof value === "string") return value
  if (value && typeof value.toDate === "function") {
    return value.toDate().toISOString()
  }
  return null
}

function toProfile(data: ProfileDocument, user: User): UserProfile {
  return {
    id: user.uid,
    email: user.email ?? data.email ?? "",
    displayName:
      data.display_name ||
      user.displayName ||
      user.email?.split("@")[0] ||
      "Aluno Papirar",
    username: data.username || defaultUsername(user),
    bio: data.bio || "",
    avatarUrl: data.avatar_url || user.photoURL || null,
    profileColor: validColor(data.profile_color),
    createdAt: createdAtValue(data.created_at) || user.metadata.creationTime || null,
  }
}

export async function getCurrentProfile() {
  const user = await requireUser()
  const reference = profileRef(user.uid)
  const snapshot = await getDoc(reference)
  if (snapshot.exists()) {
    return toProfile(snapshot.data() as ProfileDocument, user)
  }

  const initial: ProfileDocument = {
    user_id: user.uid,
    email: user.email ?? "",
    display_name: user.displayName || user.email?.split("@")[0] || "Aluno Papirar",
    username: defaultUsername(user),
    bio: "",
    avatar_url: user.photoURL,
    profile_color: "#f3f4f6",
  }
  await setDoc(reference, { ...initial, created_at: serverTimestamp(), updated_at: serverTimestamp() })
  return toProfile(initial, user)
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
  await setDoc(
    profileRef(user.uid),
    { user_id: user.uid, email: user.email ?? "", ...normalized, updated_at: serverTimestamp() },
    { merge: true },
  )
  await updateAuthProfile(user, { displayName: normalized.display_name })
  return getCurrentProfile()
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const user = await requireUser()
  const apiUrl = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL || "https://papirar-api.regyfelipe-sd.workers.dev").replace(/\/$/, "")
  const form = new FormData()
  form.append("file", file)
  const response = await fetch(`${apiUrl}/profile/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: form,
  })
  if (!response.ok) throw new Error(`Não foi possível enviar o avatar (${response.status}).`)
  const payload = await response.json() as { url?: string; path?: string }
  if (!payload.url) throw new Error("O serviço de avatar retornou uma resposta inválida.")
  await setDoc(profileRef(user.uid), { avatar_url: payload.url, avatar_path: payload.path ?? null, updated_at: serverTimestamp() }, { merge: true })
  await updateAuthProfile(user, { photoURL: payload.url })
  return getCurrentProfile()
}

export function clearBrowserSession() {
  void signOut(firebaseAuth)
}
