import { NextRequest, NextResponse } from 'next/server'
import { getPortfolioClients, markAsPortfolio } from '@/lib/db/clients'

export async function GET() {
  try {
    const clients = await getPortfolioClients()
    return NextResponse.json(clients)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clientId, value } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    await markAsPortfolio(clientId, value !== false)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
