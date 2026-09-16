import { AuthPageShell } from "@/components/auth/auth-page-shell"
import { SignupForm } from "@/components/signup-form"

export default function CadastroPage() {
  return (
    <AuthPageShell>
      <SignupForm />
    </AuthPageShell>
  )
}
