import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminJwt } from '@/lib/auth'
import { updateAdminUser } from '@/lib/db/users'
import type { AdminRole } from '@/types'

async function requireSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  const payload = await verifyAdminJwt(token)
  if (!payload || payload.role !== 'superadmin') return null
  return payload
}

// PATCH /api/users/[id] — update user (superadmin only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await requireSuperAdmin(req)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  // Prevent demoting yourself
  if (id === me.sub && body.role && body.role !== 'superadmin') {
    return NextResponse.json({ error: 'No puedes cambiar tu propio rol' }, { status: 400 })
  }
  if (id === me.sub && body.is_active === false) {
    return NextResponse.json({ error: 'No puedes desactivarte a ti mismo' }, { status: 400 })
  }

  const allowed: Record<string, unknown> = {}
  if (body.name)      allowed.name = body.name
  if (body.email)     allowed.email = body.email
  if (body.password)  allowed.password = body.password
  if (body.role)      allowed.role = body.role as AdminRole
  if (body.is_active !== undefined) allowed.is_active = body.is_active

  const user = await updateAdminUser(id, allowed)
  return NextResponse.json(user)
}
