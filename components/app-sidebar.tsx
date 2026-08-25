"use client"

import Link from "next/link"
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
          {sidebarNavigation.footer.map((item) => {
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
      </SidebarFooter>
    </Sidebar>
  )
}
