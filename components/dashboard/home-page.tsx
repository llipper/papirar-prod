"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Bookmark, Highlighter, UserRound } from "lucide-react"
import { useEffect, useState } from "react"

import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { bibliotecaBooks, bibliotecaCategories } from "@/lib/biblioteca/catalog-data"
import { getCurrentProfile, type UserProfile } from "@/lib/profile/profile-service"

const availableBooks = bibliotecaBooks.filter((book) => book.lawId)

const quickLinks = [
  { title: "Biblioteca", description: "Continue sua leitura", href: "/dashboard/biblioteca", icon: BookOpen },
  { title: "Anotações", description: "Revise suas observações", href: "/dashboard/anotacoes", icon: Bookmark },
  { title: "Marcações", description: "Retome trechos importantes", href: "/dashboard/marcacoes", icon: Highlighter },
  { title: "Perfil", description: "Atualize seus dados", href: "/dashboard/perfil", icon: UserRound },
] as const

export function HomePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    void getCurrentProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [])

  const firstName = profile?.displayName?.trim().split(/\s+/)[0] || "estudante"

  return (
    <DashboardShell title="Home" description="Seu espaço de estudo jurídico.">
      <section className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">Bom estudo, {firstName}.</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
          Continue de onde você parou
        </h1>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Leis disponíveis</CardDescription>
            <CardTitle className="text-2xl">{availableBooks.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Conteúdo atualizado na biblioteca.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Categorias</CardDescription>
            <CardTitle className="text-2xl">{bibliotecaCategories.length}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Organizadas por tipo de legislação.
          </CardContent>
        </Card>
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardDescription>Progresso de leitura</CardDescription>
            <CardTitle className="text-base">Seu estudo continua quando você iniciar uma leitura.</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/dashboard/biblioteca">
                Abrir biblioteca <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Acesso rápido</h2>
            <p className="text-sm text-muted-foreground">Tudo o que você usa para estudar.</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader className="gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Sua biblioteca</h2>
            <p className="text-sm text-muted-foreground">Acesse rapidamente os textos disponíveis.</p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/biblioteca">Ver tudo <ArrowRight /></Link>
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableBooks.slice(0, 6).map((book) => (
            <Link key={book.id} href={`/dashboard/biblioteca/${book.id}`} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary">{book.acronym}</Badge>
                    <span className="text-xs text-muted-foreground">{book.updatedAt}</span>
                  </div>
                  <CardTitle className="text-base">{book.title}</CardTitle>
                  <CardDescription>{book.category}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  )
}
