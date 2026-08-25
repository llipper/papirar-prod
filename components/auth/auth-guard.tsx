"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

const SESSION_KEY = "papirar.auth.session"

type StoredSession = { access_token?: string }

function hasLiveSession() {
  const raw = window.localStorage.getItem(SESSION_KEY)
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

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!hasLiveSession()) {
      window.localStorage.removeItem(SESSION_KEY)
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    setAuthorized(true)
  }, [pathname, router])

  if (!authorized) return <div className="min-h-screen bg-background" aria-busy="true" />
  return children
}
