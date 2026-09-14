import Link from "next/link"

export default function SubscriptionReturnPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-neutral-50 px-5 text-neutral-950">
      <section className="max-w-md rounded-[2rem] border border-neutral-200 bg-white p-8 text-center shadow-[0_28px_80px_-45px_rgba(0,0,0,0.45)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Papirar Premium</p>
        <h1 className="mt-4 font-display text-4xl tracking-[-0.04em]">Estamos confirmando seu pagamento.</h1>
        <p className="mt-5 text-sm leading-6 text-neutral-600">Assim que o Mercado Pago confirmar a assinatura, seus recursos Premium serão liberados automaticamente. Isso pode levar alguns instantes.</p>
        <Link href="/dashboard/perfil" className="mt-8 inline-flex rounded-full bg-neutral-950 px-5 py-3 text-sm font-semibold text-white">Ir para meu perfil</Link>
      </section>
    </main>
  )
}
