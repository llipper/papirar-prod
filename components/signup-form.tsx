"use client"

import Link from "next/link"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AUTH_COPY } from "@/lib/auth/constants"
import { authErrorMessage, createAccount } from "@/lib/auth/auth-service"
import { normalizeEmail, validateEmail, validateName, validatePasswordConfirmation, validateStrongPassword } from "@/lib/auth/validators"

export function SignupForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateName(name) ?? validateEmail(email) ?? validateStrongPassword(password, email) ?? validatePasswordConfirmation(confirmation, password)
    if (validationError) {
      setIsError(true)
      setSubmitState("error")
      setFeedback(validationError)
      return
    }
    setIsSubmitting(true)
    setSubmitState("idle")
    setFeedback(undefined)
    try {
      const { data, error } = await createAccount(name.trim(), normalizeEmail(email), password)
      if (error) throw error
      setIsError(false)
      setSubmitState("success")
      setFeedback(
        data.session
          ? "Conta criada com sucesso. Você já está conectado."
          : "Conta criada com sucesso. Verifique seu e-mail antes de entrar.",
      )
      setName(""); setEmail(""); setPassword(""); setConfirmation("")
    } catch (error) {
      setIsError(true)
      setSubmitState("error")
      setFeedback(authErrorMessage(error, "Não foi possível criar a conta com esses dados."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field><FieldLabel htmlFor="name">Nome</FieldLabel><Input id="name" type="text" autoComplete="name" placeholder="Seu nome" value={name} onChange={(event) => setName(event.target.value)} disabled={isSubmitting} /></Field>
        <Field><FieldLabel htmlFor="email">E-mail</FieldLabel><Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={isSubmitting} /></Field>
        <Field>
          <FieldLabel htmlFor="password">Senha</FieldLabel>
          <div className="relative"><Input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Mínimo 12 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} disabled={isSubmitting} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff /> : <Eye />}</Button></div>
          <FieldDescription>Use 12 caracteres, maiúscula, minúscula, número e símbolo.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="confirmation">Confirmar senha</FieldLabel>
          <div className="relative"><Input id="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" placeholder="Repita sua senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={isSubmitting} className="pr-10" /><Button type="button" variant="ghost" size="icon" className="absolute top-1/2 right-1 -translate-y-1/2" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Ocultar confirmação" : "Mostrar confirmação"}>{showConfirmation ? <EyeOff /> : <Eye />}</Button></div>
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting || submitState === "success"} className="w-full">
            {isSubmitting
              ? AUTH_COPY.signup.submitting
              : submitState === "success"
                ? "Conta criada ✓"
                : submitState === "error"
                  ? "Tentar novamente"
                  : AUTH_COPY.signup.submit}
          </Button>
          {feedback && isError && (
            <span className="sr-only" role="alert">{feedback}</span>
          )}
        </Field>
        <FieldDescription className="text-center">{AUTH_COPY.signup.prompt}{" "}<Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">{AUTH_COPY.signup.action}</Link></FieldDescription>
      </FieldGroup>
    </form>
  )
}
