"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { hasLiveBrowserSession, removeBrowserSession } from "@/lib/auth/browser-session"

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
    if (hasLiveBrowserSession()) {
      router.replace(redirectTo)
      return
    }
    removeBrowserSession()
    setIsPublic(true)
  }, [redirectTo, router])

  if (!isPublic) return <div className="min-h-screen bg-background" aria-busy="true" />
  return children
}
