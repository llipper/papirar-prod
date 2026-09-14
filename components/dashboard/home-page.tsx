"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen, Bookmark, Clock3, FolderOpen, Highlighter, LibraryBig, Search, UserRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { bibliotecaBooks, bibliotecaCategories } from "@/lib/biblioteca/catalog-data"
import { firebaseAuth } from "@/lib/firebase/client"
import { getCurrentProfile, type UserProfile } from "@/lib/profile/profile-service"

const apiBase = (process.env.NEXT_PUBLIC_CLOUDFLARE_API_URL ?? "https://papirar-api.papirar-api-worker.workers.dev").replace(/\/$/, "")
const availableBooks = bibliotecaBooks.filter((book) => book.lawId)

type ReadingProgress = { law_id: string; law_title: string; law_acronym: string; total_seconds: number }

const quickLinks = [
  { title: "Biblioteca", description: "Continue sua leitura", href: "/dashboard/biblioteca", icon: BookOpen },
  { title: "Anotações", description: "Revise suas observações", href: "/dashboard/anotacoes", icon: Bookmark },
  { title: "Marcações", description: "Retome trechos importantes", href: "/dashboard/marcacoes", icon: Highlighter },
  { title: "Perfil", description: "Atualize seus dados", href: "/dashboard/perfil", icon: UserRound },
] as const

function studyTime(seconds: number) {
  if (seconds < 60) return "Comece sua primeira leitura"
  const minutes = Math.floor(seconds / 60)
  return minutes < 60 ? `${minutes} min estudados` : `${Math.floor(minutes / 60)}h ${minutes % 60}min estudados`
}

export function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)

  useEffect(() => {
    void getCurrentProfile().then(setProfile).catch(() => setProfile(null))
    void (async () => {
      try {
        const user = firebaseAuth.currentUser
        if (!user) return
        const response = await fetch(`${apiBase}/reading-progress`, { headers: { Authorization: `Bearer ${await user.getIdToken()}` } })
        if (!response.ok) return
        const rows = await response.json() as ReadingProgress[]
        setProgress(rows[0] ?? null)
      } catch {
        setProgress(null)
      }
    })()
  }, [])

  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || "estudante"
  const continuedBook = useMemo(() => progress ? availableBooks.find((book) => book.lawId === progress.law_id) : null, [progress])
  const continueHref = continuedBook ? `/dashboard/biblioteca/${continuedBook.id}` : "/dashboard/biblioteca"

  return (
    <DashboardShell title="Home" description="Seu espaço de estudo jurídico." action={<Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link href="/dashboard/biblioteca"><Search /> Pesquisar leis</Link></Button>}>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(130px,.55fr)_minmax(130px,.55fr)_minmax(220px,.8fr)]">
        <Card className="relative min-h-48 overflow-hidden border-0 bg-[linear-gradient(120deg,#faf7f1_0%,#f5eee3_100%)] shadow-none dark:bg-muted">
          <CardContent className="relative z-10 flex min-h-48 flex-col justify-between p-6">
            <div className="max-w-sm"><p className="text-xs font-semibold text-muted-foreground">Bom estudo, {firstName}.</p><h1 className="mt-2 font-heading text-2xl font-black tracking-tight sm:text-3xl">Continue de onde você parou</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{progress ? `Retome ${progress.law_title} e avance no seu ritmo.` : "O conhecimento te aproxima dos seus objetivos."}</p></div>
            <Button asChild size="sm" className="w-fit rounded-full"><Link href={continueHref}>{progress ? "Continuar leitura" : "Abrir biblioteca"} <ArrowRight /></Link></Button>
          </CardContent>
          <div className="absolute right-3 bottom-0 hidden h-40 w-40 rotate-6 overflow-hidden rounded-t-[2rem] border-4 border-background/60 bg-card shadow-xl sm:block"><Image src={continuedBook?.coverPath ?? "/capas/constituicao_federal.png"} alt="Livro em destaque" fill sizes="160px" className="object-cover" /></div>
        </Card>
        <MetricCard icon={LibraryBig} label="Leis disponíveis" value={String(availableBooks.length)} detail="Conteúdo para estudar" />
        <MetricCard icon={FolderOpen} label="Categorias" value={String(bibliotecaCategories.length)} detail="Organizadas por assunto" />
        <Card className="min-h-48 overflow-hidden border-0 bg-zinc-950 text-white shadow-none"><CardContent className="flex min-h-48 flex-col justify-between p-5"><div><div className="flex size-9 items-center justify-center rounded-xl bg-white/10"><Clock3 className="size-4" /></div><p className="mt-5 text-xs font-medium text-zinc-400">Progresso de leitura</p><p className="mt-1 text-lg font-bold leading-6">{progress ? progress.law_acronym : "Seu estudo começa aqui"}</p><p className="mt-1 text-xs text-zinc-400">{progress ? studyTime(progress.total_seconds) : "Escolha uma lei e comece agora."}</p></div><Button asChild size="sm" variant="secondary" className="w-fit rounded-full"><Link href={continueHref}>{progress ? "Continuar" : "Abrir biblioteca"} <ArrowRight /></Link></Button></CardContent></Card>
      </section>

      <DashboardSection title="Acesso rápido" description="Tudo o que você usa para estudar."><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{quickLinks.map(({ title, description, href, icon: Icon }) => <Link key={href} href={href} className="group"><Card className="h-full rounded-2xl py-0 shadow-none transition-all group-hover:-translate-y-0.5 group-hover:bg-muted/60"><CardContent className="flex items-center gap-3 p-4"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800 dark:bg-muted dark:text-foreground"><Icon className="size-4" /></div><div className="min-w-0 flex-1"><h3 className="font-heading text-sm font-bold">{title}</h3><p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p></div><ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardContent></Card></Link>)}</div></DashboardSection>

      <DashboardSection title="Sua biblioteca" description="Acesse rapidamente os textos disponíveis." href="/dashboard/biblioteca"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{availableBooks.slice(0, 6).map((book) => <Link key={book.id} href={`/dashboard/biblioteca/${book.id}`} className="group"><Card className="h-full rounded-2xl py-0 shadow-none transition-all group-hover:-translate-y-0.5 group-hover:bg-muted/60"><CardContent className="flex items-center gap-3 p-3"><div className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-muted"><Image src={book.coverPath ?? "/capas/constituicao_federal.png"} alt="" fill sizes="44px" className="object-cover" /></div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><Badge variant="secondary" className="max-w-20 truncate">{book.acronym}</Badge><span className="text-[10px] text-muted-foreground">{book.updatedAt}</span></div><h3 className="mt-1 truncate font-heading text-sm font-bold">{book.title}</h3><p className="truncate text-xs text-muted-foreground">{book.category}</p></div><ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" /></CardContent></Card></Link>)}</div></DashboardSection>
    </DashboardShell>
  )
}

function MetricCard({ icon: Icon, label, value, detail }: { icon: typeof BookOpen; label: string; value: string; detail: string }) {
  return <Card className="min-h-48 rounded-2xl py-0 shadow-none"><CardContent className="flex min-h-48 flex-col justify-between p-5"><div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-800 dark:bg-muted dark:text-foreground"><Icon className="size-4" /></div><div><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 font-heading text-3xl font-black tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>
}

function DashboardSection({ title, description, href, children }: { title: string; description: string; href?: string; children: React.ReactNode }) {
  return <section className="space-y-3"><div className="flex items-end justify-between gap-4"><div><h2 className="font-heading text-lg font-black">{title}</h2><p className="text-sm text-muted-foreground">{description}</p></div>{href ? <Button asChild variant="ghost" size="sm"><Link href={href}>Ver tudo <ArrowRight /></Link></Button> : null}</div>{children}</section>
}
