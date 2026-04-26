import { NextRequest, NextResponse } from 'next/server'
import {
  activateClient, markClientPaid, updateClientStatus, updateClientMeta,
  deleteClient, markAsInternal, renewClient, markAsPortfolio,
} from '@/lib/db/clients'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()

    if (body.action === 'activate')          await activateClient(id)
    else if (body.action === 'mark_paid')    await markClientPaid(id, body.plan ?? 'basic', body.annual_amount)
    else if (body.action === 'mark_internal')   await markAsInternal(id, true)
    else if (body.action === 'unmark_internal') await markAsInternal(id, false)
    else if (body.action === 'mark_portfolio')   await markAsPortfolio(id, true)
    else if (body.action === 'unmark_portfolio') await markAsPortfolio(id, false)
    else if (body.action === 'renew')        await renewClient(id)
    else if (body.status)                    await updateClientStatus(id, body.status)
    else {
      // Metadata update: phone, whatsapp, email, notes
      const { phone, whatsapp, email, notes } = body
      await updateClientMeta(id, { phone, whatsapp, email, notes })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteClient(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
