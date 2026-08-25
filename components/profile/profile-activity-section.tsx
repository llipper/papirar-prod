"use client"

import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function ProfileActivitySection() {
  const [tab, setTab] = useState("leitura")
  const emptyCopy =
    tab === "leitura"
      ? "Nenhuma leitura registrada"
      : tab === "marcacao"
        ? "Nenhuma marcação registrada"
        : "Nenhum item salvo"
  return (
    <Card className="rounded-3xl">
      <CardContent className="p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full">
            <TabsTrigger value="leitura">Leitura</TabsTrigger>
            <TabsTrigger value="marcacao">Marcação</TabsTrigger>
            <TabsTrigger value="salvos">Salvos</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-6">
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="font-heading text-sm font-black">{emptyCopy}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sua atividade aparecerá aqui conforme você estudar.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
