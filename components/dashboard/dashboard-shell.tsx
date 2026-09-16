import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { DashboardHeader } from "@/components/dashboard-header"

type DashboardShellProps = {
  title: string
  description?: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function DashboardShell({
  title,
  description,
  children,
  action,
}: DashboardShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{title}</p>
              {description ? (
                <p className="truncate text-xs text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {action}
            <DashboardHeader />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-6 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
