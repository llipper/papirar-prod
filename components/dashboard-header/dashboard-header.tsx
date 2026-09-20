"use client"

import Link from "next/link"

import { ThemeLogo } from "@/components/brand/theme-logo"

import { HeaderSearch } from "./header-search"
import { HeaderAccount } from "./header-account"
import { HeaderNotifications } from "./header-notifications"
import { HeaderThemeToggle } from "./header-theme-toggle"

export function DashboardHeader() {
  return (
    <>
      {/* =====================================================
          MOBILE
          Logo à esquerda + notificações + avatar à direita
      ===================================================== */}
      <div className="flex w-full items-center justify-between px-4 xl:hidden">
        <Link
          href="/dashboard"
          aria-label="Ir para Home"
          className="flex items-center gap-2"
        >
          <ThemeLogo
            size={28}
            className="size-7 shrink-0"
          />

          <span className="text-[19px] font-semibold tracking-tight">
            papirar
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <HeaderNotifications />

          <HeaderAccount />
        </div>
      </div>

      {/* =====================================================
          DESKTOP
          Mantém exatamente a estrutura atual
      ===================================================== */}
      <div className="ml-auto hidden items-center gap-2 pr-4 xl:flex">
        <HeaderSearch />
        <HeaderAccount />
        <HeaderNotifications />
        <HeaderThemeToggle />
      </div>
    </>
  )
}