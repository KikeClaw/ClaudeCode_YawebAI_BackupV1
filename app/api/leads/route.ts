import { NextRequest, NextResponse } from 'next/server'
import { getLeads } from '@/lib/db/leads'
import { supabaseAdmin } from '@/lib/supabase'
import type { Vertical } from '@/types'

export async function GET() {
  try {
    const leads = await getLeads()
    return NextResponse.json(leads)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** Create a single lead (e.g. from BulkLeadSearch after demo generation) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      business_name,
      google_place_id,
      google_business_url,
      vertical,
      address,
      city,
      phone,
      email,
      has_website,
      existing_website,
      demo_slug,
    } = body

    if (!business_name) {
      return NextResponse.json({ error: 'business_name required' }, { status: 400 })
    }

    const status = demo_slug ? 'demo_ready' : 'new'

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        business_name,
        google_place_id: google_place_id || null,
        google_business_url: google_business_url || null,
        vertical: (vertical || 'generic') as Vertical,
        address: address || null,
        city: city || null,
        phone: phone || null,
        email: email || null,
        has_website: has_website ?? false,
        existing_website: existing_website || null,
        demo_slug: demo_slug || null,
        demo_generated_at: demo_slug ? new Date().toISOString() : null,
        status,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
