"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { AuthFeedback } from "@/components/auth/auth-feedback"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { authErrorMessage, requestPasswordReset } from "@/lib/auth/auth-service"
import { normalizeEmail, validateEmail } from "@/lib/auth/validators"

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
    <AuthPageShell title="Recuperar senha" description="Informe seu e-mail para receber um link seguro de acesso.">
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          <AuthFeedback message={feedback} tone={isError ? "error" : "success"} />
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} />
            <FieldDescription>Nunca informamos se um endereço está cadastrado.</FieldDescription>
          </Field>
          <Field><Button type="submit" disabled={isSubmitting} className="w-full">{isSubmitting ? "Enviando..." : "Enviar instruções"}</Button></Field>
          <FieldDescription className="text-center"><Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">Voltar para entrar</Link></FieldDescription>
        </FieldGroup>
      </form>
    </AuthPageShell>
  )
}
