import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

const apiBase = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev").replace(/\/$/, "")

export async function reauthenticateForDeletion(password: string) {
  const user = firebaseAuth.currentUser
  if (!user) throw new Error("Sua sessão expirou. Entre novamente e tente de novo.")

  const providers = new Set(user.providerData.map((provider) => provider.providerId))
  let reauthenticatedUser: User
  if (providers.has(EmailAuthProvider.PROVIDER_ID)) {
    if (!user.email || !password) throw new Error("Informe sua senha atual para confirmar sua identidade.")
    const credential = EmailAuthProvider.credential(user.email, password)
    reauthenticatedUser = (await reauthenticateWithCredential(user, credential)).user
  } else if (providers.has(GoogleAuthProvider.PROVIDER_ID)) {
    reauthenticatedUser = (await reauthenticateWithPopup(user, new GoogleAuthProvider())).user
  } else {
    throw new Error("Este método de acesso não permite confirmar a identidade aqui. Entre novamente e tente de novo.")
  }

  return reauthenticatedUser
}

export async function eraseAccountData(user: User) {
  const token = await user.getIdToken(true)
  const response = await fetch(`${apiBase}/account`, {
    method: "DELETE",
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  })
  const payload = await response.json().catch(() => null) as { error?: unknown } | null
  if (response.status === 404) {
    throw new Error("A exclusão segura ainda não está ativada neste servidor. Nenhum dado foi removido. Fale com suporte@papirar.com.")
  }
  if (!response.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Não foi possível apagar seus dados. Tente novamente.")
  }
}

export async function removeFirebaseAccount(user: User) {
  await deleteUser(user)
}
