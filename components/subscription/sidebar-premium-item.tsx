"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Gift, LoaderCircle } from "lucide-react"
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
    return <SidebarMenu><SidebarMenuItem><SidebarMenuButton disabled><LoaderCircle className="animate-spin" /><span>Carregando plano…</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu>
  }

  if (subscription?.isPremium) {
    const until = dateLabel(subscription.expiresAt)
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Gerenciar Papirar Premium" className="bg-amber-50 text-amber-950 hover:bg-amber-100 hover:text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50">
            <Link href="/dashboard/assinatura">
              <Crown />
              <span className="flex min-w-0 flex-col items-start leading-tight"><span className="font-semibold">Papirar Premium</span><span className="text-[10px] opacity-75">{subscription.isTrial ? `Teste até ${until ?? "o fim do período"}` : "Gerenciar assinatura"}</span></span>
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
          <SidebarMenuButton onClick={redeem} disabled={redeeming} tooltip="Resgatar 3 dias grátis" className="bg-amber-50 text-amber-950 hover:bg-amber-100 hover:text-amber-950 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50">
            {redeeming ? <LoaderCircle className="animate-spin" /> : <Gift />}
            <span className="flex min-w-0 flex-col items-start leading-tight"><span className="font-semibold">Resgatar Premium</span><span className="text-[10px] opacity-75">3 dias grátis</span></span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild tooltip="Assinar Papirar Premium">
          <Link href="/dashboard/assinatura"><Crown /><span>Assinar Premium</span></Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
