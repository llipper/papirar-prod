"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { waitForBrowserSession } from "@/lib/auth/browser-session"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    let active = true
    void waitForBrowserSession().then((user) => {
      if (!active) return
      if (!user) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`)
        return
      }
      setAuthorized(true)
    })
    return () => {
      active = false
    }
  }, [pathname, router])

  if (!authorized) return <div className="min-h-screen bg-background" aria-busy="true" />
  return children
}
