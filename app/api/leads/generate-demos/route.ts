import { NextRequest, NextResponse } from 'next/server'
import { getPlaceById, detectVertical } from '@/lib/google-places'
import { buildSite, generateSlug } from '@/lib/ai/generator'
import { createClient, saveSiteContent } from '@/lib/db/clients'
import { getLeads, updateLeadDemo, updateLeadStatus } from '@/lib/db/leads'

export async function POST(req: NextRequest) {
  try {
    const { lead_ids } = await req.json()
    if (!lead_ids?.length) return NextResponse.json({ error: 'lead_ids required' }, { status: 400 })

    const allLeads = await getLeads()
    const leads = allLeads.filter(l => lead_ids.includes(l.id) && l.status === 'new')

    const results = []

    for (const lead of leads) {
      try {
        await updateLeadStatus(lead.id, 'demo_generating')

        const placeId = lead.google_place_id
        if (!placeId) {
          results.push({ id: lead.id, success: false, error: 'No place_id' })
          continue
        }

        const place = await getPlaceById(placeId)
        if (!place) {
          results.push({ id: lead.id, success: false, error: 'Place not found' })
          await updateLeadStatus(lead.id, 'new')
          continue
        }

        const vertical = detectVertical(place.types || [])

        // Full pipeline — same as admin "Nueva Web" and landing page
        // Uses Haiku for cost efficiency on bulk runs; same quality pipeline
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
        const slug     = `demo-${baseSlug}-${Date.now().toString(36)}`

        const client = await createClient({
          name: lead.business_name,
          slug,
          vertical,
          google_business_url: lead.google_business_url,
          google_place_id: placeId,
          phone: lead.phone,
          model: 'claude-sonnet-4-6',
          input_tokens:  result.inputTokens,
          output_tokens: result.outputTokens,
          cost_usd:      result.costUsd,
          channel:       'admin',
        })

        await saveSiteContent(client.id, { _type: 'html', html: result.html }, 'html')
        await updateLeadDemo(lead.id, slug)

        results.push({
          id: lead.id,
          success: true,
          slug,
          demo_url: `${process.env.NEXT_PUBLIC_APP_URL}/demo/${slug}`,
        })

        // Rate limit: avoid hammering the API on bulk runs
        await new Promise(r => setTimeout(r, 2000))
      } catch (err) {
        results.push({ id: lead.id, success: false, error: String(err) })
        await updateLeadStatus(lead.id, 'new')
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
