"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
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
  createAccount,
  signInWithGoogle,
} from "@/lib/auth/auth-service"
import {
  normalizeEmail,
  validateEmail,
  validateStrongPassword,
} from "@/lib/auth/validators"

export function SignupForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string>()
  const [isError, setIsError] = useState(false)

  async function handleGoogleSignIn() {
    setIsSubmitting(true)
    setFeedback(undefined)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
      window.location.assign("/dashboard")
    } catch (error) {
      setIsError(true)
      setFeedback(authErrorMessage(error, "Não foi possível entrar com Google."))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!acceptedTerms) {
      setIsError(true)
      setFeedback("Você precisa aceitar os Termos de Uso e a Política de Privacidade.")
      return
    }

    const normalizedEmail = normalizeEmail(email)
    const validationError =
      validateEmail(normalizedEmail) ??
      validateStrongPassword(password, normalizedEmail)

    if (validationError) {
      setIsError(true)
      setFeedback(validationError)
      return
    }

    setIsSubmitting(true)
    setIsError(false)
    setFeedback(undefined)

    try {
      const defaultName = normalizedEmail.split("@")[0] || "Estudante"
      const response = await createAccount(
        defaultName,
        normalizedEmail,
        password,
      )

      if (response.error) {
        throw response.error
      }

      setIsError(false)
      setFeedback("Conta criada com sucesso! Redirecionando...")
      window.location.assign("/dashboard")
    } catch (error) {
      setIsError(true)
      setFeedback(
        authErrorMessage(
          error,
          "Não foi possível criar a conta com esses dados.",
        ),
      )
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
              <Image
                src="/logo.svg"
                alt="Papirar"
                width={44}
                height={44}
                priority
                className="h-11 w-11 object-contain dark:invert"
              />
            </Link>

            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Crie sua conta
            </h1>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Comece agora e organize seus estudos no Papirar.
            </p>

            <FieldDescription className="mt-2 text-center">
              Já possui uma conta?{" "}
              <Link
                href="/login"
                className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
              >
                Entrar
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
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha forte"
                autoComplete="new-password"
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
            <FieldDescription className="text-xs">
              Mínimo 12 caracteres, incluindo letras, números e símbolos.
            </FieldDescription>
          </Field>

          {/* Termos Checkbox */}
          <label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1 size-3.5 shrink-0 accent-foreground cursor-pointer"
              required
              disabled={isSubmitting}
            />
            <span>
              Concordo com os{" "}
              <Link href="/termos" className="text-foreground underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e reconheço a{" "}
              <Link href="/privacidade" className="text-foreground underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>

          {/* Criar Conta */}
          <Field className="pt-1">
            <Button
              type="submit"
              disabled={isSubmitting || !acceptedTerms}
              className="h-10 w-full font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Criando conta..." : "Criar conta"}
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
                <g clipPath="url(#clip0_95_488_signup)">
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
                  <clipPath id="clip0_95_488_signup">
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
    </div>
  )
}