import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const leadId = searchParams.get('lead')
  const campaignId = searchParams.get('campaign')

  if (leadId) {
    await supabaseAdmin
      .from('leads')
      .update({ email_opened_at: new Date().toISOString() })
      .eq('id', leadId)
      .is('email_opened_at', null)
  }

  // Return 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  return new NextResponse(gif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
