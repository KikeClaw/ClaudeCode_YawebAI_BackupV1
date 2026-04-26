import { NextRequest, NextResponse } from 'next/server'
import { getLeads, markLeadEmailSent } from '@/lib/db/leads'
import { createCampaign, updateCampaignStats } from '@/lib/db/campaigns'
import { generateEmailOutreach } from '@/lib/ai/generator'
import { sendBulkEmails } from '@/lib/resend'

/** Send a follow-up campaign to leads who received the original but never opened it */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  try {
    const allLeads = await getLeads()
    const nonOpeners = allLeads.filter(
      l =>
        l.campaign_id === id &&
        l.email_sent_at &&
        !l.email_opened_at &&
        l.email &&
        l.demo_slug
    )

    if (!nonOpeners.length) {
      return NextResponse.json({ error: 'No non-openers found for this campaign' }, { status: 400 })
    }

    const followup = await createCampaign({
      name: `Follow-up · ${new Date().toLocaleDateString('es-ES')}`,
      subject: 'Una última cosa — tu web sigue esperando',
      body_html: '',
      body_text: '',
    })
    await updateCampaignStats(followup.id, { leads_count: nonOpeners.length })

    const emails = []
    for (const lead of nonOpeners) {
      const demoUrl = `${appUrl}/demo/${lead.demo_slug}`
      const content = await generateEmailOutreach(lead.business_name, demoUrl, lead.vertical)
      const pixel = `<img src="${appUrl}/api/track/open?lead=${lead.id}&campaign=${followup.id}" width="1" height="1" style="display:none">`
      const unsub = `<p style="font-size:11px;color:#aaa;margin-top:24px;text-align:center">No quieres recibir más emails de yaweb.ai — <a href="${appUrl}/api/unsubscribe?lead=${lead.id}" style="color:#aaa">darte de baja</a>.</p>`
      emails.push({
        to: lead.email!,
        subject: content.subject,
        html: content.html + pixel + unsub,
        text: content.text || '',
      })
    }

    const results = await sendBulkEmails(emails)
    const sentCount = results.filter(r => r.success).length

    await updateCampaignStats(followup.id, {
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    })

    for (let i = 0; i < nonOpeners.length; i++) {
      if (results[i]?.success) await markLeadEmailSent(nonOpeners[i].id, followup.id)
    }

    return NextResponse.json({ success: true, sent: sentCount, campaign_id: followup.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
