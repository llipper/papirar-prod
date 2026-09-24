"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, BookOpen, CheckCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { bibliotecaBooks } from "@/lib/biblioteca/catalog-data"
import {
  listLegalChangeNotifications,
  markAllLegalChangeNotificationsRead,
  markLegalChangeNotificationRead,
  type LegalChangeNotification,
} from "@/lib/admin/legal-catalog-admin-service"

function notificationHref(notification: LegalChangeNotification) {
  const book = bibliotecaBooks.find((item) => item.lawId === notification.law_id)
  const base = book ? `/dashboard/biblioteca/${book.id}` : "/dashboard/biblioteca"
  return notification.node_key
    ? `${base}?node=${encodeURIComponent(notification.node_key)}`
    : base
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date)
}

export function HeaderNotifications() {
  const [items, setItems] = useState<LegalChangeNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await listLegalChangeNotifications()
      setItems(result.notifications)
      setUnread(result.unread_count)
    } catch {
      // Sessões ainda sendo restauradas serão buscadas novamente pelo próximo ciclo.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60_000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function markAllRead() {
    await markAllLegalChangeNotificationsRead()
    setItems((current) => current.map((item) => ({ ...item, is_read: true })))
    setUnread(0)
  }

  async function openNotification(item: LegalChangeNotification) {
    if (!item.is_read) {
      await markLegalChangeNotificationRead(item.id)
      setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry))
      setUnread((count) => Math.max(0, count - 1))
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={`Notificações${unread ? `, ${unread} não lidas` : ""}`} className="relative size-9 rounded-full bg-muted text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
          {unread > 0 ? <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">{unread > 99 ? "99+" : unread}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-[min(24rem,calc(100vw-1.5rem))] gap-0 overflow-hidden p-0">
        <PopoverHeader className="flex-row items-center justify-between border-b px-4 py-3 pr-10">
          <div>
            <PopoverTitle className="text-sm font-semibold">Atualizações das leis</PopoverTitle>
            <p className="text-xs text-muted-foreground">Mudanças recentes no catálogo</p>
          </div>
          {unread > 0 ? <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs" onClick={() => void markAllRead()}><CheckCheck className="size-3.5" />Ler todas</Button> : null}
        </PopoverHeader>
        <div className="max-h-[min(26rem,70vh)] overflow-y-auto">
          {loading ? <p className="p-5 text-center text-sm text-muted-foreground">Carregando notificações…</p> : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-8 text-center">
              <BookOpen className="size-5 text-muted-foreground" />
              <p className="text-sm font-medium">Nenhuma atualização recente</p>
              <p className="text-xs text-muted-foreground">Avisaremos quando uma lei do catálogo mudar.</p>
            </div>
          ) : items.map((item) => (
            <Link key={item.id} href={notificationHref(item)} onClick={() => void openNotification(item)} className="flex gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/60">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${item.is_read ? "bg-transparent" : "bg-primary"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold">{item.law_acronym || item.law_title}</span>
                <span className="mt-0.5 block text-sm leading-snug text-foreground">{item.summary}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">{formatDate(item.created_at)}</span>
              </span>
            </Link>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
