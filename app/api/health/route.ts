import { NextResponse } from 'next/server'

export async function GET() {
  const checks: Record<string, { ok: boolean; message: string }> = {}

  // Check Supabase
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_KEY
    if (!url || !key || url.includes('xxxx') || key.includes('your-')) throw new Error('Missing credentials')
    const sb = createClient(url, key)
    const { error } = await sb.from('clients').select('id').limit(1)
    checks.supabase = error
      ? { ok: false, message: error.message }
      : { ok: true, message: 'Connected' }
  } catch (e) {
    checks.supabase = { ok: false, message: String(e) }
  }

  // Check Anthropic
  try {
    const key = process.env.ANTHROPIC_API_KEY
    if (!key || key.includes('your-') || key === 'your-anthropic-api-key') throw new Error('Missing API key')
    checks.anthropic = { ok: true, message: 'OK' }
  } catch (e) {
    checks.anthropic = { ok: false, message: String(e) }
  }

  // Check Google Places
  try {
    const key = process.env.GOOGLE_PLACES_API_KEY
    if (!key || key.includes('your-')) throw new Error('Missing API key')
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4&fields=name&key=${key}`
    )
    const data = await res.json()
    checks.google_places = data.status === 'OK'
      ? { ok: true, message: 'API working' }
      : { ok: false, message: `Status: ${data.status}` }
  } catch (e) {
    checks.google_places = { ok: false, message: String(e) }
  }

  // Check Resend
  try {
    const key = process.env.RESEND_API_KEY
    if (!key || key.includes('your-')) throw new Error('Missing API key')
    checks.resend = { ok: true, message: 'Key present' }
  } catch (e) {
    checks.resend = { ok: false, message: String(e) }
  }

  const allOk = Object.values(checks).every(c => c.ok)

  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 503 })
}
