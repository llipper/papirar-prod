"use client"

import Link from "next/link"
import { CalendarClock, CheckCircle2, CreditCard, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { cancelMercadoPagoSubscription, getSubscriptionOverview, type SubscriptionOverview } from "@/lib/subscription/subscription-service"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date)
}

export function SubscriptionManagementCard({ compact = false }: { compact?: boolean }) {
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string>()

  const load = useCallback(async () => {
    setLoading(true)
    setError(undefined)
    try {
      setSubscription(await getSubscriptionOverview())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar sua assinatura.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function cancelRenewal() {
    setCancelling(true)
    setError(undefined)
    try {
      setSubscription(await cancelMercadoPagoSubscription())
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Não foi possível cancelar a renovação.")
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return <Card><CardContent className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Carregando assinatura…</CardContent></Card>
  }

  const isPremium = subscription?.isPremium === true
  const renewalDate = dateLabel(subscription?.expiresAt ?? null)
  const cancelled = subscription?.cancelAtPeriodEnd === true

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Assinatura</CardTitle>
            <CardDescription className="mt-1">Seu acesso e cobranças do Papirar Premium.</CardDescription>
          </div>
          <Badge variant={isPremium ? "default" : "secondary"}>{isPremium ? "Premium" : "Plano grátis"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {isPremium ? (
          <>
            <div className="flex gap-3 rounded-2xl bg-muted/50 p-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <p className="text-sm">Áudios completos, explicações e recursos Premium estão liberados para sua conta.</p>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarClock className="size-4" />{cancelled ? (renewalDate ? `Cancelada: o acesso permanece até ${renewalDate}.` : "Renovação cancelada.") : (renewalDate ? `Renovação automática em ${renewalDate}.` : "Renovação automática mensal.")}</p>
          </>
        ) : (
          <div className="flex gap-3 rounded-2xl bg-muted/50 p-3">
            <CreditCard className="mt-0.5 size-5 shrink-0" />
            <p className="text-sm">Assine o Premium por R$ 24,99/mês para liberar os áudios e recursos completos.</p>
          </div>
        )}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {!isPremium || cancelled ? <Button asChild><Link href="/assinar">{cancelled ? "Assinar novamente" : "Conhecer Premium"}</Link></Button> : null}
        {isPremium && subscription?.provider === "mercado_pago" && !cancelled ? (
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline">Cancelar renovação</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar a renovação?</AlertDialogTitle>
                <AlertDialogDescription>{renewalDate ? `Você continua com acesso Premium até ${renewalDate}. Depois disso, não haverá nova cobrança.` : "A assinatura não será renovada novamente."}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel>
                <AlertDialogAction variant="destructive" disabled={cancelling} onClick={cancelRenewal}>{cancelling ? "Cancelando…" : "Cancelar renovação"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        {isPremium && subscription?.provider === "google_play" ? <Button variant="outline" asChild><a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noreferrer">Gerenciar no Google Play <ExternalLink /></a></Button> : null}
        {!compact ? <p className="flex basis-full items-center gap-2 pt-1 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" />O status é confirmado pelo servidor de pagamento.</p> : null}
      </CardFooter>
    </Card>
  )
}
