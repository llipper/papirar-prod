"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { waitForBrowserSession } from "@/lib/auth/browser-session"

export function PublicRouteGuard({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode
  redirectTo?: string
}) {
  const router = useRouter()
  const [isPublic, setIsPublic] = useState(false)

  useEffect(() => {
    let active = true
    void waitForBrowserSession().then((user) => {
      if (!active) return
      if (user) {
        router.replace(redirectTo)
        return
      }
      setIsPublic(true)
    })
    return () => {
      active = false
    }
  }, [redirectTo, router])

  if (!isPublic) return <div className="min-h-screen bg-background" aria-busy="true" />
  return children
}
