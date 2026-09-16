import { LoginForm } from "@/components/login-form"
import { AuthPageShell } from "@/components/auth/auth-page-shell"

export default function LoginPage() {
  return (
    <AuthPageShell>
      <LoginForm />
    </AuthPageShell>
  )
}
