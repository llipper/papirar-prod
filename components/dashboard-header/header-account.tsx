"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "firebase/auth"
import { User as UserIcon, CreditCard, Settings, LogOut } from "lucide-react"

import { firebaseAuth } from "@/lib/firebase/client"
import { useAuthUser } from "@/lib/auth/use-auth-user"

export function HeaderAccount() {
  const authUser = useAuthUser()
  const router = useRouter()

  const displayName = authUser?.displayName || authUser?.email?.split("@")[0] || "Minha Conta"
  const email = authUser?.email || ""

  async function handleSignOut() {
    await signOut(firebaseAuth)
    router.replace("/login")
  }

  return (
    <div className="group relative">
      <button
        type="button"
        aria-label="Minha Conta"
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-2.5 sm:px-3 text-xs font-semibold text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
      >
        {authUser?.photoURL ? (
          <Image
            src={authUser.photoURL}
            alt=""
            width={18}
            height={18}
            className="size-[18px] rounded-full object-cover"
          />
        ) : (
          <span className="flex size-[18px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="max-w-[100px] truncate hidden sm:inline">{displayName}</span>
      </button>

      <div className="invisible absolute top-11 right-0 z-50 w-64 translate-y-1 rounded-2xl bg-popover p-2 opacity-0 shadow-lg ring-1 ring-border/50 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 bg-muted/40">
          {authUser?.photoURL ? (
            <Image
              src={authUser.photoURL}
              alt={displayName}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {email}
            </p>
          </div>
        </div>

        <div className="my-1.5 h-px bg-border/60" />

        <Link
          href="/dashboard/perfil"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          <UserIcon className="size-3.5 text-muted-foreground" />
          <span>Perfil</span>
        </Link>

        {/* <Link
          href="/dashboard/assinatura"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          <CreditCard className="size-3.5 text-muted-foreground" />
          <span>Minha Assinatura</span>
        </Link> */}

        <Link
          href="/dashboard/configuracao"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-foreground hover:bg-muted cursor-pointer transition-colors"
        >
          <Settings className="size-3.5 text-muted-foreground" />
          <span>Configurações</span>
        </Link>

        <div className="my-1.5 h-px bg-border/60" />

        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
        >
          <LogOut className="size-3.5" />
          <span>Sair da conta</span>
        </button>
      </div>
    </div>
  )
}
