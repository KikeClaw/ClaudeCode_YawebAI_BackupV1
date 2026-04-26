import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getPlaceById, detectVertical } from '@/lib/google-places'
import { buildSite, generateSlug } from '@/lib/ai/generator'
import { createClient, saveSiteContent } from '@/lib/db/clients'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const { data: lead, error: leadErr } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }
    if (!lead.google_place_id) {
      return NextResponse.json({ error: 'Lead has no google_place_id' }, { status: 400 })
    }

    // Mark as regenerating
    await supabaseAdmin.from('leads').update({ status: 'demo_generating' }).eq('id', id)

    const place = await getPlaceById(lead.google_place_id)
    if (!place) {
      await supabaseAdmin.from('leads').update({ status: 'demo_ready' }).eq('id', id)
      return NextResponse.json({ error: 'Place not found in Google' }, { status: 400 })
    }

    const vertical = detectVertical(place.types || [])
    const result = await buildSite(place, vertical, {
      model: 'claude-sonnet-4-6',
      siteTheme: 'light',
      stylePreset: 'auto',
      tone: 'friendly',
      density: 'full',
      language: 'es',
      readWebsite: true,
      variants: false,
    })

    const baseSlug = await generateSlug(lead.business_name)
    const slug = `demo-${baseSlug}-${Date.now().toString(36)}`

    const client = await createClient({
      name: lead.business_name,
      slug,
      vertical,
      google_business_url: lead.google_business_url,
      google_place_id: lead.google_place_id,
      phone: lead.phone,
      model: 'claude-sonnet-4-6',
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_usd: result.costUsd,
      channel: 'admin',
    })

    await saveSiteContent(client.id, { _type: 'html', html: result.html }, 'html')
    await supabaseAdmin.from('leads').update({
      demo_slug: slug,
      demo_generated_at: new Date().toISOString(),
      status: 'demo_ready',
    }).eq('id', id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    return NextResponse.json({
      success: true,
      slug,
      demo_url: `${appUrl}/demo/${slug}`,
    })
  } catch (err) {
    await supabaseAdmin.from('leads').update({ status: 'new' }).eq('id', id)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
