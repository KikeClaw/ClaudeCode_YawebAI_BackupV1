import { NextResponse } from 'next/server'
import { getCampaigns } from '@/lib/db/campaigns'

export async function GET() {
  try {
    const campaigns = await getCampaigns()
    return NextResponse.json(campaigns)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
