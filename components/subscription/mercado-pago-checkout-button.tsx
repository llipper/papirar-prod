"use client"

import { useEffect, useId, useRef, useState } from "react"
import { LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { firebaseAuth } from "@/lib/firebase/client"

type CheckoutIntent = {
  sessionId: string
  publicKey: string
  payerEmail: string
  amount: number
}

type CardFormData = { token?: string }
type BrickController = { unmount: () => void }
type MercadoPagoInstance = {
  bricks: () => {
    create: (
      brick: "cardPayment",
      containerId: string,
      settings: {
        initialization: { amount: number; payer: { email: string } }
        callbacks: {
          onReady: () => void
          onSubmit: (data: CardFormData) => Promise<void>
          onError: (error: unknown) => void
        }
      }
    ) => Promise<BrickController>
  }
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      options: { locale: "pt-BR" }
    ) => MercadoPagoInstance
  }
}

let mercadoPagoSdkPromise: Promise<void> | undefined

function loadMercadoPagoSdk() {
  if (window.MercadoPago) return Promise.resolve()
  if (mercadoPagoSdkPromise) return mercadoPagoSdkPromise

  mercadoPagoSdkPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    const nonceScript =
      document.querySelector<HTMLScriptElement>("script[nonce]")
    if (nonceScript?.nonce) script.nonce = nonceScript.nonce
    script.onload = () =>
      window.MercadoPago
        ? resolve()
        : reject(new Error("O checkout seguro não carregou corretamente."))
    script.onerror = () =>
      reject(
        new Error(
          "Não foi possível carregar o checkout seguro do Mercado Pago."
        )
      )
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    mercadoPagoSdkPromise = undefined
    throw error
  })

  return mercadoPagoSdkPromise
}

export function MercadoPagoCheckoutButton({
  label = "Assinar por R$ 24,99/mês",
  className,
}: {
  label?: string
  className?: string
}) {
  const brickId = useId().replace(/:/g, "")
  const brickController = useRef<BrickController | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [intent, setIntent] = useState<CheckoutIntent | null>(null)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) return
    brickController.current?.unmount()
    brickController.current = null
  }, [open])

  useEffect(() => () => brickController.current?.unmount(), [])

  async function startCheckout() {
    setOpen(true)
    setLoading(true)
    setError("")
    setSubmitted(false)
    setPending(false)
    try {
      const user = firebaseAuth.currentUser
      if (!user)
        throw new Error("Sua sessão expirou. Entre novamente para assinar.")
      const token = await user.getIdToken()
      const response = await fetch("/api/billing/mercado-pago/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const payload = (await response.json().catch(() => null)) as
        (CheckoutIntent & { error?: string }) | null
      if (
        !response.ok ||
        !payload?.sessionId ||
        !payload.publicKey ||
        !payload.payerEmail
      ) {
        throw new Error(
          payload?.error ?? "Não foi possível preparar o pagamento agora."
        )
      }

      await loadMercadoPagoSdk()
      if (!window.MercadoPago)
        throw new Error("O checkout seguro não está disponível.")
      const mp = new window.MercadoPago(payload.publicKey, { locale: "pt-BR" })
      brickController.current?.unmount()
      brickController.current = await mp
        .bricks()
        .create("cardPayment", brickId, {
          initialization: {
            amount: payload.amount,
            // The Worker chooses the sandbox payer email only when explicitly
            // configured for local testing; this same email is bound to D1 and
            // sent when it creates the preapproval.
            payer: { email: payload.payerEmail },
          },
          callbacks: {
            onReady: () => setLoading(false),
            onError: (brickError: unknown) => {
              const diagnostic =
                brickError instanceof Error
                  ? { name: brickError.name, message: brickError.message }
                  : { message: String(brickError).slice(0, 240) }
              console.error("[mercado-pago-brick] component error", diagnostic)
              setLoading(false)
              setError(
                "O formulário de pagamento não carregou. Tente novamente."
              )
            },
            onSubmit: async (formData) => {
              try {
                if (!formData.token || formData.token.length > 512)
                  throw new Error(
                    "Não foi possível validar o cartão. Revise os dados e tente novamente."
                  )
                const currentUser = firebaseAuth.currentUser
                if (!currentUser)
                  throw new Error(
                    "Sua sessão expirou. Entre novamente para assinar."
                  )
                const currentToken = await currentUser.getIdToken()
                const subscribeResponse = await fetch(
                  "/api/billing/mercado-pago/subscribe",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${currentToken}`,
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      sessionId: payload.sessionId,
                      cardToken: formData.token,
                    }),
                  }
                )
                const subscribePayload = (await subscribeResponse
                  .json()
                  .catch(() => null)) as {
                  status?: string
                  error?: string
                } | null
                if (!subscribeResponse.ok) {
                  if (
                    subscribeResponse.status === 409 ||
                    subscribeResponse.status === 422
                  )
                    setIntent(null)
                  throw new Error(
                    subscribePayload?.error ??
                      "Não foi possível concluir a assinatura."
                  )
                }
                setSubmitted(subscribePayload?.status === "authorized")
                setPending(subscribePayload?.status !== "authorized")
                setError("")
              } catch (submitError) {
                setError(
                  submitError instanceof Error
                    ? submitError.message
                    : "Não foi possível concluir a assinatura."
                )
                throw submitError
              }
            },
          },
        })
      setIntent(payload)
    } catch (checkoutError) {
      console.error("[mercado-pago-brick] checkout initialization failed", {
        name:
          checkoutError instanceof Error ? checkoutError.name : "UnknownError",
        message:
          checkoutError instanceof Error
            ? checkoutError.message.slice(0, 240)
            : "Não foi possível iniciar o Brick.",
      })
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Não foi possível iniciar o pagamento agora."
      )
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className="grid gap-3">
        {!open ? (
          <Button
            className={className ?? "h-12 w-full rounded-full"}
            onClick={startCheckout}
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" /> Preparando
                pagamento seguro…
              </>
            ) : (
              label
            )}
          </Button>
        ) : null}
      </div>
      <DialogContent
        showCloseButton
        className="top-auto bottom-0 left-1/2 max-h-[92dvh] w-full max-w-none translate-x-[-50%] translate-y-0 gap-0 overflow-y-auto rounded-b-none rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:top-1/2 sm:bottom-auto sm:w-[calc(100%-2rem)] sm:max-w-3xl sm:-translate-y-1/2 sm:rounded-3xl sm:p-6"
      >
        <div
          className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted sm:hidden"
          aria-hidden="true"
        />
        <DialogHeader className="mb-4 pr-8 text-left sm:mb-5">
          <DialogTitle className="flex items-center gap-2">
            <LockKeyhole
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
            Pagamento seguro
          </DialogTitle>
          <DialogDescription>
            Papirar Premium · R$ 24,99 por mês
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <p className="text-xs leading-5 text-muted-foreground">
            A primeira parcela pode ser processada em até cerca de uma hora
            após autorizar. O Mercado Pago também pode fazer uma validação
            temporária do cartão e estorná-la após a verificação.
          </p>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-5 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Carregando formulário protegido…
            </div>
          ) : null}
          <div
            id={brickId}
            className={submitted || pending ? "hidden" : "min-h-24"}
          />
          {submitted ? (
            <p className="text-sm font-medium text-emerald-700" role="status">
              Assinatura autorizada. O Premium está sendo atualizado na sua
              conta.
            </p>
          ) : null}
          {pending ? (
            <p className="text-sm text-muted-foreground" role="status">
              O Mercado Pago recebeu o pedido e ainda está confirmando a
              autorização. O acesso Premium será liberado após a confirmação.
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {!intent && !loading ? (
            <Button type="button" variant="outline" onClick={startCheckout}>
              <RotateCcw className="size-4" />
              Tentar novamente
            </Button>
          ) : null}
          <p className="text-center text-xs text-muted-foreground">
            Os dados do cartão são tokenizados pelo Mercado Pago e não são
            armazenados pelo Papirar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
