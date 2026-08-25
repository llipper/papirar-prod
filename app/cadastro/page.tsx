import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { SignupForm } from "@/components/signup-form"
import { AUTH_COPY } from "@/lib/auth/constants"

export default function CadastroPage() {
  return (
    <AuthPageShell
      title={AUTH_COPY.signup.title}
      description={AUTH_COPY.signup.description}
    >
      <SignupForm />
    </AuthPageShell>
  )
}
