"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { ThemeLogo } from "@/components/brand/theme-logo"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

export function LoginForm({ className }: { className?: string }) {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)
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
      setFeedback(validationError)
      return
    }
    setIsSubmitting(true)
    setFeedback(undefined)
    try {
      const { error } = await signInWithEmail(normalizeEmail(email), password)
      if (error) throw error
      setIsError(false)
      window.location.assign(next)
    } catch (error) {
      setIsError(true)
      setFeedback(authErrorMessage(error, "Não foi possível entrar agora."))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-7", className)}>
      <form onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
        <FieldGroup className="gap-5">
          {/* Header */}
          <div className="mb-2 flex flex-col items-center text-center">
            <Link href="/" className="mb-5 transition-transform hover:scale-105 active:scale-95">
              <ThemeLogo size={44} className="size-11" />
            </Link>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Bem-vindo de volta
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Entre na sua conta para continuar seus estudos.
            </p>

            <FieldDescription className="mt-2 text-center">
              Ainda não tem uma conta?{" "}
              <Link
                href="/cadastro"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
              >
                Cadastre-se
              </Link>
            </FieldDescription>
          </div>

          {/* E-mail */}
          <Field>
            <FieldLabel htmlFor="email">E-mail</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10"
              disabled={isSubmitting}
            />
          </Field>

          {/* Senha */}
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Link
                href="/recuperar-senha"
                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 pr-10"
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute top-0 right-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </Field>

          {/* Entrar */}
          <Field className="pt-1">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full font-medium transition-all duration-200"
            >
              {isSubmitting ? "Entrando..." : "Entrar"}
            </Button>
          </Field>

          {feedback && (
            <p role="alert" className={cn("text-center text-sm", isError ? "text-destructive" : "text-muted-foreground")}>
              {feedback}
            </p>
          )}

          <FieldSeparator className="my-1 [&_[data-slot=field-separator-content]]:rounded-full">
            ou continue com
          </FieldSeparator>

          {/* Social */}
          <Field>
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="h-10 w-full gap-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Google</title>
                <g clipPath="url(#clip0_95_488_login)">
                  <path
                    d="M24.2663 12.7764C24.2663 11.9607 24.2001 11.1406 24.059 10.3381H12.7402V14.9591H19.222C18.953 16.4494 18.0888 17.7678 16.8233 18.6056V21.6039H20.6903C22.9611 19.5139 24.2663 16.4274 24.2663 12.7764Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12.7401 24.5008C15.9766 24.5008 18.7059 23.4382 20.6945 21.6039L16.8276 18.6055C15.7517 19.3375 14.3627 19.752 12.7445 19.752C9.61388 19.752 6.95946 17.6399 6.00705 14.8003H2.0166V17.8912C4.05371 21.9434 8.2029 24.5008 12.7401 24.5008Z"
                    fill="#34A853"
                  />
                  <path
                    d="M6.00277 14.8003C5.50011 13.3099 5.50011 11.6961 6.00277 10.2057V7.11481H2.01674C0.314734 10.5056 0.314734 14.5004 2.01674 17.8912L6.00277 14.8003Z"
                    fill="#FBBC04"
                  />
                  <path
                    d="M12.7401 5.24966C14.4509 5.2232 16.1044 5.86697 17.3434 7.04867L20.7695 3.62262C18.6001 1.5855 15.7208 0.465534 12.7401 0.500809C8.2029 0.500809 4.05371 3.05822 2.0166 7.11481L6.00264 10.2058C6.95064 7.36173 9.60947 5.24966 12.7401 5.24966Z"
                    fill="#EA4335"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_95_488_login">
                    <rect
                      width="24"
                      height="24"
                      fill="white"
                      transform="translate(0.5 0.5)"
                    />
                  </clipPath>
                </defs>
              </svg>
              Google
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Termos */}
      <FieldDescription className="px-4 text-center text-xs leading-5">
        Ao continuar, você concorda com os{" "}
        <Link
          href="/termos"
          className="text-foreground underline underline-offset-4"
        >
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link
          href="/privacidade"
          className="text-foreground underline underline-offset-4"
        >
          Política de Privacidade
        </Link>
        .
      </FieldDescription>
    </div>
  )
}

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard"
}
