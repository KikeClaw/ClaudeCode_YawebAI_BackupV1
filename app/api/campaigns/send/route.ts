import { NextRequest, NextResponse } from 'next/server'
import { getLeads, markLeadEmailSent } from '@/lib/db/leads'
import { createCampaign, updateCampaignStats } from '@/lib/db/campaigns'
import { sendBulkEmails } from '@/lib/resend'
import { generateEmailOutreach } from '@/lib/ai/generator'

export async function POST(req: NextRequest) {
  try {
    const { lead_ids, subject, body_html, use_ai, campaign_name } = await req.json()
    if (!lead_ids?.length) return NextResponse.json({ error: 'lead_ids required' }, { status: 400 })

    const allLeads = await getLeads()
    const leads = allLeads.filter(l => lead_ids.includes(l.id) && l.email && l.demo_slug && l.status === 'demo_ready')

    if (!leads.length) return NextResponse.json({ error: 'No leads con email y demo listos' }, { status: 400 })

    const campaign = await createCampaign({
      name: campaign_name || `Campaña ${new Date().toLocaleDateString('es-ES')}`,
      subject: subject || 'Hemos creado una web demo para tu negocio',
      body_html: body_html || '',
      body_text: '',
    })

    await updateCampaignStats(campaign.id, { leads_count: leads.length })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const emails = []

    for (const lead of leads) {
      const demoUrl = `${appUrl}/demo/${lead.demo_slug}`
      let emailContent = { subject: campaign.subject, html: body_html || '', text: '' }

      if (use_ai || !body_html) {
        emailContent = await generateEmailOutreach(lead.business_name, demoUrl, lead.vertical)
      }

      // Inject tracking pixel and personalize demo link
      const trackingPixel = `<img src="${appUrl}/api/track/open?lead=${lead.id}&campaign=${campaign.id}" width="1" height="1" style="display:none" />`
      const unsubUrl = `${appUrl}/api/unsubscribe?lead=${lead.id}`
      const unsubLink = `<p style="font-size:11px;color:#aaa;margin-top:28px;text-align:center">Si no quieres recibir más emails de yaweb.ai puedes <a href="${unsubUrl}" style="color:#aaa;text-decoration:underline">darte de baja aquí</a>.</p>`
      const personalizedHtml = emailContent.html
        .replace(/\{\{demo_url\}\}/g, demoUrl)
        .replace(/\{\{business_name\}\}/g, lead.business_name)
        + trackingPixel + unsubLink

      emails.push({
        to: lead.email!,
        subject: emailContent.subject,
        html: personalizedHtml,
        text: emailContent.text || personalizedHtml.replace(/<[^>]+>/g, ''),
      })
    }

    const results = await sendBulkEmails(emails)
    const sentCount = results.filter(r => r.success).length

    await updateCampaignStats(campaign.id, {
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    })

    for (let i = 0; i < leads.length; i++) {
      if (results[i]?.success) {
        await markLeadEmailSent(leads[i].id, campaign.id)
      }
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
      sent: sentCount,
      failed: results.length - sentCount,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
