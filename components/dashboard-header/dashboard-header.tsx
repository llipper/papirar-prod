"use client"

import { HeaderSearch } from "./header-search"
import { HeaderAccount } from "./header-account"
import { HeaderNotifications } from "./header-notifications"

export function DashboardHeader() {
  return (
    <div className="ml-auto flex items-center gap-2 pr-2 sm:pr-4">
      {/* 1. Busca rápida */}
      <HeaderSearch />

      {/* 2. Conta do usuário */}
      <HeaderAccount />

      {/* 3. Notificações */}
      <HeaderNotifications />
    </div>
  )
}
