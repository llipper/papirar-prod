export const AUTH_SESSION_STORAGE_KEY = "papirar.auth.session"

type StoredSession = { access_token?: string }

export function hasLiveBrowserSession() {
  if (typeof window === "undefined") return false
  const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
  if (!raw) return false

  try {
    const token = (JSON.parse(raw) as StoredSession).access_token
    if (!token) return false
    const payload = token.split(".")[1]
    if (!payload) return false
    const decoded = JSON.parse(
      window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number }
    return typeof decoded.exp !== "number" || decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export function removeBrowserSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
  }
}
