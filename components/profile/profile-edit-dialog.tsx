"use client"

import { Camera } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { UserProfile } from "@/lib/profile/profile-service"

export function ProfileEditDialog({
  profile,
  open,
  isSaving,
  isUploading,
  onOpenChange,
  onSave,
  onAvatarChange,
}: {
  profile: UserProfile
  open: boolean
  isSaving: boolean
  isUploading: boolean
  onOpenChange: (open: boolean) => void
  onSave: (value: Pick<UserProfile, "displayName" | "username" | "bio" | "profileColor">) => void
  onAvatarChange: (file: File) => void
}) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.bio)
  const [profileColor, setProfileColor] = useState(profile.profileColor)

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDisplayName(profile.displayName)
      setUsername(profile.username)
      setBio(profile.bio)
      setProfileColor(profile.profileColor)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-4 p-4 sm:max-w-[420px]">
        <DialogHeader className="gap-1">
          <DialogTitle className="font-heading text-lg font-black">
            Editar perfil
          </DialogTitle>
          <DialogDescription>
            Atualize as informações que aparecem no seu perfil.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="gap-3">
          <Field>
            <FieldLabel>Avatar</FieldLabel>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center overflow-hidden rounded-full border bg-muted text-sm font-bold">
                {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="Avatar atual" width={40} height={40} unoptimized className="size-full object-cover" /> : profile.displayName.slice(0, 1).toUpperCase()}
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-accent">
                <Camera className="size-3.5" />
                {isUploading ? "Enviando..." : "Alterar avatar"}
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
              </label>
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-color">Cor do perfil</FieldLabel>
            <div className="flex items-center gap-2">
              {['#f3f4f6', '#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe'].map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Selecionar cor ${color}`}
                  className={`size-6 rounded-full border-2 transition-transform hover:scale-110 ${profileColor === color ? "border-foreground ring-2 ring-ring ring-offset-2" : "border-white shadow-sm"}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setProfileColor(color)}
                />
              ))}
              <Input id="profile-color" type="color" value={profileColor} onChange={(event) => setProfileColor(event.target.value)} className="size-8 cursor-pointer rounded-lg p-1" aria-label="Escolher cor personalizada" />
            </div>
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-name">Nome</FieldLabel>
            <Input
              id="profile-name"
              className="h-9"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              maxLength={80}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-username">Usuário</FieldLabel>
            <Input
              id="profile-username"
              className="h-9"
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
                )
              }
              maxLength={30}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-bio">Bio</FieldLabel>
            <Textarea
              id="profile-bio"
              className="min-h-20 resize-none"
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={160}
            />
          </Field>
        </FieldGroup>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isSaving || !displayName.trim() || !username.trim()}
            onClick={() => onSave({ displayName, username, bio, profileColor })}
          >
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
