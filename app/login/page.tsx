import { LoginForm } from "@/components/login-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { AUTH_COPY } from "@/lib/auth/constants"

export default function LoginPage() {
  return (
    <AuthPageShell title={AUTH_COPY.login.title} description={AUTH_COPY.login.description}>
      <LoginForm />
    </AuthPageShell>
  )
}
