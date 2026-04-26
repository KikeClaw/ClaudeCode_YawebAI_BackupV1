import { NextRequest, NextResponse } from 'next/server'
import { countAdminUsers, createAdminUser } from '@/lib/db/users'

// POST /api/users/seed
// Creates the first superadmin. Only works when NO admin users exist yet.
// Requires the current ADMIN_PASSWORD as authorization.
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, admin_password } = await req.json()

    // Guard: only allowed if no users exist yet
    const count = await countAdminUsers()
    if (count > 0) {
      return NextResponse.json({ error: 'Ya existe al menos un usuario admin. Usa el panel para crear más.' }, { status: 403 })
    }

    // Require current ADMIN_PASSWORD to prevent unauthorized bootstrap
    if (!admin_password || admin_password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Contraseña de sistema incorrecta' }, { status: 401 })
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'name, email y password son obligatorios' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener mínimo 8 caracteres' }, { status: 400 })
    }

    const user = await createAdminUser({ name, email, password, role: 'superadmin' })
    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
