"use client"

import Link from "next/link"
import { Check, ShieldCheck } from "lucide-react"

import { AuthGuard } from "@/components/auth/auth-guard"
import { MercadoPagoCheckoutButton } from "@/components/subscription/mercado-pago-checkout-button"

const benefits = [
  "Explicações em áudio para estudar com mais entendimento",
  "Áudios completos e recursos de revisão",
  "Comparação de atualizações legais",
  "Cancele quando quiser",
]

export default function SubscribePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-neutral-50 px-5 py-12 text-neutral-950 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Link href="/dashboard" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">← Voltar ao Papirar</Link>
          <section className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-[0_28px_80px_-45px_rgba(0,0,0,0.45)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Papirar Premium</p>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-5xl">Estude com mais clareza e profundidade.</h1>
            <div className="mt-8 flex items-end gap-2">
              <span className="font-display text-5xl tracking-[-0.05em]">R$ 24,99</span>
              <span className="pb-1.5 text-sm text-neutral-500">por mês</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">Renovação mensal. Você pode cancelar a qualquer momento.</p>
            <ul className="mt-8 space-y-3 text-sm text-neutral-700">
              {benefits.map((benefit) => <li key={benefit} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0" />{benefit}</li>)}
            </ul>
            <div className="mt-9"><MercadoPagoCheckoutButton /></div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-neutral-500"><ShieldCheck className="size-4" />Pagamento processado com segurança pelo Mercado Pago.</p>
          </section>
        </div>
      </main>
    </AuthGuard>
  )
}
