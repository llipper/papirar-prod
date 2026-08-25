import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AUTH_COPY } from "@/lib/auth/constants"
import { PublicRouteGuard } from "@/components/auth/public-route-guard"

export function AuthPageShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode
  title: string
  description: string
}) {
  return (
    <PublicRouteGuard>
      <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-background p-6 md:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 -right-28 size-[280px] rounded-[92px] bg-[var(--auth-background-shape)]" />
        <div className="absolute -bottom-4 -left-32 size-[280px] rounded-[92px] bg-[var(--auth-background-shape)]" />
        <div className="absolute top-[92px] left-[38px] size-[54px] rounded-[18px] bg-[var(--auth-background-shape)]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-base font-black text-primary-foreground">
              {AUTH_COPY.brandMark}
            </span>
            <span>{AUTH_COPY.brand}</span>
          </Link>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl font-black">
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com os Termos de Serviço e a Política de
          Privacidade.
        </p>
      </div>
      </main>
    </PublicRouteGuard>
  )
}
