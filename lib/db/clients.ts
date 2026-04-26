import { supabaseAdmin } from '../supabase'
import type { Client, ClientStatus, HtmlContent, SiteContent, SiteData } from '@/types'

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*, site_content(*)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getClientBySlug(slug: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*, site_content(*)')
    .eq('slug', slug)
    .eq('site_content.is_active', true)
    .single()
  if (error) return null
  return data
}

export async function createClient(input: {
  name: string
  slug: string
  vertical: Client['vertical']
  google_business_url?: string
  google_place_id?: string
  email?: string
  phone?: string
  is_portfolio?: boolean
  channel?: 'admin' | 'landing' | 'api'
  model?: string
  is_internal?: boolean
  input_tokens?: number
  output_tokens?: number
  cost_usd?: number
  created_by?: string
}): Promise<Client> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({ ...input, status: 'demo', channel: input.channel ?? 'admin' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getPortfolioClients(): Promise<Client[]> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*, site_content(*)')
    .eq('is_portfolio', true)
    .order('created_at', { ascending: false })
  if (error) {
    // Column may not exist yet — return empty array gracefully
    console.warn('portfolio query error (run migration?):', error.message)
    return []
  }
  return data || []
}

export async function markAsPortfolio(id: string, value: boolean): Promise<void> {
  await supabaseAdmin.from('clients').update({ is_portfolio: value }).eq('id', id)
}

export async function saveSiteContent(clientId: string, content: SiteData | HtmlContent, templateId = 'default'): Promise<SiteContent> {
  await supabaseAdmin
    .from('site_content')
    .update({ is_active: false })
    .eq('client_id', clientId)

  const { data, error } = await supabaseAdmin
    .from('site_content')
    .insert({ client_id: clientId, content, template_id: templateId, is_active: true })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function activateClient(id: string): Promise<void> {
  await supabaseAdmin
    .from('clients')
    .update({ status: 'active', activated_at: new Date().toISOString() })
    .eq('id', id)
}

export async function markClientPaid(
  id: string,
  plan: 'basic' | 'premium' = 'basic',
  annualAmount?: number,
): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)
  const amount = annualAmount ?? (plan === 'premium' ? 199 : 99)
  await supabaseAdmin
    .from('clients')
    .update({
      paid_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      status: 'active',
      plan,
      annual_amount: amount,
    })
    .eq('id', id)
}

export async function markAsInternal(id: string, value: boolean): Promise<void> {
  await supabaseAdmin.from('clients').update({ is_internal: value }).eq('id', id)
}

export async function updateClientStatus(id: string, status: ClientStatus): Promise<void> {
  await supabaseAdmin.from('clients').update({ status }).eq('id', id)
}

export async function updateClientGithub(id: string, github_repo_url: string): Promise<void> {
  await supabaseAdmin.from('clients').update({ github_repo_url }).eq('id', id)
}

export async function deleteClient(id: string): Promise<void> {
  await supabaseAdmin.from('clients').delete().eq('id', id)
}

export async function getClientById(id: string): Promise<Client | null> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .select('*, site_content(*)')
    .eq('id', id)
    .order('version', { ascending: false, referencedTable: 'site_content' })
    .single()
  if (error) return null
  return data
}

export async function getSiteVersions(clientId: string): Promise<SiteContent[]> {
  const { data, error } = await supabaseAdmin
    .from('site_content')
    .select('*')
    .eq('client_id', clientId)
    .order('version', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateClientMeta(
  id: string,
  fields: { phone?: string; whatsapp?: string; email?: string; notes?: string }
): Promise<void> {
  const { error } = await supabaseAdmin.from('clients').update(fields).eq('id', id)
  if (error) throw error
}

export async function renewClient(id: string): Promise<void> {
  const { data } = await supabaseAdmin.from('clients').select('expires_at').eq('id', id).single()
  const base = data?.expires_at && new Date(data.expires_at).getTime() > Date.now()
    ? new Date(data.expires_at)
    : new Date()
  base.setFullYear(base.getFullYear() + 1)
  await supabaseAdmin.from('clients').update({
    expires_at: base.toISOString(),
    status: 'active',
  }).eq('id', id)
}

export async function restoreSiteVersion(clientId: string, versionId: string): Promise<void> {
  await supabaseAdmin
    .from('site_content')
    .update({ is_active: false })
    .eq('client_id', clientId)

  const { error } = await supabaseAdmin
    .from('site_content')
    .update({ is_active: true })
    .eq('id', versionId)
    .eq('client_id', clientId)
  if (error) throw error
}
