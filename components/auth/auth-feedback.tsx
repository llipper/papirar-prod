import { CheckCircle2, CircleAlert } from "lucide-react"

type AuthFeedbackProps = {
  message?: string
  tone: "error" | "success"
}

export function AuthFeedback({ message, tone }: AuthFeedbackProps) {
  if (!message) return null

  const isSuccess = tone === "success"

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
      className={
        isSuccess
          ? "flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
          : "flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
      }
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  )
}
