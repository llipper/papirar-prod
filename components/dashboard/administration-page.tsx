"use client"

import { useEffect, useState } from "react"
import { LockKeyhole, ShieldAlert } from "lucide-react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { currentFirebaseUserIsAdmin } from "@/lib/admin/legal-catalog-admin-service"

export function AdministrationPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    void currentFirebaseUserIsAdmin()
      .then((authorized) => {
        if (active) setIsAdmin(authorized)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <DashboardShell title="Administração" description="Gestão do catálogo jurídico.">
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="p-6">
          {isAdmin === null ? (
            <p className="text-sm text-muted-foreground" aria-busy="true">Validando permissão…</p>
          ) : isAdmin ? (
            <Alert>
              <LockKeyhole />
              <AlertTitle>Administração temporariamente indisponível</AlertTitle>
              <AlertDescription>
                O catálogo está em migração para o Cloudflare. A edição só será reativada quando houver um endpoint do Worker que valide a autorização no servidor para cada operação.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertTitle>Acesso restrito</AlertTitle>
              <AlertDescription>
                Esta área exige uma conta autorizada como administradora. A permissão para operações administrativas deve ser validada no servidor.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
