/**
 * threat-detector.ts
 * Lógica central de detecção de ameaças compartilhada entre
 * middleware e API routes de segurança.
 */

// ─── User-Agents de scanners / ferramentas de reconhecimento ───────────────
export const SCANNER_USER_AGENTS: RegExp[] = [
  /wappalyzer/i,
  /shodan/i,
  /nuclei/i,
  /nmap/i,
  /masscan/i,
  /zgrab/i,
  /nikto/i,
  /sqlmap/i,
  /dirbuster/i,
  /gobuster/i,
  /ffuf/i,
  /feroxbuster/i,
  /hydra/i,
  /burpsuite/i,
  /owasp/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /metasploit/i,
  /python-requests\/[0-9]/i,
  /go-http-client/i,
  /wget\//i,
  /scrapy/i,
  /libwww-perl/i,
]

// ─── Caminhos honeypot — jamais acessados por usuários legítimos ────────────
export const HONEYPOT_PATHS: RegExp[] = [
  /\/wp-admin/i,
  /\/wp-login\.php/i,
  /\/wp-content/i,
  /\/wp-includes/i,
  /\/xmlrpc\.php/i,
  /\/wp-json/i,
  /\/\.env/i,
  /\/\.git\//i,
  /\/\.htaccess/i,
  /\/\.bash_history/i,
  /\/\.ssh\//i,
  /\/config\.json/i,
  /\/config\.yml/i,
  /\/config\.yaml/i,
  /\/database\.yml/i,
  /\/settings\.py/i,
  // A isca é somente /admin. Não bloquear /dashboard/administracao,
  // que é a área administrativa real do produto.
  /^\/admin(?:\/|$)/i,
  /\/phpmyadmin/i,
  /\/pma\//i,
  /\/manager\/html/i,
  /\/adminer/i,
  /\/cpanel/i,
  /\/webmail/i,
  /\/graphql$/i,
  /\/actuator/i,
  /\/console/i,
  /\/jolokia/i,
  /\.(php|asp|aspx|jsp|cgi|pl|cfm)$/i,
  /shell\.php/i,
  /c99\.php/i,
  /\/server-status/i,
  /\/phpinfo/i,
  /\/backup/i,
]

export type ThreatType = "safe" | "scanner" | "honeypot" | "probe"

export interface ThreatInfo {
  type: ThreatType
  reason?: string
}

export function classifyRequest(
  pathname: string,
  userAgent: string | null
): ThreatInfo {
  if (userAgent) {
    for (const pattern of SCANNER_USER_AGENTS) {
      if (pattern.test(userAgent)) {
        return { type: "scanner", reason: `UA: ${pattern}` }
      }
    }
  }

  for (const pattern of HONEYPOT_PATHS) {
    if (pattern.test(pathname)) {
      return { type: "honeypot", reason: `Path: ${pattern}` }
    }
  }

  if (
    pathname.includes("../") ||
    pathname.includes("%2e%2e") ||
    pathname.includes("select%20") ||
    pathname.includes("union%20") ||
    pathname.includes("<script")
  ) {
    return { type: "probe", reason: "Injection/traversal attempt" }
  }

  return { type: "safe" }
}

export function extractRealIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  )
}

export interface SecurityLogPayload {
  event: ThreatType
  ip: string
  userAgent: string | null
  path: string
  method: string
  country: string | null
  reason?: string
  timestamp: string
  requestId: string
}

export function buildLogPayload(
  req: Request,
  threat: ThreatInfo,
  requestId: string
): SecurityLogPayload {
  const url = new URL(req.url)
  const headers = req.headers
  return {
    event: threat.type,
    ip: extractRealIp(headers),
    userAgent: headers.get("user-agent"),
    path: url.pathname + url.search,
    method: req.method,
    country: headers.get("cf-ipcountry") ?? headers.get("x-vercel-ip-country"),
    reason: threat.reason,
    timestamp: new Date().toISOString(),
    requestId,
  }
}
