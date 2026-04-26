import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const ALLOWED = ['status', 'email', 'phone', 'notes'] as const
  const update: Record<string, unknown> = {}
  for (const key of ALLOWED) { if (key in body) update[key] = body[key] }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  const { error } = await supabaseAdmin.from('leads').update(update).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
