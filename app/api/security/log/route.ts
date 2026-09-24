import { NextResponse } from "next/server"

/**
 * POST /api/security/log
 * Endpoint interno de log de eventos de segurança.
 * Chamado pelo middleware ou por componentes server-side.
 */
export async function POST() {
  return new NextResponse("Not Found", { status: 404 })
}

/**
 * GET /api/security/log
 * Rota honeypot: qualquer GET aqui já é suspeito — nenhum usuário legítimo
 * chama esse endpoint diretamente. Loga e retorna 404 genérico.
 */
export async function GET() {
  return new NextResponse("Not Found", { status: 404 })
}
