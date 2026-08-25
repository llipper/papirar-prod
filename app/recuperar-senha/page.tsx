"use client"

import Link from "next/link"
import { useState } from "react"

import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { requestPasswordReset } from "@/lib/auth/auth-service"
import { normalizeEmail, validateEmail } from "@/lib/auth/validators"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateEmail(email)
    if (validationError) {
      setFeedback(validationError)
      return
    }
    setIsSubmitting(true)
    try {
      await requestPasswordReset(normalizeEmail(email))
    } finally {
      setIsSubmitting(false)
      setFeedback("Se existir uma conta para esse e-mail, enviaremos as instruções.")
    }
  }

  return (
    <AuthPageShell title="Recuperar senha" description="Informe seu e-mail para receber um link seguro de acesso.">
      <form onSubmit={handleSubmit} noValidate>
        <FieldGroup>
          {feedback && <div role="status" className="text-sm text-muted-foreground">{feedback}</div>}
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
