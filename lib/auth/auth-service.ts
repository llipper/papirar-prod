import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

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
    await signInWithPopup(firebaseAuth, provider)
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function createAccount(name: string, email: string, password: string) {
  try {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
    await updateProfile(credential.user, { displayName: name.trim() })
    await sendEmailVerification(credential.user)
    await firebaseAuth.signOut()
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export async function requestPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(firebaseAuth, email)
    return { error: null }
  } catch (error) {
    return { error }
  }
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
