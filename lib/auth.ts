import { SignJWT, jwtVerify } from 'jose'
import type { AdminRole } from '@/types'

export interface AdminJwtPayload {
  sub: string        // admin_user.id
  role: AdminRole
  name: string
  email: string
}

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET env var is not set')
  return new TextEncoder().encode(s)
}

export async function signAdminJwt(payload: AdminJwtPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

export async function verifyAdminJwt(token: string): Promise<AdminJwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || !payload.role) return null
    return {
      sub:   payload.sub as string,
      role:  payload.role as AdminRole,
      name:  payload.name as string,
      email: payload.email as string,
    }
  } catch {
    return null
  }
}

// ── Legacy HMAC verifier (backward compat during migration) ──────────────────
const HMAC_PAYLOAD = 'admin_v1'

export async function verifyLegacyHmac(token: string): Promise<boolean> {
  const password = process.env.ADMIN_PASSWORD
  if (!token || !password) return false
  try {
    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(password),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(HMAC_PAYLOAD))
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return token === expected
  } catch {
    return false
  }
}
