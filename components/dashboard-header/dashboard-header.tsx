"use client"

import Link from "next/link"

import { ThemeLogo } from "@/components/brand/theme-logo"

import { HeaderSearch } from "./header-search"
import { HeaderAccount } from "./header-account"
import { HeaderNotifications } from "./header-notifications"
import { HeaderThemeToggle } from "./header-theme-toggle"

export function DashboardHeader() {
  return (
    <div className="flex w-full items-center px-4 xl:w-auto xl:px-0">
      <div className="flex items-center xl:hidden">
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

      </div>

      <div className="ml-auto flex items-center gap-2 xl:pr-4">
        <div className="order-1 hidden xl:block"><HeaderSearch /></div>
        <div className="order-2 xl:order-3"><HeaderNotifications /></div>
        <div className="order-3 xl:order-2"><HeaderAccount /></div>
        <div className="order-4 hidden xl:block"><HeaderThemeToggle /></div>
      </div>
    </div>
  )
}
