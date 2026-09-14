"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { sidebarNavigation } from "@/lib/dashboard/sidebar-navigation"
import { ThemeLogo } from "@/components/brand/theme-logo"
import { removeBrowserSession } from "@/lib/auth/browser-session"
import { firebaseAuth } from "@/lib/firebase/client"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = React.useState(false)

  React.useEffect(() => {
    return firebaseAuth.onIdTokenChanged((user) => {
      void user?.getIdTokenResult().then((token) => {
        setIsAdmin(token.claims.admin === true)
      }).catch(() => setIsAdmin(false))
      if (!user) setIsAdmin(false)
    })
  }, [])

  const footerNavigation = sidebarNavigation.footer.filter(
    (item) => !("requiresAdmin" in item && item.requiresAdmin) || isAdmin
  )

  function handleLogout(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault()
    removeBrowserSession()
    router.replace("/login")
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" aria-label="Ir para Home">
                <ThemeLogo size={24} className="size-6 shrink-0" />
                <span className="truncate text-base font-semibold tracking-tight">papirar</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="px-2 py-2">
          {sidebarNavigation.primary.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.href}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          {footerNavigation.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <Link href={item.href} onClick={item.title === "Sair da conta" ? handleLogout : undefined}>
                    <Icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
