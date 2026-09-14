"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { AUTH_COPY } from "@/lib/auth/constants"
import {
  authErrorMessage,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/auth/auth-service"
import {
  normalizeEmail,
  validateEmail,
  validateLoginPassword,
} from "@/lib/auth/validators"

export function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle")
  const next = safeNext(searchParams.get("next"))

  async function handleGoogleSignIn() {
    setIsSubmitting(true)
    setFeedback(undefined)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      window.location.assign(next)
    } catch (error) {
      setIsError(true)
      setFeedback(authErrorMessage(error, "Não foi possível entrar com Google."))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError =
      validateEmail(email) ?? validateLoginPassword(password)
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
      const { error } = await signInWithEmail(normalizeEmail(email), password)
      if (error) throw error
      setIsError(false)
      setSubmitState("success")
      setFeedback("Login realizado com sucesso. Redirecionando...")
      window.setTimeout(() => window.location.assign(next), 700)
    } catch (error) {
      setIsError(true)
      setSubmitState("error")
      setFeedback(authErrorMessage(error, "Não foi possível entrar agora."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <Button
            type="button"
            variant="outline"
            className="h-[52px] w-full gap-[10px] rounded-[18px]"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
          >
            <span className="font-heading text-[18px] leading-none font-black">G</span>
            <span className="font-heading text-sm leading-none font-extrabold">
              {AUTH_COPY.login.google}
            </span>
          </Button>
        </Field>
        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
          />
        </Field>
        <Field>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <Link
              href="/recuperar-senha"
              className="text-xs underline-offset-4 hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 -translate-y-1/2"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </Field>
        <Field>
          <Button type="submit" disabled={isSubmitting || submitState === "success"} className="w-full">
            {isSubmitting
              ? AUTH_COPY.login.submitting
              : submitState === "success"
                ? "Login realizado ✓"
                : submitState === "error"
                  ? "Tentar novamente"
                  : AUTH_COPY.login.submit}
          </Button>
          {feedback && isError && (
            <span className="sr-only" role="alert">{feedback}</span>
          )}
        </Field>
        <FieldDescription className="text-center">
          {AUTH_COPY.login.prompt}{" "}
          <Link
            href="/cadastro"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {AUTH_COPY.login.action}
          </Link>
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
}
