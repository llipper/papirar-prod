export const AUTH_COPY = {
  brand: "papirar",
  brandMark: "P",
  login: {
    title: "Entrar no Papirar",
    description: "Acesse sua leitura, progresso e revisões com áudio.",
    submit: "Entrar",
    submitting: "Entrando...",
    prompt: "Ainda não tem conta?",
    action: "Criar conta",
    google: "Entrar com Google",
    googleUnavailable: "Google Auth ainda precisa ser conectado no backend.",
  },
  signup: {
    title: "Criar conta",
    description:
      "Proteja seu progresso e continue estudando em qualquer lugar.",
    submit: "Criar conta",
    submitting: "Criando...",
    prompt: "Já tem conta?",
    action: "Entrar",
  },
} as const

export const AUTH_RULES = {
  minimumPasswordLength: 12,
  maximumPasswordLength: 128,
  maximumNameLength: 80,
} as const
