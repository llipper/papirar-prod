import { timingSafeEqual } from "node:crypto"

import nodemailer from "nodemailer"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

type MailRequest = { to?: unknown; subject?: unknown; text?: unknown; html?: unknown }
type ValidMail = { to: string; subject: string; text: string; html: string }

export async function POST(request: Request) {
  if (!hasValidInternalKey(request.headers.get("x-papirar-mail-key"))) return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  const body = await request.json().catch(() => null) as MailRequest | null
  if (!isValidMail(body)) return NextResponse.json({ error: "Mensagem inválida." }, { status: 422 })
  try {
    const username = requiredEnv("HOSTINGER_SMTP_USER")
    const transport = nodemailer.createTransport({ host: "smtp.hostinger.com", port: 465, secure: true, auth: { user: username, pass: requiredEnv("HOSTINGER_SMTP_PASSWORD") } })
    await transport.sendMail({ from: `Papirar <${username}>`, to: body.to, subject: body.subject, text: body.text, html: body.html })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Papirar][Mailer] delivery failed", error instanceof Error ? error.message : "UnknownError")
    return NextResponse.json({ error: "Não foi possível enviar o e-mail." }, { status: 502 })
  }
}

function hasValidInternalKey(value: string | null) {
  const expected = process.env.MAILER_INTERNAL_SECRET
  if (!value || !expected) return false
  const supplied = Buffer.from(value), configured = Buffer.from(expected)
  return supplied.length === configured.length && timingSafeEqual(supplied, configured)
}

function isValidMail(value: MailRequest | null): value is ValidMail {
  return Boolean(value && typeof value.to === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.to) && typeof value.subject === "string" && value.subject.length > 0 && value.subject.length <= 200 && typeof value.text === "string" && value.text.length > 0 && value.text.length <= 100_000 && typeof value.html === "string" && value.html.length > 0 && value.html.length <= 300_000)
}

function requiredEnv(name: "HOSTINGER_SMTP_USER" | "HOSTINGER_SMTP_PASSWORD") {
  const value = process.env[name]
  if (!value) throw new Error(`${name} ausente.`)
  return value
}
