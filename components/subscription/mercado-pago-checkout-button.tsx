"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { firebaseAuth } from "@/lib/firebase/client"

const apiBase = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev").replace(/\/$/, "")

export function MercadoPagoCheckoutButton({ label = "Assinar por R$ 24,99/mês", className }: { label?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle")
  const [message, setMessage] = useState("")

  async function startCheckout() {
    setState("loading")
    setMessage("")
    try {
      const user = firebaseAuth.currentUser
      if (!user) throw new Error("Sua sessão expirou. Entre novamente para assinar.")
      const token = await user.getIdToken()
      const response = await fetch(`${apiBase}/billing/mercado-pago/checkout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const payload = await response.json().catch(() => null) as { checkoutUrl?: string; error?: string } | null
      if (!response.ok || !payload?.checkoutUrl) throw new Error(payload?.error ?? "Não foi possível iniciar o pagamento agora.")
      window.location.assign(payload.checkoutUrl)
    } catch (error) {
      setState("error")
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento agora.")
    }
  }

  return (
    <div className="grid gap-3">
      <Button className={className ?? "h-12 w-full rounded-full"} onClick={startCheckout} disabled={state === "loading"}>
        {state === "loading" ? "Abrindo pagamento seguro..." : label}
      </Button>
      {state === "error" ? <p className="text-center text-sm text-destructive" role="alert">{message}</p> : null}
    </div>
  )
}
