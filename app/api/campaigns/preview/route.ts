import { NextRequest, NextResponse } from 'next/server'
import { getLeads } from '@/lib/db/leads'
import { generateEmailOutreach } from '@/lib/ai/generator'

/** Generate a preview of the outreach email for one lead (before sending) */
export async function POST(req: NextRequest) {
  try {
    const { lead_id } = await req.json()
    if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

    const leads = await getLeads()
    const lead = leads.find(l => l.id === lead_id)
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    if (!lead.demo_slug) return NextResponse.json({ error: 'Lead has no demo' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const demoUrl = `${appUrl}/demo/${lead.demo_slug}`
    const emailContent = await generateEmailOutreach(lead.business_name, demoUrl, lead.vertical)

    return NextResponse.json({
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      lead: { id: lead.id, name: lead.business_name, email: lead.email },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
