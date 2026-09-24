"use client"

import { Bell } from "lucide-react"

export function HeaderNotifications() {
  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Notificações"
        aria-describedby="notification-preview"
        className="inline-flex size-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none cursor-pointer"
      >
        0
      </button>

      <div
        id="notification-preview"
        role="status"
        className="pointer-events-none invisible absolute top-11 right-0 z-50 flex w-72 translate-y-1 items-center gap-3 rounded-2xl bg-popover p-3.5 opacity-0 shadow-lg ring-1 ring-border/50 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
      >
        <div
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <Bell className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">
            Notificações
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            Nenhuma notificação no momento
          </p>
        </div>
      </div>
    </div>
  )
}
