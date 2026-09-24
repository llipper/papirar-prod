"use client"

import { CalendarClock, Check, CheckCircle2, Crown, CreditCard, ExternalLink, Headphones, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"

import { MercadoPagoCheckoutButton } from "@/components/subscription/mercado-pago-checkout-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cancelMercadoPagoSubscription, getSubscriptionOverview, redeemPremiumTrial, type SubscriptionOverview } from "@/lib/subscription/subscription-service"
import { firebaseAuth } from "@/lib/firebase/client"
import { useAuthUser } from "@/lib/auth/use-auth-user"

const benefits = [
  { icon: Headphones, title: "Áudios das leis", description: "Estude ouvindo explicações claras, onde estiver." },
  { icon: Sparkles, title: "Mais foco", description: "Uma experiência feita para sua evolução." },
] as const

const comparison = [
  ["Acesso aos conteúdos básicos", true, true],
  ["Áudios explicativos das leis", false, true],
  ["Controles de áudio", false, true],
] as const

function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(date)
}

export function SubscriptionManagementCard({ compact = false }: { compact?: boolean }) {
  const authUser = useAuthUser()
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null)
  const [loadedUid, setLoadedUid] = useState<string | null>(null)
  const [requestLoading, setRequestLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [subscriptionError, setSubscriptionError] = useState<string>()
  const authUid = authUser?.uid ?? null

  const loading = authUid !== null && (loadedUid !== authUid || requestLoading)
  const currentSubscription = loadedUid === authUid ? subscription : null
  const error = loadedUid === authUid ? subscriptionError : undefined

  useEffect(() => {
    const requestUid = firebaseAuth.currentUser?.uid
    if (!requestUid) return

    getSubscriptionOverview()
      .then((nextSubscription) => {
        if (firebaseAuth.currentUser?.uid !== requestUid) return
        setSubscription(nextSubscription)
        setSubscriptionError(undefined)
        setLoadedUid(requestUid)
      })
      .catch((reason: unknown) => {
        if (firebaseAuth.currentUser?.uid !== requestUid) return
        setSubscriptionError(reason instanceof Error ? reason.message : "Não foi possível carregar sua assinatura.")
        setLoadedUid(requestUid)
      })
      .finally(() => {
        if (firebaseAuth.currentUser?.uid === requestUid) setRequestLoading(false)
      })
  }, [authUser?.uid])

  async function cancelRenewal() {
    setCancelling(true)
    setSubscriptionError(undefined)
    try { setSubscription(await cancelMercadoPagoSubscription()) } catch (reason) { setSubscriptionError(reason instanceof Error ? reason.message : "Não foi possível cancelar a renovação.") } finally { setCancelling(false) }
  }

  async function redeemTrial() {
    setRedeeming(true)
    setSubscriptionError(undefined)
    try { setSubscription(await redeemPremiumTrial()) } catch (reason) { setSubscriptionError(reason instanceof Error ? reason.message : "Não foi possível resgatar o teste grátis.") } finally { setRedeeming(false) }
  }

  if (loading) return <Card><CardContent className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Carregando assinatura…</CardContent></Card>

  const isPremium = currentSubscription?.isPremium === true
  const isTrial = currentSubscription?.isTrial === true
  const canRedeemTrial = currentSubscription?.canRedeemTrial === true
  const cancelled = currentSubscription?.cancelAtPeriodEnd === true
  const renewalDate = dateLabel(currentSubscription?.expiresAt ?? null)

  if (compact) return <CompactPlanCard isPremium={isPremium} isTrial={isTrial} cancelled={cancelled} renewalDate={renewalDate} />

  return (
    <div className="grid w-full gap-4">
        <CardContent className="relative min-h-80 p-7 sm:p-9">
          <div className="relative z-10 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-bold tracking-[.24em] text-muted-foreground">ESTUDE COM MAIS POSSIBILIDADES</p>
              <Badge variant={isPremium ? "default" : "secondary"} className="rounded-full">
                {isPremium ? (isTrial ? "Teste grátis ativo (3 dias)" : "Premium ativo") : "Plano grátis"}
              </Badge>
            </div>
            <h1 className="mt-4 font-heading text-3xl font-black tracking-tight sm:text-5xl">
              {isPremium
                ? isTrial
                  ? "Seu teste grátis de 3 dias está ativo"
                  : "Seu Papirar Premium está ativo"
                : "Desbloqueie o Papirar Premium"}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              {isPremium
                ? isTrial
                  ? "Todos os áudios das leis e recursos completos estão liberados para o seu período de teste."
                  : "Você tem acesso aos recursos completos para estudar leis com mais clareza e consistência."
                : "Acesse áudios das leis, recursos completos e uma experiência avançada de estudo, feita para quem leva a preparação a sério."}
            </p>
            {!isPremium ? (
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2">
                <p className="font-heading text-3xl font-black">
                  R$ 24,99<span className="text-xl">/mês</span>
                </p>
                <p className="border-l pl-5 text-sm text-muted-foreground">
                  {canRedeemTrial ? <>3 dias grátis, sem cartão.<br />Sem cobrança automática.</> : "Assinatura mensal de R$ 24,99."}
                </p>
              </div>
            ) : (
              <p className="mt-7 flex items-center gap-2 text-sm font-medium">
                <CalendarClock className="size-4 text-[#b68829]" />
                {isTrial
                  ? renewalDate
                    ? `Período de teste liberado até ${renewalDate}.`
                    : "Período de teste de 3 dias ativo."
                  : currentSubscription?.provider
                  ? cancelled
                    ? renewalDate
                      ? `Acesso ativo até ${renewalDate}.`
                      : "Renovação cancelada."
                    : renewalDate
                      ? `Próxima renovação em ${renewalDate}.`
                      : "Renovação automática mensal."
                  : "Premium ativo."}
              </p>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              {canRedeemTrial ? (
                <Button onClick={redeemTrial} disabled={redeeming} className="h-12 rounded-full bg-[#b68829] px-6 text-base text-white hover:bg-[#95701f]">
                  {redeeming ? "Resgatando teste..." : "Resgatar 3 dias grátis"}
                </Button>
              ) : !isPremium || isTrial || cancelled ? (
                <MercadoPagoCheckoutButton
                  label={
                    isTrial
                      ? "Assinar Premium definitivo"
                      : cancelled
                        ? "Assinar novamente"
                        : "Assinar por R$ 24,99/mês"
                  }
                  className="h-12 rounded-full bg-[#b68829] px-6 text-base text-white hover:bg-[#95701f]"
                />
              ) : (
                <ManageActions
                  provider={currentSubscription?.provider}
                  cancelled={cancelled}
                  cancelling={cancelling}
                  onCancel={cancelRenewal}
                  renewalDate={renewalDate}
                />
              )}
            </div>
          </div>
        </CardContent>

      <Card className="border-0 shadow-none"><CardContent className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, description }) => <div key={title} className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f7f0e3] text-[#87631c] dark:bg-muted dark:text-foreground"><Icon className="size-5" /></div><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div>)}</CardContent></Card>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)]">
        <Card className="shadow-none"><CardHeader><CardTitle>Compare os planos</CardTitle><CardDescription>Veja o que muda ao estudar com o Papirar Premium.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-xl border"><table className="w-full text-left text-xs sm:text-sm"><thead className="bg-muted/60"><tr><th className="p-3 font-semibold">Recursos</th><th className="p-3 text-center font-semibold">Grátis</th><th className="p-3 text-center font-semibold text-[#87631c]">Premium</th></tr></thead><tbody>{comparison.map(([label, free, premium]) => <tr key={label} className="border-t"><td className="p-3 text-muted-foreground">{label}</td><td className="p-3 text-center">{free ? <Check className="mx-auto size-4 text-muted-foreground" /> : "—"}</td><td className="p-3 text-center">{premium ? <CheckCircle2 className="mx-auto size-4 text-[#b68829]" /> : "—"}</td></tr>)}</tbody></table></div></CardContent></Card>
        <PlanStatusCard isPremium={isPremium} isTrial={isTrial} cancelled={cancelled} renewalDate={renewalDate} provider={currentSubscription?.provider} cancelling={cancelling} onCancel={cancelRenewal} />
      </section>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}

function CompactPlanCard({ isPremium, isTrial, cancelled, renewalDate }: { isPremium: boolean; isTrial: boolean; cancelled: boolean; renewalDate: string | null }) {
  return <Card className="overflow-hidden"><CardContent className="flex flex-wrap items-center gap-4 p-5"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f0e3] text-[#87631c] dark:bg-muted dark:text-foreground"><Crown className="size-6" /></div><div className="min-w-0 flex-1"><p className="font-heading text-base font-black">{isPremium ? "Papirar Premium" : "Plano grátis"}</p><p className="mt-1 text-sm text-muted-foreground">{isPremium ? (isTrial ? (renewalDate ? `Teste até ${renewalDate}.` : "Teste grátis ativo.") : cancelled ? (renewalDate ? `Acesso até ${renewalDate}.` : "Renovação cancelada.") : "Recursos completos liberados.") : "Assine para liberar áudios e recursos completos."}</p></div><Button asChild variant="outline" size="sm"><a href="/dashboard/assinatura">Gerenciar</a></Button></CardContent></Card>
}

function ManageActions({ provider, cancelled, cancelling, onCancel, renewalDate }: { provider?: SubscriptionOverview["provider"]; cancelled: boolean; cancelling: boolean; onCancel: () => Promise<void>; renewalDate: string | null }) {
  if (provider === "google_play") return <Button variant="outline" asChild className="h-12 rounded-full"><a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noreferrer">Gerenciar no Google Play <ExternalLink /></a></Button>
  if (provider !== "mercado_pago" || cancelled) return null
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="h-12 rounded-full">Cancelar renovação</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancelar a renovação?</AlertDialogTitle><AlertDialogDescription>{renewalDate ? `Você continua com acesso Premium até ${renewalDate}. Depois disso, não haverá nova cobrança.` : "A assinatura não será renovada novamente."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={cancelling} onClick={onCancel}>{cancelling ? "Cancelando…" : "Cancelar renovação"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function PlanStatusCard({ isPremium, isTrial, cancelled, renewalDate, provider, cancelling, onCancel }: { isPremium: boolean; isTrial: boolean; cancelled: boolean; renewalDate: string | null; provider?: SubscriptionOverview["provider"]; cancelling: boolean; onCancel: () => Promise<void> }) {
  return <div className="grid content-start gap-4"><Card className="shadow-none"><CardHeader><CardTitle className="text-base">Seu plano atual</CardTitle></CardHeader><CardContent className="grid gap-4"><StatusRow icon={Crown} label="Status atual" value={isPremium ? "Papirar Premium" : "Plano grátis"} /><StatusRow icon={CreditCard} label="Cobrança" value={isPremium ? (isTrial ? "Teste grátis — sem cobrança" : cancelled ? "Renovação cancelada" : "Renovação mensal ativa") : "Nenhuma cobrança ativa"} />{isPremium ? <StatusRow icon={CalendarClock} label={isTrial ? "Teste termina" : "Próximo ciclo"} value={renewalDate ?? "Confirmado pelo provedor"} /> : null}</CardContent><CardFooter><ManageActions provider={provider} cancelled={cancelled} cancelling={cancelling} onCancel={onCancel} renewalDate={renewalDate} /></CardFooter></Card><Card className="border-emerald-200 bg-emerald-50/60 shadow-none dark:border-emerald-900 dark:bg-emerald-950/20"><CardContent className="flex gap-3 p-4"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900"><LockKeyhole className="size-4" /></div><div><p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Pagamento seguro</p><p className="mt-1 text-xs leading-5 text-emerald-900/75 dark:text-emerald-100/70">Seu status é confirmado em tempo real pelo servidor de pagamento.</p></div></CardContent></Card></div>
}

function StatusRow({ icon: Icon, label, value }: { icon: typeof Crown; label: string; value: string }) {
  return <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-muted"><Icon className="size-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></div>
}
