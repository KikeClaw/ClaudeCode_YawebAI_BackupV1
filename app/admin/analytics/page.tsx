'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/admin/AdminUI'
import {
  BarChart2, TrendingUp, Globe, DollarSign, Zap, Users,
  Target, Mail, Eye, MousePointerClick, CheckCircle, XCircle,
  AlertCircle, Activity,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalyticsSummary {
  total_sites: number
  external_sites: number
  internal_sites: number
  active_sites: number
  demo_sites: number
  inactive_sites: number
  expired_sites: number
  total_revenue: number
  total_cost_usd: number
  net_margin: number
  conversion_rate: number
  avg_cost_per_site: number
  total_input_tokens: number
  total_output_tokens: number
}

interface ModelRow {
  model: string
  count: number
  total_cost: number
  avg_cost: number
  active: number
  input_tokens: number
  output_tokens: number
}

interface UserRow {
  user_id: string
  name: string
  role: string
  is_active: boolean
  count: number
  active: number
  cost: number
  revenue: number
}

interface VerticalRow {
  vertical: string
  count: number
  active: number
}

interface MonthPoint {
  month: string
  count: number
  cost: number
  active: number
}

interface AnalyticsData {
  summary: AnalyticsSummary
  by_model: ModelRow[]
  by_user: UserRow[]
  by_vertical: VerticalRow[]
  monthly_trend: MonthPoint[]
  leads_funnel: Record<string, number>
  total_leads: number
  campaigns_summary: {
    total: number
    sent: number
    total_leads_sent: number
    total_opened: number
    total_visited: number
    total_converted: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERTICAL_LABEL: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar', salon: 'Salón', clinic: 'Clínica',
  academy: 'Academia', shop: 'Tienda', workshop: 'Taller', gym: 'Gimnasio',
  lawyer: 'Abogado', hotel: 'Hotel', pharmacy: 'Farmacia', generic: 'Genérico',
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
}

function fmtMonth(m: string) {
  const [year, mon] = m.split('-')
  return `${MONTH_LABELS[mon]} ${year.slice(2)}`
}

function fmtCost(n: number) {
  if (n === 0) return '—'
  return n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`
}

function fmtEur(n: number) {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €`
}

function fmtTokens(n: number) {
  if (n === 0) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

function shortModel(m: string) {
  if (!m || m === 'sin modelo') return 'Sin modelo'
  // claude-sonnet-4-5 → Sonnet 4.5, gpt-4o → GPT-4o, gemini-2.5-flash → Gemini 2.5 Flash
  return m
    .replace('claude-opus-', 'Claude Opus ')
    .replace('claude-sonnet-', 'Claude Sonnet ')
    .replace('claude-haiku-', 'Claude Haiku ')
    .replace('gpt-4o-mini', 'GPT-4o Mini')
    .replace('gpt-4o', 'GPT-4o')
    .replace('gemini-2.5-flash', 'Gemini 2.5 Flash')
    .replace('gemini-2.0-flash', 'Gemini 2.0 Flash')
    .replace('gemini-1.5-pro', 'Gemini 1.5 Pro')
    .replace('llama-3.3-70b-versatile', 'Llama 3.3 70B')
    .replace('llama-3.1-8b-instant', 'Llama 3.1 8B')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, borderColor,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
  borderColor: string
}) {
  return (
    <div className="card h-100" style={{ borderTop: `3px solid ${borderColor}` }}>
      <div className="card-body">
        <div className="d-flex align-items-start justify-content-between mb-3">
          <div
            className="avatar avatar-md d-flex align-items-center justify-content-center rounded"
            style={{ background: `${borderColor}18` }}
          >
            <Icon size={18} color={borderColor} />
          </div>
        </div>
        <p className="mb-1 text-body-secondary" style={{ fontSize: 12, fontWeight: 500 }}>{label}</p>
        <h4 className="mb-0 fw-bold" style={{ color, fontSize: 22 }}>{value}</h4>
        {sub && <p className="mb-0 mt-1 text-body-secondary" style={{ fontSize: 11 }}>{sub}</p>}
      </div>
    </div>
  )
}

function MiniBar({ pct, color = '#696cff' }: { pct: number; color?: string }) {
  return (
    <div style={{ width: 80, height: 6, background: '#f0f1f5', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  )
}

function TableHead({ cols }: { cols: Array<{ label: string; align?: 'left' | 'right' | 'center' }> }) {
  return (
    <thead>
      <tr className="text-muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {cols.map((c, i) => (
          <th key={i} className={`fw-semibold ${c.align === 'right' ? 'text-end' : c.align === 'center' ? 'text-center' : ''} ${i === 0 ? 'ps-4' : ''}`}>
            {c.label}
          </th>
        ))}
      </tr>
    </thead>
  )
}

// ── Bar Chart (CSS) ───────────────────────────────────────────────────────────

function MonthlyBarChart({ data }: { data: MonthPoint[] }) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="d-flex align-items-end gap-1" style={{ height: 120, padding: '0 4px' }}>
      {data.map(d => {
        const pct = (d.count / maxCount) * 100
        return (
          <div key={d.month} className="d-flex flex-column align-items-center gap-1 flex-fill">
            <span className="text-body-secondary" style={{ fontSize: 10, fontWeight: 600 }}>{d.count > 0 ? d.count : ''}</span>
            <div
              title={`${fmtMonth(d.month)}: ${d.count} webs`}
              style={{
                width: '100%', background: d.count > 0 ? '#696cff' : '#eef0f4',
                borderRadius: '4px 4px 0 0',
                height: `${Math.max(pct, d.count > 0 ? 8 : 4)}%`,
                transition: 'height 0.6s ease',
                cursor: 'default',
              }}
            />
            <span className="text-body-secondary" style={{ fontSize: 9, whiteSpace: 'nowrap' }}>{fmtMonth(d.month)}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Funnel ────────────────────────────────────────────────────────────────────

function LeadsFunnel({ funnel, total }: { funnel: Record<string, number>; total: number }) {
  const steps = [
    { key: 'new',              label: 'Nuevos',          icon: Users,              color: '#8592a3' },
    { key: 'demo_ready',       label: 'Demo lista',       icon: Globe,              color: '#696cff' },
    { key: 'email_sent',       label: 'Email enviado',    icon: Mail,               color: '#03c3ec' },
    { key: 'demo_visited',     label: 'Demo visitada',    icon: Eye,                color: '#ffab00' },
    { key: 'converted',        label: 'Convertido',       icon: CheckCircle,        color: '#71dd37' },
    { key: 'rejected',         label: 'Rechazado',        icon: XCircle,            color: '#ff3e1d' },
  ]
  const max = Math.max(...steps.map(s => funnel[s.key] || 0), 1)
  return (
    <div className="d-flex flex-column gap-2">
      {steps.map(s => {
        const n   = funnel[s.key] || 0
        const pct = Math.round((n / Math.max(total, 1)) * 100)
        const bar = Math.round((n / max) * 100)
        return (
          <div key={s.key} className="d-flex align-items-center gap-2">
            <s.icon size={13} color={s.color} style={{ flexShrink: 0 }} />
            <span className="text-body-secondary" style={{ width: 110, fontSize: 12, flexShrink: 0 }}>{s.label}</span>
            <div className="flex-fill" style={{ height: 8, background: '#f0f1f5', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${bar}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
            </div>
            <span className="fw-bold text-body-secondary" style={{ width: 28, textAlign: 'right', fontSize: 12, flexShrink: 0 }}>{n}</span>
            <span className="text-body-secondary" style={{ width: 34, fontSize: 11, flexShrink: 0 }}>{pct}%</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]     = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setData)
      .catch(() => setError('Error cargando analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <PageHeader
          title="Analytics"
          subtitle="Webs, ingresos, costes, usuarios y leads"
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Analytics' }]}
        />
        <div className="text-center py-5 text-muted" style={{ fontSize: 13 }}>Cargando datos…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="alert alert-danger d-flex align-items-center gap-2" style={{ fontSize: 13 }}>
          <AlertCircle size={16} /> {error || 'Sin datos'}
        </div>
      </div>
    )
  }

  const { summary, by_model, by_user, by_vertical, monthly_trend, leads_funnel, total_leads, campaigns_summary } = data
  const maxModelCount = Math.max(...by_model.map(m => m.count), 1)

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Analytics"
        subtitle="Webs, ingresos, costes, usuarios y leads"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Analytics' }]}
      />

      {/* ── KPI Cards ── */}
      <div className="row g-4 mb-5">
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Webs generadas" value={summary.total_sites} sub={`${summary.internal_sites} internas`}
            icon={Globe} color="#566a7f" borderColor="#696cff" />
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Webs activas" value={summary.active_sites} sub={`${summary.demo_sites} demos`}
            icon={Activity} color="#71dd37" borderColor="#71dd37" />
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Revenue total" value={summary.total_revenue > 0 ? fmtEur(summary.total_revenue) : '—'}
            sub={`${summary.active_sites} pagando`}
            icon={DollarSign} color="#566a7f" borderColor="#03c3ec" />
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Coste IA total" value={fmtCost(summary.total_cost_usd)}
            sub={`~${fmtCost(summary.avg_cost_per_site)} / web`}
            icon={Zap} color="#566a7f" borderColor="#ffab00" />
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Conversión" value={`${summary.conversion_rate}%`}
            sub={`${summary.expired_sites} expiradas`}
            icon={TrendingUp} color="#566a7f" borderColor="#71dd37" />
        </div>
        <div className="col-xl-2 col-md-4 col-sm-6">
          <KpiCard label="Tokens totales"
            value={fmtTokens(summary.total_input_tokens + summary.total_output_tokens)}
            sub={`${fmtTokens(summary.total_input_tokens)} in · ${fmtTokens(summary.total_output_tokens)} out`}
            icon={BarChart2} color="#566a7f" borderColor="#ff3e1d" />
        </div>
      </div>

      {/* ── Tendencia + Leads funnel ── */}
      <div className="row g-4 mb-5">
        <div className="col-xl-7">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
                <BarChart2 size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
                Webs generadas — últimos 12 meses
              </h5>
            </div>
            <div className="card-body">
              {summary.total_sites === 0 ? (
                <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Sin datos aún</p>
              ) : (
                <MonthlyBarChart data={monthly_trend} />
              )}
            </div>
          </div>
        </div>
        <div className="col-xl-5">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
                <Target size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
                Funnel de leads
              </h5>
              <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 11 }}>{total_leads} total</span>
            </div>
            <div className="card-body">
              {total_leads === 0 ? (
                <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Sin leads aún</p>
              ) : (
                <LeadsFunnel funnel={leads_funnel} total={total_leads} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Por modelo ── */}
      <div className="card mb-5">
        <div className="card-header">
          <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
            <Zap size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
            Rendimiento por modelo de IA
          </h5>
        </div>
        {by_model.length === 0 ? (
          <div className="card-body text-center text-muted py-4" style={{ fontSize: 13 }}>Sin datos</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0" style={{ fontSize: 13 }}>
              <TableHead cols={[
                { label: 'Modelo' },
                { label: 'Uso', align: 'right' },
                { label: '% del total', align: 'center' },
                { label: 'Activas', align: 'right' },
                { label: 'Tokens (in/out)', align: 'right' },
                { label: 'Coste total', align: 'right' },
                { label: 'Coste medio', align: 'right' },
              ]} />
              <tbody>
                {by_model.map(m => (
                  <tr key={m.model}>
                    <td className="ps-4 py-3">
                      <span className="fw-semibold text-body-secondary">{shortModel(m.model)}</span>
                    </td>
                    <td className="py-3 text-end fw-bold text-body-secondary">{m.count}</td>
                    <td className="py-3">
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <MiniBar pct={(m.count / maxModelCount) * 100} />
                        <span className="text-body-secondary" style={{ fontSize: 11, width: 32, textAlign: 'right' }}>
                          {Math.round((m.count / summary.total_sites) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-end">
                      <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>{m.active}</span>
                    </td>
                    <td className="py-3 text-end text-body-secondary" style={{ fontSize: 12 }}>
                      {fmtTokens(m.input_tokens)} / {fmtTokens(m.output_tokens)}
                    </td>
                    <td className="py-3 text-end fw-semibold text-primary">
                      {fmtCost(m.total_cost)}
                    </td>
                    <td className="py-3 text-end pe-4 text-body-secondary" style={{ fontSize: 12 }}>
                      {fmtCost(m.avg_cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Por usuario ── */}
      <div className="card mb-5">
        <div className="card-header">
          <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
            <Users size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
            Rendimiento por usuario
          </h5>
        </div>
        {by_user.length === 0 ? (
          <div className="card-body text-center text-muted py-4" style={{ fontSize: 13 }}>Sin datos</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0" style={{ fontSize: 13 }}>
              <TableHead cols={[
                { label: 'Usuario' },
                { label: 'Rol' },
                { label: 'Webs creadas', align: 'right' },
                { label: 'Activas', align: 'right' },
                { label: 'Tasa conv.', align: 'right' },
                { label: 'Revenue atribuido', align: 'right' },
                { label: 'Coste IA', align: 'right' },
              ]} />
              <tbody>
                {by_user.map(u => {
                  const convPct = u.count > 0 ? Math.round((u.active / u.count) * 100) : 0
                  return (
                    <tr key={u.user_id} style={{ opacity: u.is_active === false ? 0.5 : 1 }}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar avatar-sm d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                            style={{
                              background: u.role === 'superadmin' ? '#fef3c7' : '#e0e7ff',
                              color: u.role === 'superadmin' ? '#92400e' : '#3730a3',
                              fontWeight: 800, fontSize: 11,
                            }}
                          >
                            {u.name[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="fw-semibold text-body-secondary">{u.name}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`badge rounded-pill ${u.role === 'superadmin' ? 'bg-label-warning' : 'bg-label-primary'}`} style={{ fontSize: 11 }}>
                          {u.role === 'superadmin' ? 'Superadmin' : u.role === 'comercial' ? 'Comercial' : u.role}
                        </span>
                      </td>
                      <td className="py-3 text-end fw-bold text-body-secondary">{u.count}</td>
                      <td className="py-3 text-end">
                        <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>{u.active}</span>
                      </td>
                      <td className="py-3 text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <MiniBar pct={convPct} color="#71dd37" />
                          <span className="text-body-secondary" style={{ fontSize: 11, width: 32, textAlign: 'right' }}>{convPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-end fw-semibold" style={{ color: '#03c3ec' }}>
                        {u.revenue > 0 ? fmtEur(u.revenue) : '—'}
                      </td>
                      <td className="py-3 text-end pe-4 fw-semibold text-primary">
                        {fmtCost(u.cost)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Por vertical + Estado + Campañas ── */}
      <div className="row g-4 mb-5">

        {/* By vertical */}
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
                <Globe size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
                Por vertical
              </h5>
            </div>
            {by_vertical.length === 0 ? (
              <div className="card-body text-center text-muted py-4" style={{ fontSize: 13 }}>Sin datos</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover table-sm mb-0" style={{ fontSize: 13 }}>
                  <TableHead cols={[{ label: 'Sector' }, { label: 'Total', align: 'right' }, { label: 'Activas', align: 'right' }]} />
                  <tbody>
                    {by_vertical.map(v => (
                      <tr key={v.vertical}>
                        <td className="ps-4 py-2 fw-medium text-body-secondary">
                          {VERTICAL_LABEL[v.vertical] ?? v.vertical}
                        </td>
                        <td className="py-2 text-end fw-bold text-body-secondary">{v.count}</td>
                        <td className="py-2 text-end pe-4">
                          {v.active > 0
                            ? <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>{v.active}</span>
                            : <span className="text-body-secondary" style={{ fontSize: 12 }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
                <Activity size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
                Por estado
              </h5>
            </div>
            <div className="card-body">
              {[
                { label: 'Demo',     n: summary.demo_sites,     color: '#ffab00' },
                { label: 'Activas',  n: summary.active_sites,   color: '#71dd37' },
                { label: 'Inactivas',n: summary.inactive_sites, color: '#8592a3' },
                { label: 'Expiradas',n: summary.expired_sites,  color: '#ff3e1d' },
              ].map(s => {
                const pct = summary.total_sites > 0 ? Math.round((s.n / summary.total_sites) * 100) : 0
                return (
                  <div key={s.label} className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="fw-medium text-body-secondary" style={{ fontSize: 12 }}>{s.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
                        {s.n} <span className="text-body-secondary fw-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 8, background: '#f0f1f5', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: s.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between">
                  <span className="text-body-secondary" style={{ fontSize: 12 }}>Total generadas</span>
                  <span className="fw-bold text-body-secondary" style={{ fontSize: 13 }}>{summary.total_sites}</span>
                </div>
                <div className="d-flex justify-content-between mt-1">
                  <span className="text-body-secondary" style={{ fontSize: 12 }}>Solo externas</span>
                  <span className="text-body-secondary" style={{ fontSize: 12 }}>{summary.external_sites}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns */}
        <div className="col-xl-4">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>
                <Mail size={14} className="me-2" style={{ verticalAlign: '-2px', color: '#696cff' }} />
                Campañas de email
              </h5>
            </div>
            <div className="card-body">
              {campaigns_summary.total === 0 ? (
                <p className="text-center text-muted py-4" style={{ fontSize: 13 }}>Sin campañas aún</p>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {[
                    { label: 'Campañas enviadas', n: campaigns_summary.sent, total: campaigns_summary.total, icon: Mail, color: '#696cff' },
                    { label: 'Emails enviados',   n: campaigns_summary.total_leads_sent, total: campaigns_summary.total_leads_sent, icon: MousePointerClick, color: '#03c3ec' },
                    { label: 'Abiertos',          n: campaigns_summary.total_opened,    total: campaigns_summary.total_leads_sent, icon: Eye,              color: '#ffab00' },
                    { label: 'Demos visitadas',   n: campaigns_summary.total_visited,   total: campaigns_summary.total_leads_sent, icon: Globe,            color: '#8592a3' },
                    { label: 'Convertidos',       n: campaigns_summary.total_converted, total: campaigns_summary.total_leads_sent, icon: CheckCircle,      color: '#71dd37' },
                  ].map(s => {
                    const pct = s.total > 0 ? Math.round((s.n / s.total) * 100) : 0
                    return (
                      <div key={s.label} className="d-flex align-items-center gap-3">
                        <s.icon size={14} color={s.color} style={{ flexShrink: 0 }} />
                        <span className="flex-fill text-body-secondary" style={{ fontSize: 12 }}>{s.label}</span>
                        <span className="fw-bold" style={{ fontSize: 13, color: s.color }}>{s.n}</span>
                        {s.total !== s.n && (
                          <span className="text-body-secondary" style={{ fontSize: 11, width: 34, textAlign: 'right' }}>{pct}%</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
