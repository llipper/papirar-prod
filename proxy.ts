import { NextRequest, NextResponse } from "next/server"
import { classifyRequest, extractRealIp } from "@/lib/security/threat-detector"

// Rotas que o middleware nunca deve interceptar
const BYPASS_PREFIXES = [
  "/_next/",
  "/_s/",
  "/favicon",
  "/apple-icon",
  "/icon",
  "/manifest",
  "/robots",
  "/sitemap",
  "/__/",
]

// Domínio canônico para onde o tráfego fora dos hosts permitidos é redirecionado
const CANONICAL_HOST = "www.papirar.com"

// Hosts que podem servir a aplicação sem redirecionamento.
// Inclua aqui domínios próprios adicionais se necessário.
const ALLOWED_HOSTS = new Set([
  CANONICAL_HOST,
  "papirar.com",
  "auth.papirar.com",
  "localhost",
])


function generateRequestId(): string {
  return crypto.randomUUID()
}

function generateNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64")
}

function contentSecurityPolicy(nonce: string): string {
  const isDevelopment = process.env.NODE_ENV !== "production"
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""} https://apis.google.com https://www.gstatic.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
    "font-src 'self' data:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.workers.dev",
    "media-src 'self' blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.workers.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://auth.papirar.com",
    "frame-ancestors 'none'",
  ].join("; ")
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Ignora assets internos do Next.js
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Enforcement de domínio canônico ──────────────────────────────────────
  // Redireciona para www.papirar.com qualquer acesso via URL de preview da
  // Vercel (*.vercel.app) ou qualquer host não listado em ALLOWED_HOSTS.
  // Isso impede que o deployment direto da Vercel seja acessível publicamente.
  const host = (req.headers.get("host") ?? "").split(":")[0] // remove porta
  if (!ALLOWED_HOSTS.has(host)) {
    const canonical = new URL(req.url)
    canonical.host = CANONICAL_HOST
    canonical.port = ""
    canonical.protocol = "https:"
    return NextResponse.redirect(canonical, { status: 301 })
  }

  const requestId = generateRequestId()
  const userAgent = req.headers.get("user-agent")
  const threat = classifyRequest(pathname, userAgent)

  // ── Bloquear / capturar ameaças ──────────────────────────────────────────
  if (threat.type !== "safe") {
    const ip = extractRealIp(req.headers)
    const country =
      req.headers.get("cf-ipcountry") ??
      req.headers.get("x-vercel-ip-country") ??
      "??"

    // Log estruturado — capturado automaticamente pela Vercel / Cloudflare
    console.warn(
      JSON.stringify({
        level: "SECURITY",
        event: threat.type,
        reason: threat.reason,
        ip,
        country,
        path: pathname,
        method: req.method,
        userAgent,
        requestId,
        timestamp: new Date().toISOString(),
      })
    )

    // Para scanners e honeypots: retorna 404 genérico que não revela stack
    if (threat.type === "honeypot" || threat.type === "scanner" || threat.type === "probe") {
      return new NextResponse("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
          // Headers genéricos — não revelam Next.js
          "X-Request-Id": requestId,
        },
      })
    }
  }

  // ── Resposta normal com headers de segurança ─────────────────────────────
  const nonce = generateNonce()
  const csp = contentSecurityPolicy(nonce)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-nonce", nonce)
  requestHeaders.set("Content-Security-Policy", csp)

  const response = NextResponse.next({ request: { headers: requestHeaders } })

  // Remove / falsifica headers que revelam tecnologia
  response.headers.delete("X-Powered-By")
  response.headers.delete("Server")

  // Headers de segurança adicionais
  response.headers.set("X-Request-Id", requestId)
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-DNS-Prefetch-Control", "off")
  response.headers.set("Content-Security-Policy", csp)

  return response
}

export const config = {
  // Aplica o middleware a todas as rotas exceto arquivos estáticos
  matcher: [
    "/((?!_next/static|_next/image|_s/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|otf)).*)",
  ],
}
