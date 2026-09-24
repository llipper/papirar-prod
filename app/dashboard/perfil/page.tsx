"use client"

import { useCallback, useEffect, useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ProfileActivitySection } from "@/components/profile/profile-activity-section"
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePlanCard } from "@/components/profile/profile-plan-card"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  getCurrentProfile,
  type UserProfile,
  updateProfile,
  uploadAvatar,
} from "@/lib/profile/profile-service"

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [error, setError] = useState<string>()

  const loadProfile = useCallback(async () => {
    setIsLoading(true)
    setError(undefined)
    try {
      setProfile(await getCurrentProfile())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar seu perfil."
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getCurrentProfile()
      .then((value) => {
        if (!cancelled) setProfile(value)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar seu perfil.")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  async function handleSave(
    value: Pick<UserProfile, "displayName" | "username" | "bio" | "profileColor">
  ) {
    setIsSaving(true)
    try {
      setProfile((current) => (current ? { ...current, ...value } : current))
      setProfile(await updateProfile(value))
      setIsEditOpen(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar seu perfil."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAvatar(file: File) {
    setIsUploading(true)
    try {
      setProfile(await uploadAvatar(file))
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Não foi possível atualizar seu avatar."
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4"
          />
          <h1 className="font-heading text-sm font-black">Perfil</h1>
        </header>
        <main className="flex flex-1 flex-col gap-5 overflow-auto p-4 md:p-6">
          {isLoading && <ProfileSkeleton />}
          {!isLoading && error && (
            <ProfileError message={error} onRetry={loadProfile} />
          )}
          {!isLoading && profile && (
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 pb-8">
              <ProfileHeader
                profile={profile}
                onEdit={() => setIsEditOpen(true)}
                onAvatarChange={handleAvatar}
                isUploading={isUploading}
              />
              <ProfilePlanCard />
              <ProfileActivitySection />
              <ProfileEditDialog
                profile={profile}
                open={isEditOpen}
                isSaving={isSaving}
                onOpenChange={setIsEditOpen}
                onSave={handleSave}
                onAvatarChange={handleAvatar}
                isUploading={isUploading}
              />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="h-[150px] animate-pulse rounded-3xl bg-muted" />
      <div className="h-28 animate-pulse rounded-3xl bg-muted" />
      <div className="h-40 animate-pulse rounded-3xl bg-muted" />
    </div>
  )
}

function ProfileError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <button
        type="button"
        className="text-sm font-medium underline underline-offset-4"
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </div>
  )
}
