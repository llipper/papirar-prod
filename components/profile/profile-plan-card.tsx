import { BookOpen, ChevronRight, CircleCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

export function ProfilePlanCard() {
  return (
    <Card className="cursor-pointer rounded-3xl transition-colors hover:bg-muted/40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="relative flex size-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
          <BookOpen className="size-7" />
          <CircleCheck className="absolute right-2 bottom-2 size-4 fill-emerald-500 text-background" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-sm font-black">Biblioteca atual</h2>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            Lei seca com áudio liberada para estudo e revisão.
          </p>
          <p className="mt-2 font-heading text-xs font-black">Abrir Lei Seca</p>
        </div>
        <ChevronRight className="size-5 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}
