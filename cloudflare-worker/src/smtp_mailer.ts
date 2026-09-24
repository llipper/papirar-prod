import type { EmailTemplate } from "./email_templates"

export type SmtpConfig = { endpoint: string; internalKey: string }

/** Vercel owns the Hostinger SMTP connection because its hostname is Cloudflare-proxied. */
export async function sendSmtpEmail(config: SmtpConfig, recipient: string, template: EmailTemplate) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Papirar-Mail-Key": config.internalKey },
    body: JSON.stringify({ to: recipient, ...template }),
  })
  if (!response.ok) throw new Error(`Mailer HTTP ${response.status}`)
}
