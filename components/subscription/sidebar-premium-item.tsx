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
      const authUid = user.uid
      setLoading(true)
      setSubscription(null)
      void getSubscriptionOverview()
        .then((nextSubscription) => {
          if (firebaseAuth.currentUser?.uid === authUid) {
            setSubscription(nextSubscription)
          }
        })
        .catch(() => {
          if (firebaseAuth.currentUser?.uid === authUid) {
            setSubscription(null)
          }
        })
        .finally(() => {
          if (firebaseAuth.currentUser?.uid === authUid) {
            setLoading(false)
          }
        })
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
    return <SidebarMenu className="px-1"><SidebarMenuItem><SidebarMenuButton disabled className="h-auto min-h-[76px] rounded-2xl px-3 py-3"><LoaderCircle className="animate-spin" /><span>Carregando plano…</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  }

  if (subscription?.isPremium) {
    const until = dateLabel(subscription.expiresAt)
    return (
      <SidebarMenu className="px-1">
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Gerenciar Papirar Premium" className="h-auto min-h-[76px] gap-2.5 rounded-2xl bg-amber-50/70 px-3 py-3 text-amber-950 hover:bg-amber-100/70 hover:text-amber-950 dark:bg-amber-950/25 dark:text-amber-100 dark:hover:bg-amber-950/40">
            <Link href="/dashboard/assinatura">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200"><Crown className="size-4" /></span>
              <span className="flex min-w-0 flex-1 flex-col items-start whitespace-normal"><span className="w-full truncate text-[13px] font-semibold leading-4">Papirar Premium</span><span className="mt-0.5 line-clamp-2 w-full text-[11px] leading-[1.35] text-amber-900/65 dark:text-amber-100/65">{subscription.isTrial ? `Teste até ${until ?? "o fim do período"}` : "Mais recursos para seus estudos."}</span></span>
              <ChevronRight className="size-3.5 shrink-0 text-amber-800/70 dark:text-amber-100/70" />
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (subscription?.canRedeemTrial) {
    return (
      <SidebarMenu className="px-1">
        <SidebarMenuItem>
          <SidebarMenuButton onClick={redeem} disabled={redeeming} tooltip="Resgatar 3 dias grátis" className="h-auto min-h-[76px] gap-2.5 rounded-2xl bg-amber-50/70 px-3 py-3 text-amber-950 hover:bg-amber-100/70 hover:text-amber-950 dark:bg-amber-950/25 dark:text-amber-100 dark:hover:bg-amber-950/40">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200">{redeeming ? <LoaderCircle className="size-4 animate-spin" /> : <Gift className="size-4" />}</span>
            <span className="flex min-w-0 flex-1 flex-col items-start whitespace-normal"><span className="w-full truncate text-[13px] font-semibold leading-4">Resgatar Premium</span><span className="mt-0.5 line-clamp-2 w-full text-[11px] leading-[1.35] text-amber-900/65 dark:text-amber-100/65">3 dias grátis para estudar.</span></span>
            <ChevronRight className="size-3.5 shrink-0 text-amber-800/70 dark:text-amber-100/70" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu className="px-1">
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Assinar Papirar Premium" className="h-auto min-h-[76px] gap-2.5 rounded-2xl bg-sidebar-accent/30 px-3 py-3 hover:bg-sidebar-accent">
          <Link href="/dashboard/assinatura"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground"><Crown className="size-4" /></span><span className="flex min-w-0 flex-1 flex-col items-start whitespace-normal"><span className="w-full truncate text-[13px] font-semibold leading-4">Papirar Premium</span><span className="mt-0.5 line-clamp-2 w-full text-[11px] leading-[1.35] text-muted-foreground">Mais recursos para seus estudos.</span></span><ChevronRight className="size-3.5 shrink-0 text-muted-foreground" /></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
