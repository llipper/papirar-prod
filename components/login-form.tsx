"use client"

import Link from "next/link"
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
import { authErrorMessage, signInWithEmail } from "@/lib/auth/auth-service"
import {
  normalizeEmail,
  validateEmail,
  validateLoginPassword,
} from "@/lib/auth/validators"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError =
      validateEmail(email) ?? validateLoginPassword(password)
    if (validationError) {
      setIsError(true)
      setFeedback(validationError)
      return
    }
    setIsSubmitting(true)
    setFeedback(undefined)
    try {
      const { error } = await signInWithEmail(normalizeEmail(email), password)
      if (error) throw error
      window.location.assign("/dashboard")
    } catch (error) {
      setIsError(true)
      setFeedback(authErrorMessage(error, "Não foi possível entrar agora."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        {feedback && (
          <div
            role="alert"
            className={
              isError
                ? "text-sm text-destructive"
                : "text-sm text-muted-foreground"
            }
          >
            {feedback}
          </div>
        )}
        <Field>
          <Button
            type="button"
            variant="outline"
            className="h-[52px] w-full gap-[10px] rounded-[18px]"
            onClick={() => {
              setIsError(true)
              setFeedback(AUTH_COPY.login.googleUnavailable)
            }}
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
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? AUTH_COPY.login.submitting : AUTH_COPY.login.submit}
          </Button>
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
