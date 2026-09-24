"use client"

import Link from "next/link"
import { Check, ShieldCheck } from "lucide-react"

import { AuthGuard } from "@/components/auth/auth-guard"
import { AssinarTrialAction } from "@/components/subscription/assinar-trial-action"

const benefits = [
  "Explicações em áudio para estudar com mais entendimento",
  "Acesso aos áudios explicativos do catálogo",
  "Assinatura mensal sem fidelidade",
]

export default function SubscribePage() {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-neutral-50 px-5 py-12 text-neutral-950 sm:px-8">
        <div className="mx-auto max-w-xl">
          <Link href="/dashboard" className="text-sm font-medium text-neutral-600 underline-offset-4 hover:underline">← Voltar ao Papirar</Link>
          <section className="mt-8 rounded-[2rem] border border-neutral-200 bg-white p-7 shadow-[0_28px_80px_-45px_rgba(0,0,0,0.45)] sm:p-10">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Papirar Premium</p>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">Teste grátis para contas elegíveis</span>
            </div>
            <h1 className="mt-4 font-display text-4xl tracking-[-0.04em] sm:text-5xl">Estude com mais clareza e profundidade.</h1>
            <div className="mt-8 flex items-end gap-2">
              <span className="font-display text-5xl tracking-[-0.05em]">R$ 24,99</span>
              <span className="pb-1.5 text-sm text-neutral-500">na assinatura mensal</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-500">Contas novas elegíveis podem testar o Premium por 3 dias sem cadastrar cartão. O teste termina automaticamente e não inicia uma assinatura paga.</p>
            <ul className="mt-8 space-y-3 text-sm text-neutral-700">
              {benefits.map((benefit) => <li key={benefit} className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />{benefit}</li>)}
            </ul>
            <div className="mt-9"><AssinarTrialAction /></div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-neutral-500"><ShieldCheck className="size-4 text-emerald-600" />Se escolher assinar, o pagamento será processado com segurança pelo Mercado Pago.</p>
          </section>
        </div>
      </main>
    </AuthGuard>
  )
}
