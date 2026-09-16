import { NextRequest, NextResponse } from "next/server"
import { buildLogPayload, classifyRequest } from "@/lib/security/threat-detector"

/**
 * POST /api/security/log
 * Endpoint interno de log de eventos de segurança.
 * Chamado pelo middleware ou por componentes server-side.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log estruturado capturado pela Vercel/Cloudflare observability
    console.warn(JSON.stringify({ level: "SECURITY", ...body }))

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

/**
 * GET /api/security/log
 * Rota honeypot: qualquer GET aqui já é suspeito — nenhum usuário legítimo
 * chama esse endpoint diretamente. Loga e retorna 404 genérico.
 */
export async function GET(req: NextRequest) {
  const requestId = Math.random().toString(36).slice(2, 11)
  const { pathname } = new URL(req.url)
  const threat = classifyRequest(pathname, req.headers.get("user-agent"))
  const payload = buildLogPayload(req as unknown as Request, threat, requestId)

  console.warn(JSON.stringify({ level: "SECURITY", ...payload, event: "probe" }))

  return new NextResponse("Not Found", { status: 404 })
}
