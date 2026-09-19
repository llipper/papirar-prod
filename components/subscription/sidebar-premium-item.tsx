"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Crown, Gift, LoaderCircle } from "lucide-react"
import { useEffect, useState } from "react"

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { firebaseAuth } from "@/lib/firebase/client"
import { getSubscriptionOverview, redeemPremiumTrial, type SubscriptionOverview } from "@/lib/subscription/subscription-service"

function dateLabel(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date)
}

export function SidebarPremiumItem() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    return firebaseAuth.onIdTokenChanged((user) => {
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }
      setLoading(true)
      void getSubscriptionOverview()
        .then(setSubscription)
        .catch(() => setSubscription(null))
        .finally(() => setLoading(false))
    })
  }, [])

  async function redeem() {
    setRedeeming(true)
    try {
      setSubscription(await redeemPremiumTrial())
      router.refresh()
    } catch {
      router.push("/dashboard/assinatura")
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return <SidebarMenu><SidebarMenuItem><SidebarMenuButton disabled className="h-auto min-h-20 rounded-2xl px-3 py-3"><LoaderCircle className="animate-spin" /><span>Carregando plano…</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  }

  if (subscription?.isPremium) {
    const until = dateLabel(subscription.expiresAt)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Gerenciar Papirar Premium" className="h-auto min-h-20 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-white px-3 py-3 text-amber-950 shadow-sm hover:border-amber-200 hover:bg-amber-50 hover:text-amber-950 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-sidebar-accent dark:text-amber-100 dark:hover:bg-amber-950/50">
            <Link href="/dashboard/assinatura">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200"><Crown className="size-5" /></span>
              <span className="flex min-w-0 flex-1 flex-col items-start leading-tight"><span className="font-semibold">Papirar Premium</span><span className="mt-1 text-xs text-muted-foreground">{subscription.isTrial ? `Teste até ${until ?? "o fim do período"}` : "Mais recursos para seus estudos."}</span></span>
              <ChevronRight className="size-4 shrink-0" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (subscription?.canRedeemTrial) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton onClick={redeem} disabled={redeeming} tooltip="Resgatar 3 dias grátis" className="h-auto min-h-20 rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50 to-white px-3 py-3 text-amber-950 shadow-sm hover:border-amber-200 hover:bg-amber-50 hover:text-amber-950 dark:border-amber-900/60 dark:from-amber-950/40 dark:to-sidebar-accent dark:text-amber-100 dark:hover:bg-amber-950/50">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">{redeeming ? <LoaderCircle className="size-5 animate-spin" /> : <Gift className="size-5" />}</span>
            <span className="flex min-w-0 flex-1 flex-col items-start leading-tight"><span className="font-semibold">Resgatar Premium</span><span className="mt-1 text-xs text-muted-foreground">3 dias grátis para estudar.</span></span>
            <ChevronRight className="size-4 shrink-0" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Assinar Papirar Premium" className="h-auto min-h-20 rounded-2xl border border-sidebar-border px-3 py-3 hover:bg-sidebar-accent">
          <Link href="/dashboard/assinatura"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"><Crown className="size-5" /></span><span className="flex min-w-0 flex-1 flex-col items-start leading-tight"><span className="font-semibold">Papirar Premium</span><span className="mt-1 text-xs text-muted-foreground">Mais recursos para seus estudos.</span></span><ChevronRight className="size-4 shrink-0" /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
