import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { verifyAdminJwt } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_auth')?.value ?? ''
  const jwt = await verifyAdminJwt(token)
  if (!jwt) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch raw data in parallel
  const [clientsRes, usersRes, leadsRes, campaignsRes] = await Promise.all([
    supabaseAdmin
      .from('clients')
      .select('id,status,model,vertical,cost_usd,input_tokens,output_tokens,annual_amount,created_by,created_at,is_internal,plan,paid_at'),
    supabaseAdmin
      .from('admin_users')
      .select('id,name,role,is_active'),
    supabaseAdmin
      .from('leads')
      .select('status,created_at'),
    supabaseAdmin
      .from('campaigns')
      .select('id,name,leads_count,sent_count,opened_count,visited_count,converted_count,sent_at'),
  ])

  const clients   = clientsRes.data   || []
  const users     = usersRes.data     || []
  const leads     = leadsRes.data     || []
  const campaigns = campaignsRes.data || []

  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)

  // ── Summary KPIs ────────────────────────────────────────────────────────────
  const external = clients.filter(c => !c.is_internal)
  const active   = clients.filter(c => c.status === 'active')
  const demo     = clients.filter(c => c.status === 'demo')
  const inactive = clients.filter(c => c.status === 'inactive')
  const expired  = clients.filter(c => c.status === 'expired')

  const totalRevenue = sum(active.map(c => Number(c.annual_amount || 0)))
  const totalCost    = sum(clients.map(c => Number(c.cost_usd || 0)))
  const extActive    = active.filter(c => !c.is_internal).length
  const convRate     = external.length > 0 ? (extActive / external.length) * 100 : 0

  const summary = {
    total_sites:     clients.length,
    external_sites:  external.length,
    internal_sites:  clients.filter(c => c.is_internal).length,
    active_sites:    active.length,
    demo_sites:      demo.length,
    inactive_sites:  inactive.length,
    expired_sites:   expired.length,
    total_revenue:   totalRevenue,
    total_cost_usd:  totalCost,
    net_margin:      totalRevenue - totalCost * 0.9, // approx (cost is in USD, revenue in EUR)
    conversion_rate: Math.round(convRate * 10) / 10,
    avg_cost_per_site: clients.length > 0 ? totalCost / clients.length : 0,
    total_input_tokens:  sum(clients.map(c => Number(c.input_tokens  || 0))),
    total_output_tokens: sum(clients.map(c => Number(c.output_tokens || 0))),
  }

  // ── By model ────────────────────────────────────────────────────────────────
  const modelMap = new Map<string, { count: number; total_cost: number; active: number; input_tokens: number; output_tokens: number }>()
  for (const c of clients) {
    const key = c.model || 'sin modelo'
    const e = modelMap.get(key) ?? { count: 0, total_cost: 0, active: 0, input_tokens: 0, output_tokens: 0 }
    modelMap.set(key, {
      count:         e.count + 1,
      total_cost:    e.total_cost + Number(c.cost_usd || 0),
      active:        e.active + (c.status === 'active' ? 1 : 0),
      input_tokens:  e.input_tokens  + Number(c.input_tokens  || 0),
      output_tokens: e.output_tokens + Number(c.output_tokens || 0),
    })
  }
  const by_model = Array.from(modelMap.entries())
    .map(([model, d]) => ({
      model,
      count:         d.count,
      total_cost:    d.total_cost,
      avg_cost:      d.count > 0 ? d.total_cost / d.count : 0,
      active:        d.active,
      input_tokens:  d.input_tokens,
      output_tokens: d.output_tokens,
    }))
    .sort((a, b) => b.count - a.count)

  // ── By user ─────────────────────────────────────────────────────────────────
  const userMap = new Map<string, {
    name: string; role: string; is_active: boolean
    count: number; active: number; cost: number; revenue: number
  }>()
  // Pre-populate all known users (including those with 0 sites)
  for (const u of users) {
    userMap.set(u.id, { name: u.name, role: u.role, is_active: u.is_active, count: 0, active: 0, cost: 0, revenue: 0 })
  }
  for (const c of clients) {
    const key = c.created_by || '__unassigned__'
    const e = userMap.get(key) ?? { name: 'Sin asignar', role: '—', is_active: true, count: 0, active: 0, cost: 0, revenue: 0 }
    userMap.set(key, {
      ...e,
      count:   e.count + 1,
      active:  e.active + (c.status === 'active' ? 1 : 0),
      cost:    e.cost + Number(c.cost_usd || 0),
      revenue: e.revenue + (c.status === 'active' ? Number(c.annual_amount || 0) : 0),
    })
  }
  const by_user = Array.from(userMap.entries())
    .map(([id, d]) => ({ user_id: id, ...d }))
    .filter(u => u.count > 0) // hide users with no activity
    .sort((a, b) => b.count - a.count)

  // ── By vertical ─────────────────────────────────────────────────────────────
  const vertMap = new Map<string, { count: number; active: number }>()
  for (const c of clients) {
    const key = c.vertical || 'generic'
    const e = vertMap.get(key) ?? { count: 0, active: 0 }
    vertMap.set(key, { count: e.count + 1, active: e.active + (c.status === 'active' ? 1 : 0) })
  }
  const by_vertical = Array.from(vertMap.entries())
    .map(([vertical, d]) => ({ vertical, ...d }))
    .sort((a, b) => b.count - a.count)

  // ── Monthly trend — last 12 months ──────────────────────────────────────────
  const now = new Date()
  const monthlyMap: Record<string, { count: number; cost: number; active: number }> = {}
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthlyMap[key] = { count: 0, cost: 0, active: 0 }
  }
  for (const c of clients) {
    const d   = new Date(c.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (monthlyMap[key]) {
      monthlyMap[key].count++
      monthlyMap[key].cost   += Number(c.cost_usd || 0)
      monthlyMap[key].active += c.status === 'active' ? 1 : 0
    }
  }
  const monthly_trend = Object.entries(monthlyMap).map(([month, d]) => ({ month, ...d }))

  // ── Leads funnel ─────────────────────────────────────────────────────────────
  const LEAD_STATUSES = ['new', 'demo_generating', 'demo_ready', 'email_sent', 'demo_visited', 'converted', 'rejected'] as const
  const leads_funnel: Record<string, number> = {}
  for (const s of LEAD_STATUSES) leads_funnel[s] = 0
  for (const l of leads) {
    if (l.status in leads_funnel) leads_funnel[l.status]++
  }

  // ── Campaigns summary ────────────────────────────────────────────────────────
  const campaigns_summary = {
    total:     campaigns.length,
    sent:      campaigns.filter(c => c.sent_at).length,
    total_leads_sent: sum(campaigns.map(c => c.sent_count || 0)),
    total_opened:     sum(campaigns.map(c => c.opened_count || 0)),
    total_visited:    sum(campaigns.map(c => c.visited_count || 0)),
    total_converted:  sum(campaigns.map(c => c.converted_count || 0)),
  }

  return NextResponse.json({
    summary,
    by_model,
    by_user,
    by_vertical,
    monthly_trend,
    leads_funnel,
    total_leads: leads.length,
    campaigns_summary,
  })
}
