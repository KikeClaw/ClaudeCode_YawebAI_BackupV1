export const dynamic = 'force-dynamic'

import { getClients } from '@/lib/db/clients'
import { getLeads } from '@/lib/db/leads'
import { getCampaigns } from '@/lib/db/campaigns'
import Link from 'next/link'
import { StatusBadge } from '@/components/admin/AdminUI'

// Sneat colour tokens — mapped to Bootstrap bg-label-* classes
const COLOR: Record<string, string> = {
  primary: 'primary',
  success:  'success',
  info:     'info',
  warning:  'warning',
}

type ColorKey = keyof typeof COLOR

const stats: { label: string; icon: string; color: string; href?: string; sub?: string; valueKey: string }[] = [
  { label: 'Webs activas',     icon: 'bx-globe',       color: 'success', href: '/admin/clients', sub: 'total',   valueKey: 'active'   },
  { label: 'Demos generadas',  icon: 'bx-monitor',     color: 'info',    href: '/admin/clients',                 valueKey: 'demo'     },
  { label: 'Ingresos anuales', icon: 'bx-trending-up', color: 'primary',                                         valueKey: 'revenue'  },
  { label: 'Leads totales',    icon: 'bx-group',       color: 'warning', href: '/admin/leads',                   valueKey: 'leads'    },
]

export default async function AdminDashboard() {
  const [clients, leads] = await Promise.all([
    getClients().catch(() => []),
    getLeads().catch(() => []),
    getCampaigns().catch(() => []),
  ])

  const production  = clients.filter(c => !c.is_internal && !c.is_portfolio)
  const activeCount = production.filter(c => c.status === 'active').length
  const demoCount   = production.filter(c => c.status === 'demo').length
  const revenue     = production.filter(c => c.paid_at).reduce((sum, c) => sum + (c.annual_amount || 99), 0)

  const now = Date.now()
  const expiringSoon = production.filter(c =>
    c.expires_at && c.status === 'active' &&
    new Date(c.expires_at).getTime() > now &&
    new Date(c.expires_at).getTime() - now < 30 * 86_400_000
  )

  const hour = new Date().getHours()
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'
  const todayLabel = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  const statValues: Record<string, string | number> = {
    active:  activeCount,
    demo:    demoCount,
    revenue: `${revenue}€`,
    leads:   leads.length,
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">

      {/* ── Expiring alert ── */}
      {expiringSoon.length > 0 && (
        <div className="alert alert-warning d-flex align-items-start mb-6" role="alert">
          <i className="icon-base bx bx-error-circle icon-md me-3 flex-shrink-0 mt-1" />
          <div>
            <p className="fw-semibold mb-1">
              {expiringSoon.length} web{expiringSoon.length > 1 ? 's' : ''} expira{expiringSoon.length === 1 ? '' : 'n'} en menos de 30 días
            </p>
            <div className="d-flex flex-wrap gap-3">
              {expiringSoon.map(c => {
                const days = Math.ceil((new Date(c.expires_at!).getTime() - now) / 86_400_000)
                return (
                  <Link key={c.id} href={`/admin/clients/${c.id}`} className="alert-link fw-semibold">
                    {c.name} ({days}d)
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Page header ── */}
      <div className="row mb-6">
        <div className="col-12">
          <h4 className="fw-bold mb-1">{greeting} 👋</h4>
          <p className="text-body-secondary mb-0" style={{ textTransform: 'capitalize' }}>{todayLabel}</p>
        </div>
      </div>

      {/* ── KPI cards — Sneat stat pattern ── */}
      <div className="row g-6 mb-6">
        {stats.map(stat => {
          const value = statValues[stat.valueKey]
          return (
            <div key={stat.label} className="col-xl-3 col-lg-6 col-md-6">
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <span className="text-body-secondary d-block mb-1">{stat.label}</span>
                      <h4 className="fw-bold mb-0">{value}</h4>
                      {stat.sub === 'total' && (
                        <small className="text-body-secondary">{production.length} total</small>
                      )}
                    </div>
                    <div className={`avatar avatar-md`}>
                      <span className={`avatar-initial rounded bg-label-${stat.color}`}>
                        <i className={`icon-base bx ${stat.icon} icon-md`} />
                      </span>
                    </div>
                  </div>
                  {stat.href && (
                    <Link href={stat.href} className="fw-semibold text-primary small">Ver más →</Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Quick actions ── */}
      <div className="row mb-2">
        <div className="col-12">
          <p className="text-body-secondary mb-3" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Acciones rápidas
          </p>
        </div>
      </div>
      <div className="row g-6 mb-6">
        {([
          { href: '/admin/clients/new', icon: 'bx-plus-circle', color: 'primary', title: 'Generar web',    desc: 'URL de Google Business → web lista' },
          { href: '/admin/leads',       icon: 'bx-search-alt',  color: 'info',    title: 'Buscar leads',   desc: 'Scraper de negocios por ciudad' },
          { href: '/admin/whatsapp',    icon: 'bxl-whatsapp',   color: 'success', title: 'WhatsApp IA',    desc: 'Mensajes personalizados a demos' },
          { href: '/admin/campaigns',   icon: 'bx-mail-send',   color: 'warning', title: 'Campañas email', desc: 'Demos masivos personalizados' },
        ] as { href: string; icon: string; color: string; title: string; desc: string }[]).map(action => (
          <div key={action.href} className="col-md-3 col-sm-6">
            <Link href={action.href} className="card h-100 text-decoration-none">
              <div className="card-body">
                <div className={`avatar avatar-md mb-3`}>
                  <span className={`avatar-initial rounded bg-label-${action.color}`}>
                    <i className={`icon-base bx ${action.icon} icon-md`} />
                  </span>
                </div>
                <h6 className="fw-semibold mb-1">{action.title}</h6>
                <p className="text-body-secondary small mb-0" style={{ lineHeight: 1.5 }}>{action.desc}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* ── Recent webs ── */}
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h5 className="card-title mb-0">Webs recientes</h5>
          <Link href="/admin/clients" className="btn btn-sm btn-outline-primary">Ver todas →</Link>
        </div>

        {production.length === 0 ? (
          <div className="card-body text-center py-5">
            <i className="icon-base bx bx-globe icon-xl text-body-secondary d-block mb-3" />
            <p className="text-body-secondary mb-3">Sin webs aún</p>
            <Link href="/admin/clients/new" className="btn btn-primary btn-sm">
              <i className="icon-base bx bx-plus icon-sm me-2" />Crea la primera
            </Link>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Slug</th>
                  <th className="text-end">Estado</th>
                </tr>
              </thead>
              <tbody>
                {production.slice(0, 8).map(client => (
                  <tr key={client.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar avatar-sm">
                          <span className="avatar-initial rounded-circle bg-label-primary">
                            {client.name[0]?.toUpperCase()}
                          </span>
                        </div>
                        <Link href={`/admin/clients/${client.id}`} className="fw-semibold text-body-primary text-decoration-none">
                          {client.name}
                        </Link>
                      </div>
                    </td>
                    <td className="text-body-secondary">/{client.slug}</td>
                    <td className="text-end">
                      <StatusBadge status={client.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
