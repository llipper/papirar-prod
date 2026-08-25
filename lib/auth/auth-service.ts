import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client"

export async function signInWithEmail(email: string, password: string) {
  return getSupabaseBrowserClient().auth.signInWithPassword({ email, password })
}

export async function createAccount(
  name: string,
  email: string,
  password: string
) {
  return getSupabaseBrowserClient().auth.signUp({
    email,
    password,
    options: { data: { name } },
  })
}

export async function requestPasswordReset(email: string) {
  return getSupabaseBrowserClient().auth.resetPasswordForEmail(email)
}

export function authErrorMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message.toLowerCase() : ""
  if (message.includes("invalid login credentials")) {
    return "E-mail ou senha inválidos."
  }
  if (message.includes("user already registered")) {
    return "Não foi possível criar a conta com esses dados."
  }
  return fallback
}
