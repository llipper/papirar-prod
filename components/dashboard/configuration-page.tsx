"use client"

import Link from "next/link"
import { Check, LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { clearBrowserSession } from "@/lib/profile/profile-service"

const themes = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

export function ConfigurationPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleSignOut() {
    setIsSigningOut(true)
    clearBrowserSession()
    router.replace("/login")
  }

  return (
    <DashboardShell title="Configuração" description="Preferências e acesso da sua conta.">
      <div className="mx-auto grid w-full max-w-3xl gap-3">
        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">Aparência</CardTitle>
            <CardDescription className="text-xs">Escolha como o Papirar deve aparecer para você.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-1.5 px-4 sm:grid-cols-3">
            {themes.map(({ value, label, icon: Icon }) => {
              const selected = mounted && theme === value
              return (
                <Button
                  key={value}
                  type="button"
                  variant={selected ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setTheme(value)}
                  className="justify-start"
                  aria-pressed={selected}
                >
                  <Icon />
                  <span>{label}</span>
                  {selected ? <Check className="ml-auto text-primary" /> : null}
                </Button>
              )
            })}
          </CardContent>
        </Card>

        <Card size="sm">
          <CardHeader className="px-4">
            <CardTitle className="text-sm">Conta</CardTitle>
            <CardDescription className="text-xs">Gerencie seus dados pessoais e seu perfil público.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <UserRound className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium">Seu perfil</p>
                  <p className="truncate text-[11px] text-muted-foreground">Nome, avatar, bio e cor do perfil.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="xs">
                <Link href="/dashboard/perfil">Abrir perfil</Link>
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium">Sessão atual</p>
                <p className="text-[11px] text-muted-foreground">Saia deste dispositivo com segurança.</p>
              </div>
              <Button variant="destructive" size="xs" onClick={handleSignOut} disabled={isSigningOut}>
                <LogOut />
                {isSigningOut ? "Saindo..." : "Sair da conta"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
