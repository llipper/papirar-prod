"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, LoaderCircle } from "lucide-react"

import { MercadoPagoCheckoutButton } from "@/components/subscription/mercado-pago-checkout-button"
import { Button } from "@/components/ui/button"
import { getSubscriptionOverview, redeemPremiumTrial, type SubscriptionOverview } from "@/lib/subscription/subscription-service"
import { useAuthUser } from "@/lib/auth/use-auth-user"
import { firebaseAuth } from "@/lib/firebase/client"

export function AssinarTrialAction() {
  const authUser = useAuthUser()
  const authUid = authUser?.uid ?? null
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null)
  const [loadedUid, setLoadedUid] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string>()
  const [redeeming, setRedeeming] = useState(false)
  const [redeemError, setRedeemError] = useState<string>()
  const [reload, setReload] = useState(0)

  useEffect(() => {
    const requestUid = firebaseAuth.currentUser?.uid
    if (!requestUid) return

    getSubscriptionOverview()
      .then((result) => {
        if (firebaseAuth.currentUser?.uid !== requestUid) return
        setSubscription(result)
        setLoadedUid(requestUid)
        setLoadError(undefined)
      })
      .catch((error: unknown) => {
        if (firebaseAuth.currentUser?.uid !== requestUid) return
        setLoadedUid(requestUid)
        setLoadError(error instanceof Error ? error.message : "Não foi possível verificar sua elegibilidade agora.")
      })
  }, [authUid, reload])

  async function startTrial() {
    setRedeeming(true)
    setRedeemError(undefined)
    try {
      const result = await redeemPremiumTrial()
      setSubscription(result)
    } catch (error) {
      setRedeemError(error instanceof Error ? error.message : "Não foi possível ativar o teste grátis agora.")
      setReload((value) => value + 1)
    } finally {
      setRedeeming(false)
    }
  }

  if (!authUid || loadedUid !== authUid) {
    return <div className="flex min-h-12 items-center justify-center gap-2 text-sm text-neutral-500"><LoaderCircle className="size-4 animate-spin" />Verificando sua conta…</div>
  }

  if (loadError) {
    return <div className="grid gap-3 text-center"><p className="text-sm text-red-700" role="alert">{loadError}</p><Button type="button" variant="outline" onClick={() => setReload((value) => value + 1)}>Tentar novamente</Button></div>
  }

  if (subscription?.isPremium) {
    return <div className="grid gap-3 text-center"><p className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-800"><CheckCircle2 className="size-4" />{subscription.isTrial ? "Seu teste grátis já está ativo." : "O Premium já está ativo na sua conta."}</p><Button asChild><Link href="/dashboard">Ir para o Papirar</Link></Button></div>
  }

  if (subscription?.canRedeemTrial) {
    return <div className="grid gap-3"><Button type="button" onClick={startTrial} disabled={redeeming} className="h-12 rounded-full">{redeeming ? "Ativando teste grátis…" : "Ativar 3 dias grátis sem cartão"}</Button><p className="text-center text-xs text-neutral-500">Sem cartão e sem cobrança automática. Ao fim dos 3 dias, sua conta volta ao plano grátis, a menos que você escolha assinar.</p>{redeemError ? <p className="text-center text-sm text-red-700" role="alert">{redeemError}</p> : null}</div>
  }

  return <div className="grid gap-3"><MercadoPagoCheckoutButton label="Assinar por R$ 24,99/mês" /><p className="text-center text-xs text-neutral-500">O período grátis já foi usado ou não está disponível para esta conta. A cobrança recorrente começa ao confirmar a assinatura no Mercado Pago.</p></div>
}
