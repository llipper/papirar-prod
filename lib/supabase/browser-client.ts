type AuthResponse = {
  access_token?: string
  refresh_token?: string
  user?: unknown
  error?: string
  error_description?: string
  msg?: string
}

class SupabaseBrowserError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SupabaseBrowserError"
  }
}

function getConfig() {
  const { url, publicKey } = getSupabasePublicConfig()
  return { url, anonKey: publicKey }
}

async function authRequest(path: string, body: Record<string, unknown>) {
  const { url, anonKey } = getConfig()
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => ({}))) as AuthResponse
  if (!response.ok) {
    throw new SupabaseBrowserError(
      payload.error_description ??
        payload.msg ??
        payload.error ??
        "Autenticação indisponível."
    )
  }
  if (payload.access_token && typeof window !== "undefined") {
    window.localStorage.setItem(
      "papirar.auth.session",
      JSON.stringify({
        access_token: payload.access_token,
        refresh_token: payload.refresh_token,
        user: payload.user,
      })
    )
  }
  return payload
}

export function getSupabaseBrowserClient() {
  return {
    auth: {
      signInWithPassword: (credentials: { email: string; password: string }) =>
        authRequest("token?grant_type=password", credentials),
      signUp: (request: {
        email: string
        password: string
        options?: { data?: Record<string, unknown> }
      }) =>
        authRequest("signup", {
          email: request.email,
          password: request.password,
          data: request.options?.data,
        }),
      resetPasswordForEmail: (email: string) =>
        authRequest("recover", { email }),
    },
  }
}
import { getSupabasePublicConfig } from "@/lib/supabase/public-config"
