"use client"

import { PublicRouteGuard } from "@/components/auth/public-route-guard"
import { cn } from "@/lib/utils"

export function AuthPageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <PublicRouteGuard>
      <main
        className={cn(
          "relative flex min-h-svh items-center justify-center overflow-hidden",
          "bg-[url('/bg-white.png')] bg-cover bg-center bg-no-repeat",
          "dark:bg-[url('/bg.png')]",
          "p-6 md:p-10",
          className
        )}
      >
        <div className="relative z-10 w-full max-w-sm">
          {children}
        </div>
      </main>
    </PublicRouteGuard>
  )
}
