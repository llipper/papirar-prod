"use client"

import Link from "next/link"
import { AlertTriangle, Check, LogOut, Monitor, Moon, Sun, Trash2, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useSyncExternalStore } from "react"
import { useTheme } from "next-themes"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { clearBrowserSession } from "@/lib/profile/profile-service"
import { eraseAccountData, reauthenticateForDeletion, removeFirebaseAccount } from "@/lib/auth/account-deletion-service"
import { firebaseAuth } from "@/lib/firebase/client"
import { Input } from "@/components/ui/input"

const themes = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

const subscribeToHydration = () => () => {}
const getHydratedSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function ConfigurationPage() {
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot
  )
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const currentUser = firebaseAuth.currentUser
  const requiresPassword = Boolean(currentUser?.providerData.some((provider) => provider.providerId === "password"))

  function handleSignOut() {
    setIsSigningOut(true)
    clearBrowserSession()
    router.replace("/login")
  }

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (deleteConfirmation !== "EXCLUIR") {
      setDeleteError('Digite "EXCLUIR" para confirmar a exclusão permanente.')
      return
    }
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const user = await reauthenticateForDeletion(deletePassword)
      await eraseAccountData(user)
      try {
        await removeFirebaseAccount(user)
      } catch {
        throw new Error("Os dados do Papirar foram removidos, mas o provedor ainda não confirmou a exclusão do acesso. Entre novamente e repita a exclusão ou fale com suporte@papirar.com.")
      }
      clearBrowserSession()
      router.replace("/")
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Não foi possível excluir a conta. Tente novamente.")
    } finally {
      setIsDeleting(false)
    }
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

        <Card size="sm" className="border-destructive/30">
          <CardHeader className="px-4">
            <CardTitle className="flex items-center gap-2 text-sm text-destructive"><AlertTriangle className="size-4" />Excluir conta</CardTitle>
            <CardDescription className="text-xs">A exclusão é permanente. Seus dados de perfil, marcações, anotações, progresso e avatar serão removidos.</CardDescription>
          </CardHeader>
          <CardContent className="px-4">
            <form onSubmit={handleDeleteAccount} className="grid gap-3">
              <p className="text-xs text-muted-foreground">Antes de continuar, cancele a assinatura e aguarde o fim do período ativo em <Link href="/dashboard/assinatura" className="font-medium text-foreground underline underline-offset-4">Assinatura</Link>. Cobranças e pagamentos também podem permanecer nos registros do provedor.</p>
              {requiresPassword ? (
                <label className="grid gap-1.5 text-xs font-medium">
                  Senha atual
                  <Input type="password" autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} required disabled={isDeleting} />
                </label>
              ) : (
                <p className="text-xs text-muted-foreground">A confirmação de identidade será solicitada pelo Google.</p>
              )}
              <label className="grid gap-1.5 text-xs font-medium">
                Para confirmar, digite EXCLUIR
                <Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" required disabled={isDeleting} />
              </label>
              {deleteError ? <p role="alert" className="text-xs text-destructive">{deleteError}</p> : null}
              <div>
                <Button type="submit" variant="destructive" size="sm" disabled={isDeleting || deleteConfirmation !== "EXCLUIR" || (requiresPassword && !deletePassword)}>
                  <Trash2 />
                  {isDeleting ? "Excluindo conta..." : "Reautenticar e excluir conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
