import { NextRequest, NextResponse } from 'next/server'
import { restoreSiteVersion } from '@/lib/db/clients'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { version_id } = body

    if (!version_id) {
      return NextResponse.json({ error: 'version_id requerido' }, { status: 400 })
    }

    await restoreSiteVersion(id, version_id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
