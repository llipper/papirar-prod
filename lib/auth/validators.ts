import { AUTH_RULES } from "./constants"

const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i
const blockedPasswords = new Set([
  "password",
  "password123",
  "senha",
  "senha123",
  "admin123",
  "qwerty123",
  "12345678",
  "123456789",
  "papirar123",
])

function hasControlCharacters(value: string) {
  return /[\u0000-\u001F\u007F]/.test(value)
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

export function validateName(value: string) {
  const name = value.trim()
  if (!name) return "Informe seu nome."
  if (name.length < 3) return "Use pelo menos 3 caracteres."
  if (name.length > AUTH_RULES.maximumNameLength) return "Use no máximo 80 caracteres."
  if (hasControlCharacters(name) || /https?:\/\/|www\.|@/i.test(name)) {
    return "Use apenas seu nome."
  }
  return undefined
}

export function validateEmail(value: string) {
  const email = normalizeEmail(value)
  if (!email) return "Informe seu e-mail."
  if (email.length > 254 || hasControlCharacters(email) || email.includes("..")) {
    return "Informe um e-mail válido."
  }
  if (!emailPattern.test(email)) return "Informe um e-mail válido."
  return undefined
}

export function validateLoginPassword(value: string) {
  if (!value) return "Informe sua senha."
  if (hasControlCharacters(value)) return "Senha inválida."
  return undefined
}

export function validateStrongPassword(value: string, email: string) {
  if (!value) return "Crie uma senha."
  if (value.length < AUTH_RULES.minimumPasswordLength) return "Use pelo menos 12 caracteres."
  if (value.length > AUTH_RULES.maximumPasswordLength) return "Use no máximo 128 caracteres."
  if (hasControlCharacters(value)) return "Remova caracteres inválidos."
  if (value.includes(" ")) return "Não use espaços na senha."

  const lower = value.toLowerCase()
  const emailUser = normalizeEmail(email).split("@")[0]
  if (blockedPasswords.has(lower)) return "Escolha uma senha mais forte."
  if (emailUser.length >= 3 && lower.includes(emailUser)) {
    return "Não use parte do e-mail na senha."
  }
  if (!/[a-z]/.test(value)) return "Inclua uma letra minúscula."
  if (!/[A-Z]/.test(value)) return "Inclua uma letra maiúscula."
  if (!/[0-9]/.test(value)) return "Inclua um número."
  if (!/[^A-Za-z0-9]/.test(value)) return "Inclua um símbolo."
  if (/(.)\1{3,}/.test(value)) return "Evite caracteres repetidos em sequência."
  return undefined
}

export function validatePasswordConfirmation(value: string, password: string) {
  if (!value) return "Confirme sua senha."
  if (value !== password) return "As senhas não conferem."
  return undefined
}
