"use client"

import { Camera, Headphones, Play, CalendarDays } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserProfile } from "@/lib/profile/profile-service"

export function ProfileHeader({
  profile,
  onEdit,
  onAvatarChange,
  isUploading,
}: {
  profile: UserProfile
  onEdit: () => void
  onAvatarChange: (file: File) => void
  isUploading: boolean
}) {
  const initials =
    profile.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "P"
  const createdYear = profile.createdAt
    ? new Date(profile.createdAt).getFullYear()
    : null

  return (
    <section>
      <div
        className="relative h-[150px] overflow-visible rounded-3xl border border-border"
        style={{ backgroundColor: profile.profileColor }}
      >
        <div className="absolute top-5 left-5 flex h-[72px] w-[58px] -rotate-6 items-center justify-center rounded-xl border border-border bg-card/90 font-heading text-lg font-black">
          CP
        </div>
        <div className="absolute top-11 left-24 flex h-[72px] w-[58px] -rotate-6 items-center justify-center rounded-xl border border-border bg-card/90 font-heading text-lg font-black">
          CF
        </div>
        <div className="absolute right-4 bottom-4 inline-flex items-center gap-1 rounded-full border border-border bg-card/90 px-3 py-2 font-heading text-[11px] font-black">
          <Play className="size-4 fill-current" /> Lei seca com áudio
        </div>
        <label className="absolute -bottom-9 left-4 block cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) onAvatarChange(file)
              event.currentTarget.value = ""
            }}
          />
          <span className="relative flex size-[78px] items-center justify-center rounded-full border-[5px] border-background bg-primary text-2xl font-black text-primary-foreground">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="size-full rounded-full object-cover"
              />
            ) : (
              initials
            )}
            <span className="absolute right-0 bottom-0 flex size-7 items-center justify-center rounded-full border-[3px] border-background bg-card text-foreground">
              {isUploading ? (
                <span className="size-3 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </span>
          </span>
        </label>
        <Button
          type="button"
          variant="outline"
          className="absolute right-3 -bottom-5 h-[32px] rounded-full border-black bg-black px-3 text-xs font-heading font-black text-white hover:bg-black/85 hover:text-white dark:border-white dark:bg-white dark:text-black dark:hover:bg-white/85 dark:hover:text-black"
          onClick={onEdit}
        >
          Editar perfil
        </Button>
      </div>
      <div className="pt-11">
        <h1 className="font-heading text-[22px] font-black">
          {profile.displayName}
        </h1>
        <p className="font-heading text-[13px] font-extrabold text-muted-foreground">
          @{profile.username}
        </p>
        <p className="mt-2 max-w-2xl font-heading text-[13px] leading-relaxed font-bold">
          {profile.bio ||
            "Lei seca com áudio, revisão diária e foco em aprovação."}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-heading text-xs font-extrabold text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-4" />{" "}
            {createdYear ? `Entrou em ${createdYear}` : "Perfil ativo"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Headphones className="size-4" /> Áudio ativo
          </span>
        </div>
      </div>
    </section>
  )
}
