import { NextRequest, NextResponse } from 'next/server'
import { getClients } from '@/lib/db/clients'

export async function GET() {
  try {
    const clients = await getClients()
    return NextResponse.json(clients)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
