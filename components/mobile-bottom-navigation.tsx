"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { sidebarNavigation } from "@/lib/dashboard/sidebar-navigation"

export function MobileBottomNavigation() {
  const pathname = usePathname()

  // A leitura tem controles próprios e precisa ocupar toda a altura útil da tela.
  if (pathname.startsWith("/dashboard/biblioteca/")) {
    return null
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="
        fixed
        inset-x-0
        bottom-0
        z-50
        border-t
        border-border/70
        bg-background/95
        backdrop-blur-xl
        xl:hidden
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          max-w-md
          items-center
          justify-around
          px-2
          pb-[env(safe-area-inset-bottom)]
        "
      >
        {sidebarNavigation.primary.map((item) => {
          const Icon = item.icon

          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                `
                  flex
                  min-w-0
                  flex-1
                  flex-col
                  items-center
                  justify-center
                  gap-1
                  text-muted-foreground
                  transition-colors
                `,
                isActive && "text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-[21px] stroke-[1.8]",
                  isActive && "stroke-[2.3]"
                )}
              />

              <span
                className={cn(
                  "text-[11px] leading-none",
                  isActive && "font-semibold"
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
