"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const CONSENT_KEY = "papirar.privacy.notice.v1"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(window.localStorage.getItem(CONSENT_KEY) !== "seen")
  }, [])

  function dismiss() {
    window.localStorage.setItem(CONSENT_KEY, "seen")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      aria-label="Cookies e privacidade"
      className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-border bg-background/95 p-4 text-foreground shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:right-6 sm:w-[min(440px,calc(100vw-3rem))]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Cookies e privacidade</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Usamos armazenamento essencial para manter sua sessão, tema e preferências. Não usamos cookies de publicidade ou rastreamento.
          </p>
          <Link href="/privacidade" className="mt-2 inline-block text-xs font-medium underline underline-offset-4">
            Ler Política de Privacidade
          </Link>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-xl border border-border px-3 py-2 text-xs font-medium transition-colors hover:bg-muted"
        >
          Continuar
        </button>
      </div>
    </aside>
  )
}
