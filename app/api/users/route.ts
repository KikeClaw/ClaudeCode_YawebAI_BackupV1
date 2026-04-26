import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminJwt } from '@/lib/auth'
import { listAdminUsers, createAdminUser, getAdminUserStats } from '@/lib/db/users'
import type { AdminRole } from '@/types'

async function requireSuperAdmin(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  const payload = await verifyAdminJwt(token)
  if (!payload || payload.role !== 'superadmin') return null
  return payload
}

// GET /api/users — list all admin users (superadmin only)
export async function GET(req: NextRequest) {
  const me = await requireSuperAdmin(req)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = await listAdminUsers()

  // Attach stats per user
  const withStats = await Promise.all(
    users.map(async u => {
      const stats = await getAdminUserStats(u.id)
      return { ...u, ...stats }
    })
  )

  return NextResponse.json(withStats)
}

// POST /api/users — create a new admin user (superadmin only)
export async function POST(req: NextRequest) {
  const me = await requireSuperAdmin(req)
  if (!me) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { name, email, password, role } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son obligatorios' }, { status: 400 })
  }
  if (!['superadmin', 'comercial'].includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  try {
    const user = await createAdminUser({ name, email, password, role: role as AdminRole })
    return NextResponse.json(user, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
