import { firebaseAuth } from "@/lib/firebase/client"

export type SubscriptionOverview = {
  plan: "free" | "premium_monthly"
  isPremium: boolean
  expiresAt: string | null
  provider: "google_play" | "mercado_pago" | "manual" | null
  status: string | null
  cancelAtPeriodEnd: boolean
}

async function authorizedRequest(path: string, init?: RequestInit) {
  const user = firebaseAuth.currentUser

  if (!user) {
    throw new Error("Sua sessão expirou. Entre novamente para continuar.")
  }

  const response = await fetch(`/api/billing${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${await user.getIdToken()}`,
    },
  })

  const payload = await response
    .json()
    .catch(() => null) as { error?: string } | SubscriptionOverview | null

  if (!response.ok) {
    throw new Error(
      payload && "error" in payload
        ? payload.error ?? "Não foi possível concluir esta operação."
        : "Não foi possível concluir esta operação."
    )
  }

  return payload
}

export async function getSubscriptionOverview() {
  return await authorizedRequest("/subscription") as SubscriptionOverview
}

export async function cancelMercadoPagoSubscription() {
  return await authorizedRequest("/mercado-pago/cancel", {
    method: "POST",
  }) as SubscriptionOverview
}