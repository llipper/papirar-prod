const brand = "Papirar"

export type EmailTemplate = {
  subject: string
  text: string
  html: string
}

export function welcomeVerificationEmail(name: string, actionLink: string): EmailTemplate {
  const firstName = safeName(name)
  return {
    subject: "Confirme seu e-mail e comece a estudar no Papirar",
    text: `Olá, ${firstName}!\n\nSeja bem-vindo ao Papirar. Confirme seu e-mail para proteger sua conta e começar seus estudos:\n${actionLink}\n\nSe você não criou esta conta, ignore esta mensagem.\n\nEquipe Papirar`,
    html: layout({
      preheader: "Confirme seu e-mail para começar a estudar no Papirar.",
      title: "Bem-vindo ao Papirar",
      greeting: `Olá, ${escapeHtml(firstName)}!`,
      paragraphs: [
        "Sua conta foi criada. Confirme seu endereço de e-mail para protegê-la e continuar seus estudos.",
      ],
      actionLabel: "Confirmar meu e-mail",
      actionLink,
      footnote: "Se você não criou esta conta, ignore esta mensagem.",
    }),
  }
}

export function welcomeEmail(name: string): EmailTemplate {
  const firstName = safeName(name)
  return {
    subject: "Bem-vindo ao Papirar",
    text: `Olá, ${firstName}!\n\nSeja bem-vindo ao Papirar. Sua conta está pronta para você estudar leis de forma clara e organizada.\n\nBons estudos!\n\nEquipe Papirar`,
    html: layout({
      preheader: "Sua conta Papirar está pronta para começar os estudos.",
      title: "Bem-vindo ao Papirar",
      greeting: `Olá, ${escapeHtml(firstName)}!`,
      paragraphs: [
        "Sua conta está pronta. No Papirar, você encontra leis organizadas para estudar no seu ritmo.",
        "Desejamos excelentes estudos.",
      ],
      footnote: "Você recebeu esta mensagem porque uma conta Papirar foi criada com este e-mail.",
    }),
  }
}

export function passwordResetEmail(name: string, actionLink: string): EmailTemplate {
  const firstName = safeName(name)
  return {
    subject: "Redefina sua senha do Papirar",
    text: `Olá, ${firstName}!\n\nRecebemos uma solicitação para redefinir a senha da sua conta Papirar. Use este link para criar uma nova senha:\n${actionLink}\n\nSe não foi você, ignore esta mensagem. Sua senha atual continuará válida.\n\nEquipe Papirar`,
    html: layout({
      preheader: "Use este link para redefinir sua senha do Papirar.",
      title: "Redefinição de senha",
      greeting: `Olá, ${escapeHtml(firstName)}!`,
      paragraphs: [
        "Recebemos uma solicitação para redefinir a senha da sua conta.",
        "Use o botão abaixo para criar uma nova senha.",
      ],
      actionLabel: "Redefinir minha senha",
      actionLink,
      footnote: "Se não foi você, ignore esta mensagem. Sua senha atual continuará válida.",
    }),
  }
}

function layout(input: {
  preheader: string
  title: string
  greeting: string
  paragraphs: string[]
  actionLabel?: string
  actionLink?: string
  footnote: string
}) {
  const paragraphs = input.paragraphs.map((paragraph) => `<p style="margin:0 0 16px;color:#2d2b31;font:16px/1.6 Arial,sans-serif">${escapeHtml(paragraph)}</p>`).join("")
  const action = input.actionLabel && input.actionLink ? `<p style="margin:28px 0"><a href="${escapeAttribute(input.actionLink)}" style="display:inline-block;background:#151419;color:#ffffff;padding:14px 20px;border-radius:8px;text-decoration:none;font:700 16px Arial,sans-serif">${escapeHtml(input.actionLabel)}</a></p>` : ""
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#f5f5f3"><span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(input.preheader)}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f3"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="padding:32px 36px 12px"><div style="font:700 24px/1 Arial,sans-serif;color:#151419">${brand}</div></td></tr><tr><td style="padding:20px 36px 36px"><h1 style="margin:0 0 20px;color:#151419;font:700 28px/1.2 Arial,sans-serif">${escapeHtml(input.title)}</h1><p style="margin:0 0 16px;color:#2d2b31;font:16px/1.6 Arial,sans-serif">${input.greeting}</p>${paragraphs}${action}<p style="margin:24px 0 0;color:#706d76;font:14px/1.5 Arial,sans-serif">${escapeHtml(input.footnote)}</p></td></tr></table><p style="margin:18px 0 0;color:#706d76;font:12px/1.5 Arial,sans-serif">© ${new Date().getFullYear()} Papirar</p></td></tr></table></body></html>`
}

function safeName(name: string) {
  return name.trim().split(/\s+/)[0] || ""
}

function escapeHtml(value: string) {
  return value.replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!)
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;")
}
