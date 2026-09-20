import type { Metadata } from "next"

import { AuthGuard } from "@/components/auth/auth-guard"
import { MobileBottomNavigation } from "@/components/mobile-bottom-navigation"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-svh pb-16 xl:pb-0">
        {children}
      </div>

      <MobileBottomNavigation />
    </AuthGuard>
  )
}