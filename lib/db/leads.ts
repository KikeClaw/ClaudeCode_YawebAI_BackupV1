import { supabaseAdmin } from '../supabase'
import type { Lead, LeadStatus, Vertical } from '@/types'

export async function getLeads(filters?: { status?: LeadStatus; city?: string; vertical?: Vertical }): Promise<Lead[]> {
  let query = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.city) query = query.ilike('city', `%${filters.city}%`)
  if (filters?.vertical) query = query.eq('vertical', filters.vertical)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createLeads(leads: Omit<Lead, 'id' | 'created_at' | 'status'>[]): Promise<Lead[]> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .insert(leads.map(l => ({ ...l, status: 'new' })))
    .select()
  if (error) throw error
  return data || []
}

export async function updateLeadStatus(id: string, status: LeadStatus, extra?: Partial<Lead>): Promise<void> {
  await supabaseAdmin.from('leads').update({ status, ...extra }).eq('id', id)
}

export async function updateLeadDemo(id: string, demo_slug: string): Promise<void> {
  await supabaseAdmin.from('leads').update({
    demo_slug,
    demo_generated_at: new Date().toISOString(),
    status: 'demo_ready'
  }).eq('id', id)
}

export async function markLeadEmailSent(id: string, campaign_id: string): Promise<void> {
  await supabaseAdmin.from('leads').update({
    status: 'email_sent',
    email_sent_at: new Date().toISOString(),
    campaign_id
  }).eq('id', id)
}

export async function markLeadDemoVisited(slug: string): Promise<void> {
  await supabaseAdmin.from('leads').update({
    status: 'demo_visited',
    demo_visited_at: new Date().toISOString()
  }).eq('demo_slug', slug).eq('status', 'email_sent')
}

export async function deleteLeads(ids: string[]): Promise<void> {
  await supabaseAdmin.from('leads').delete().in('id', ids)
}
