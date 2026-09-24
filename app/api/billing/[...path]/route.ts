import { NextResponse } from "next/server"

// This is a public Worker origin, not a secret. Keeping a single canonical
// endpoint prevents a stale Vercel environment variable from sending billing
// calls to a retired API deployment.
const workerUrl = "https://papirar-api.papirar-api-worker.workers.dev"

const allowedPaths = new Set([
  "subscription",
  "entitlements",
  "trial/redeem",
  "mercado-pago/checkout",
  "mercado-pago/subscribe",
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
    return NextResponse.json(
      { error: "Autenticação necessária." },
      { status: 401 }
    )
  }

  try {
    const requestUrl = new URL(request.url)
    const upstreamUrl = `${workerUrl}/billing/${endpoint}${requestUrl.search}`
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        Authorization: authorization,
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type")! }
          : {}),
      },
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
    })
    const body = await upstream.text()
    console.info("[billing-proxy] upstream response", {
      endpoint,
      status: upstream.status,
    })
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ??
          "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[billing-proxy] upstream request failed", {
      endpoint,
      error: error instanceof Error ? error.message : "UnknownError",
    })
    return NextResponse.json(
      { error: "Não foi possível comunicar com o serviço de pagamento." },
      { status: 502 }
    )
  }
}
