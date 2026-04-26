import { NextRequest, NextResponse } from 'next/server'
import { signAdminJwt } from '@/lib/auth'
import { verifyAdminPassword } from '@/lib/db/users'

// ── Cookie helper ─────────────────────────────────────────────────────────────
function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set('admin_auth', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

// ── POST /api/auth — login ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const user = await verifyAdminPassword(email, password)
    if (!user) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
    }

    const token = await signAdminJwt({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    })

    const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, role: user.role } })
    setAuthCookie(res, token)
    return res
  } catch (err) {
    console.error('[auth] login error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// ── DELETE /api/auth — logout ─────────────────────────────────────────────────
export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('admin_auth')
  return res
}
