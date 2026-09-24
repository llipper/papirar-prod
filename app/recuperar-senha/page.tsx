"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { ThemeLogo } from "@/components/brand/theme-logo"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authErrorMessage, requestPasswordReset } from "@/lib/auth/auth-service"
import { normalizeEmail, validateEmail } from "@/lib/auth/validators"
import { cn } from "@/lib/utils"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateEmail(email)
    if (validationError) {
      setIsError(true)
      setFeedback(validationError)
      return
    }
    setIsSubmitting(true)
    setIsError(false)
    setFeedback(undefined)
    try {
      const { error } = await requestPasswordReset(normalizeEmail(email))
      if (error) throw error
      setFeedback("Se existir uma conta para esse e-mail, enviaremos as instruções.")
    } catch (error) {
      setIsError(true)
      setFeedback(authErrorMessage(error, "Não foi possível enviar as instruções agora."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageShell>
      <div className="flex w-full flex-col gap-7">
        <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
          <FieldGroup className="gap-5">
            {/* Header */}
            <div className="mb-2 flex flex-col items-center text-center">
              <Link href="/" className="mb-5 transition-transform hover:scale-105 active:scale-95">
                <ThemeLogo size={44} className="size-11" />
              </Link>

              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Recuperar senha
              </h1>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Informe seu e-mail para receber as instruções de recuperação.
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                className="h-10"
              />
            </Field>

            <Field className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-10 w-full font-medium transition-all duration-200"
              >
                {isSubmitting ? "Enviando..." : "Enviar instruções"}
              </Button>
            </Field>

            {feedback && (
              <p
                role={isError ? "alert" : "status"}
                className={cn("text-center text-sm", isError ? "text-destructive" : "text-muted-foreground")}
              >
                {feedback}
              </p>
            )}

            <FieldDescription className="text-center">
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
              >
                Voltar para o login
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
      </div>
    </AuthPageShell>
  )
}
