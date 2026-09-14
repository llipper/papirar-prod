import { NextResponse } from "next/server"

const workerUrl = (
  process.env.CLOUDFLARE_API_URL ??
  "https://papirar-api.papirar-api-worker.workers.dev"
).replace(/\/$/, "")

const allowedPaths = new Set([
  "subscription",
  "entitlements",
  "mercado-pago/checkout",
  "mercado-pago/cancel",
])

type RouteContext = { params: Promise<{ path: string[] }> }

export async function GET(request: Request, context: RouteContext) {
  return proxyBillingRequest(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return proxyBillingRequest(request, context)
}

async function proxyBillingRequest(request: Request, context: RouteContext) {
  const { path } = await context.params
  const endpoint = path.join("/")
  if (!allowedPaths.has(endpoint)) {
    return NextResponse.json({ error: "Rota não encontrada." }, { status: 404 })
  }

  const authorization = request.headers.get("authorization")
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 })
  }

  try {
    const requestUrl = new URL(request.url)
    const upstream = await fetch(`${workerUrl}/billing/${endpoint}${requestUrl.search}`, {
      method: request.method,
      headers: {
        Authorization: authorization,
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type")! }
          : {}),
      },
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    })
    const body = await upstream.arrayBuffer()
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Não foi possível comunicar com o serviço de pagamento." },
      { status: 502 },
    )
  }
}
