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
      <section>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Configuração</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ajuste o Papirar para o seu jeito de estudar.</p>
      </section>

      <div className="grid max-w-4xl gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Aparência</CardTitle>
            <CardDescription>Escolha como o Papirar deve aparecer para você.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            {themes.map(({ value, label, icon: Icon }) => {
              const selected = mounted && theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className="flex items-center justify-between rounded-xl border bg-background p-3 text-left transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  aria-pressed={selected}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Icon className="size-4" />
                    {label}
                  </span>
                  {selected ? <Check className="size-4 text-primary" /> : null}
                </button>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conta</CardTitle>
            <CardDescription>Gerencie seus dados pessoais e seu perfil público.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                  <UserRound className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Seu perfil</p>
                  <p className="text-xs text-muted-foreground">Nome, avatar, bio e cor do perfil.</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/perfil">Abrir perfil</Link>
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Sessão atual</p>
                <p className="text-xs text-muted-foreground">Saia deste dispositivo com segurança.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={handleSignOut} disabled={isSigningOut}>
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
