import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminJwt } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_auth')?.value ?? ''
  const payload = await verifyAdminJwt(token)
  if (!payload) return NextResponse.json({ user: null })
  return NextResponse.json({
    user: { id: payload.sub, name: payload.name, email: payload.email, role: payload.role },
  })
}
