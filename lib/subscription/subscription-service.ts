import { firebaseAuth } from "@/lib/firebase/client"

export type SubscriptionOverview = {
  plan: "free" | "premium_monthly"
  isPremium: boolean
  expiresAt: string | null
  provider: "google_play" | "mercado_pago" | "manual" | null
  status: string | null
  cancelAtPeriodEnd: boolean
  isTrial: boolean
  canRedeemTrial: boolean
  trialExpiresAt: string | null
}

const SUBSCRIPTION_CACHE_TTL_MS = 60 * 1000

type SubscriptionCacheEntry = {
  expiresAt: number
  value: SubscriptionOverview
}

const subscriptionCache = new Map<string, SubscriptionCacheEntry>()
const subscriptionRequests = new Map<string, Promise<SubscriptionOverview>>()

function invalidateSubscriptionOverview() {
  const uid = firebaseAuth.currentUser?.uid
  if (uid) subscriptionCache.delete(uid)
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
  const uid = firebaseAuth.currentUser?.uid
  if (!uid) throw new Error("Sua sessão expirou. Entre novamente para continuar.")

  const cached = subscriptionCache.get(uid)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const inFlight = subscriptionRequests.get(uid)
  if (inFlight) return inFlight

  const request = (authorizedRequest("/subscription") as Promise<SubscriptionOverview>)
    .then((value) => {
      if (firebaseAuth.currentUser?.uid === uid) {
        subscriptionCache.set(uid, { value, expiresAt: Date.now() + SUBSCRIPTION_CACHE_TTL_MS })
      }
      return value
    })
    .finally(() => subscriptionRequests.delete(uid))

  subscriptionRequests.set(uid, request)
  return request
}

export async function cancelMercadoPagoSubscription() {
  const result = await authorizedRequest("/mercado-pago/cancel", {
    method: "POST",
  }) as SubscriptionOverview
  invalidateSubscriptionOverview()
  return result
}

export async function redeemPremiumTrial() {
  await authorizedRequest("/trial/redeem", {
    method: "POST",
  })
  invalidateSubscriptionOverview()
  return getSubscriptionOverview()
}
