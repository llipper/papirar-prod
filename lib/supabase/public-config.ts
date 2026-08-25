type SupabasePublicConfig = {
  url: string
  publicKey: string
}

function isServiceRoleKey(value: string) {
  if (!value.startsWith("eyJ")) return false
  try {
    const payload = value.split(".")[1]
    if (!payload) return false
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    ) as { role?: string }
    return decoded.role === "service_role"
  } catch {
    return false
  }
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !publicKey) {
    throw new Error("Supabase não configurado.")
  }
  if (isServiceRoleKey(publicKey)) {
    throw new Error("Configuração insegura: a chave service_role não pode ser pública.")
  }

  return { url: url.replace(/\/$/, ""), publicKey }
}
