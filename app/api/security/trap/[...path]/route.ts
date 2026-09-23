import { NextRequest, NextResponse } from "next/server"
import { buildLogPayload, classifyRequest } from "@/lib/security/threat-detector"

async function handleTrap(req: NextRequest) {
  const requestId = crypto.randomUUID()
  const url = new URL(req.url)
  const threat = classifyRequest(url.pathname, req.headers.get("user-agent"))
  const payload = buildLogPayload(req as unknown as Request, { ...threat, type: "honeypot" }, requestId)

  console.warn(JSON.stringify({ level: "SECURITY", ...payload }))

  return new NextResponse("Not Found", {
    status: 404,
    headers: { "Content-Type": "text/plain", "X-Request-Id": requestId },
  })
}

export const GET = handleTrap
export const POST = handleTrap
export const PUT = handleTrap
export const DELETE = handleTrap
export const PATCH = handleTrap
export const HEAD = handleTrap
