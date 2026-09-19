import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

const authEmailApiUrl = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev").replace(/\/$/, "")

export async function signInWithEmail(email: string, password: string) {
  try {
    await signInWithEmailAndPassword(firebaseAuth, email, password)
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: "select_account" })
    const credential = await signInWithPopup(firebaseAuth, provider)
    // The Worker enforces one welcome e-mail per account. Calling it here also
    // welcomes accounts created before this feature was deployed.
    void requestAuthEmail("/auth/welcome", await credential.user.getIdToken()).catch((error) => {
      console.warn("[Papirar][Auth] welcome e-mail was not sent", error)
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function createAccount(name: string, email: string, password: string) {
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await updateProfile(credential.user, { displayName: name.trim() })
    // A conta recém-criada deve permanecer autenticada para que o próximo
    // redirecionamento para o dashboard não encontre uma sessão vazia.
    // Falha no serviço de e-mail não desfaz um cadastro já concluído no Firebase.
    void requestAuthEmail("/auth/email-verification", await credential.user.getIdToken()).catch((error) => {
      console.warn("[Papirar][Auth] verification e-mail was not sent", error)
    })
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await requestAuthEmail("/auth/password-reset", undefined, { email })
    return { error: null }
  } catch (error) {
    return { error }
  }
}

async function requestAuthEmail(path: string, token?: string, body?: Record<string, string>) {
  const response = await fetch(`${authEmailApiUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new Error("Não foi possível enviar o e-mail agora.")
}

export function authErrorMessage(error: unknown, fallback: string) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : ""

  if (["auth/invalid-credential", "auth/invalid-email", "auth/wrong-password", "auth/user-not-found"].includes(code)) {
    return "E-mail ou senha inválidos."
  }
  if (code === "auth/email-already-in-use") {
    return "Não foi possível criar a conta com esses dados."
  }
  if (code === "auth/popup-closed-by-user") {
    return "A entrada com Google foi cancelada."
  }
  return fallback
}
