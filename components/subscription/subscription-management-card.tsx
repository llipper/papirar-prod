"use client"

import { CalendarClock, Check, CheckCircle2, Crown, CreditCard, ExternalLink, Headphones, Layers3, LoaderCircle, LockKeyhole, Sparkles, Zap } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

import { MercadoPagoCheckoutButton } from "@/components/subscription/mercado-pago-checkout-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cancelMercadoPagoSubscription, getSubscriptionOverview, type SubscriptionOverview } from "@/lib/subscription/subscription-service"

const benefits = [
  { icon: Headphones, title: "Áudios das leis", description: "Estude ouvindo explicações claras, onde estiver." },
  { icon: Layers3, title: "Recursos completos", description: "Mais ferramentas para revisar e avançar." },
  { icon: Zap, title: "Acesso prioritário", description: "Receba primeiro as novidades do Papirar." },
  { icon: Sparkles, title: "Mais foco", description: "Uma experiência feita para sua evolução." },
] as const

const comparison = [
  ["Acesso aos conteúdos básicos", true, true],
  ["Áudios explicativos das leis", false, true],
  ["Recursos completos de estudo", false, true],
  ["Leitura offline e controles de áudio", false, true],
  ["Comparação de atualizações legais", false, true],
  ["Novidades e suporte prioritários", false, true],
] as const

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
    try { setSubscription(await getSubscriptionOverview()) } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar sua assinatura.") } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function cancelRenewal() {
    setCancelling(true)
    setError(undefined)
    try { setSubscription(await cancelMercadoPagoSubscription()) } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível cancelar a renovação.") } finally { setCancelling(false) }
  }

  if (loading) return <Card><CardContent className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" />Carregando assinatura…</CardContent></Card>

  const isPremium = subscription?.isPremium === true
  const cancelled = subscription?.cancelAtPeriodEnd === true
  const renewalDate = dateLabel(subscription?.expiresAt ?? null)

  if (compact) return <CompactPlanCard isPremium={isPremium} cancelled={cancelled} renewalDate={renewalDate} />

  return (
    <div className="grid w-full gap-4">
      <Card className="relative overflow-hidden border-0 bg-[radial-gradient(circle_at_82%_18%,rgba(199,154,55,.25),transparent_28%),linear-gradient(115deg,#fffdf9_0%,#f7f0e3_100%)] shadow-none dark:bg-card">
        <CardContent className="relative min-h-80 p-7 sm:p-9">
          <div className="relative z-10 max-w-2xl"><div className="flex flex-wrap items-center gap-3"><p className="text-xs font-bold tracking-[.24em] text-muted-foreground">ESTUDE COM MAIS POSSIBILIDADES</p><Badge variant={isPremium ? "default" : "secondary"} className="rounded-full">{isPremium ? "Premium ativo" : "Plano grátis"}</Badge></div><h1 className="mt-4 font-heading text-3xl font-black tracking-tight sm:text-5xl">{isPremium ? "Seu Papirar Premium está ativo" : "Desbloqueie o Papirar Premium"}</h1><p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">{isPremium ? "Você tem acesso aos recursos completos para estudar leis com mais clareza e consistência." : "Acesse áudios das leis, recursos completos e uma experiência avançada de estudo, feita para quem leva a preparação a sério."}</p>{!isPremium ? <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"><p className="font-heading text-3xl font-black">R$ 24,99<span className="text-xl">/mês</span></p><p className="border-l pl-5 text-sm text-muted-foreground">Cancele quando quiser.<br />Sem fidelidade.</p></div> : <p className="mt-7 flex items-center gap-2 text-sm font-medium"><CalendarClock className="size-4" />{cancelled ? (renewalDate ? `Acesso ativo até ${renewalDate}.` : "Renovação cancelada.") : (renewalDate ? `Próxima renovação em ${renewalDate}.` : "Renovação automática mensal.")}</p>}<div className="mt-7 flex flex-wrap gap-3">{!isPremium || cancelled ? <MercadoPagoCheckoutButton label={cancelled ? "Assinar novamente" : "Assinar Premium"} className="h-12 rounded-full bg-[#b68829] px-6 text-base text-white hover:bg-[#95701f]" /> : <ManageActions provider={subscription?.provider} cancelled={cancelled} cancelling={cancelling} onCancel={cancelRenewal} renewalDate={renewalDate} />}</div></div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-none"><CardContent className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">{benefits.map(({ icon: Icon, title, description }) => <div key={title} className="flex gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f7f0e3] text-[#87631c] dark:bg-muted dark:text-foreground"><Icon className="size-5" /></div><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div>)}</CardContent></Card>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,.8fr)]">
        <Card className="shadow-none"><CardHeader><CardTitle>Compare os planos</CardTitle><CardDescription>Veja o que muda ao estudar com o Papirar Premium.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-xl border"><table className="w-full text-left text-xs sm:text-sm"><thead className="bg-muted/60"><tr><th className="p-3 font-semibold">Recursos</th><th className="p-3 text-center font-semibold">Grátis</th><th className="p-3 text-center font-semibold text-[#87631c]">Premium</th></tr></thead><tbody>{comparison.map(([label, free, premium]) => <tr key={label} className="border-t"><td className="p-3 text-muted-foreground">{label}</td><td className="p-3 text-center">{free ? <Check className="mx-auto size-4 text-muted-foreground" /> : "—"}</td><td className="p-3 text-center"><CheckCircle2 className="mx-auto size-4 text-[#b68829]" /></td></tr>)}</tbody></table></div></CardContent></Card>
        <PlanStatusCard isPremium={isPremium} cancelled={cancelled} renewalDate={renewalDate} provider={subscription?.provider} cancelling={cancelling} onCancel={cancelRenewal} />
      </section>
      {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  )
}

function CompactPlanCard({ isPremium, cancelled, renewalDate }: { isPremium: boolean; cancelled: boolean; renewalDate: string | null }) {
  return <Card className="overflow-hidden"><CardContent className="flex flex-wrap items-center gap-4 p-5"><div className="flex size-12 items-center justify-center rounded-2xl bg-[#f7f0e3] text-[#87631c] dark:bg-muted dark:text-foreground"><Crown className="size-6" /></div><div className="min-w-0 flex-1"><p className="font-heading text-base font-black">{isPremium ? "Papirar Premium" : "Plano grátis"}</p><p className="mt-1 text-sm text-muted-foreground">{isPremium ? (cancelled ? (renewalDate ? `Acesso até ${renewalDate}.` : "Renovação cancelada.") : "Recursos completos liberados.") : "Assine para liberar áudios e recursos completos."}</p></div><Button asChild variant="outline" size="sm"><a href="/dashboard/assinatura">Gerenciar</a></Button></CardContent></Card>
}

function ManageActions({ provider, cancelled, cancelling, onCancel, renewalDate }: { provider?: SubscriptionOverview["provider"]; cancelled: boolean; cancelling: boolean; onCancel: () => Promise<void>; renewalDate: string | null }) {
  if (provider === "google_play") return <Button variant="outline" asChild className="h-12 rounded-full"><a href="https://play.google.com/store/account/subscriptions" target="_blank" rel="noreferrer">Gerenciar no Google Play <ExternalLink /></a></Button>
  if (provider !== "mercado_pago" || cancelled) return null
  return <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" className="h-12 rounded-full">Cancelar renovação</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancelar a renovação?</AlertDialogTitle><AlertDialogDescription>{renewalDate ? `Você continua com acesso Premium até ${renewalDate}. Depois disso, não haverá nova cobrança.` : "A assinatura não será renovada novamente."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={cancelling}>Manter assinatura</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={cancelling} onClick={onCancel}>{cancelling ? "Cancelando…" : "Cancelar renovação"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
}

function PlanStatusCard({ isPremium, cancelled, renewalDate, provider, cancelling, onCancel }: { isPremium: boolean; cancelled: boolean; renewalDate: string | null; provider?: SubscriptionOverview["provider"]; cancelling: boolean; onCancel: () => Promise<void> }) {
  return <div className="grid content-start gap-4"><Card className="shadow-none"><CardHeader><CardTitle className="text-base">Seu plano atual</CardTitle></CardHeader><CardContent className="grid gap-4"><StatusRow icon={Crown} label="Status atual" value={isPremium ? "Papirar Premium" : "Plano grátis"} /><StatusRow icon={CreditCard} label="Cobrança" value={isPremium ? (cancelled ? "Renovação cancelada" : "Renovação mensal ativa") : "Nenhuma cobrança ativa"} />{isPremium ? <StatusRow icon={CalendarClock} label="Próximo ciclo" value={renewalDate ?? "Confirmado pelo provedor"} /> : null}</CardContent><CardFooter><ManageActions provider={provider} cancelled={cancelled} cancelling={cancelling} onCancel={onCancel} renewalDate={renewalDate} /></CardFooter></Card><Card className="border-emerald-200 bg-emerald-50/60 shadow-none dark:border-emerald-900 dark:bg-emerald-950/20"><CardContent className="flex gap-3 p-4"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900"><LockKeyhole className="size-4" /></div><div><p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Pagamento seguro</p><p className="mt-1 text-xs leading-5 text-emerald-900/75 dark:text-emerald-100/70">Seu status é confirmado em tempo real pelo servidor de pagamento.</p></div></CardContent></Card></div>
}

function StatusRow({ icon: Icon, label, value }: { icon: typeof Crown; label: string; value: string }) {
  return <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-muted"><Icon className="size-4 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-semibold">{value}</p></div></div>
}
