"use client"

import { useEffect, useState } from "react"
import { LockKeyhole, ShieldAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { currentFirebaseUserIsAdmin } from "@/lib/admin/legal-catalog-admin-service"

export function AdministrationReadingPage() {
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

  if (isAdmin === null) {
    return <div className="p-8 text-sm text-muted-foreground" aria-busy="true">Validando permissão…</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Alert className="max-w-xl" variant={isAdmin ? "default" : "destructive"}>
        {isAdmin ? <LockKeyhole /> : <ShieldAlert />}
        <AlertTitle>{isAdmin ? "Administração temporariamente indisponível" : "Acesso restrito"}</AlertTitle>
        <AlertDescription>
          {isAdmin
            ? "A edição do catálogo está pausada durante a migração para o Cloudflare. Ela só será reativada quando o Worker validar a autorização no servidor para cada operação."
            : "Esta área exige uma conta autorizada como administradora. A permissão para operações administrativas deve ser validada no servidor."}
        </AlertDescription>
      </Alert>
    </div>
  )
}
