import { supabaseAdmin } from '../supabase'
import type { Campaign } from '@/types'

export async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createCampaign(input: Pick<Campaign, 'name' | 'subject' | 'body_html' | 'body_text'>): Promise<Campaign> {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .insert(input)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCampaignStats(id: string, stats: Partial<Pick<Campaign, 'sent_count' | 'opened_count' | 'visited_count' | 'converted_count' | 'leads_count' | 'sent_at'>>): Promise<void> {
  await supabaseAdmin.from('campaigns').update(stats).eq('id', id)
}
