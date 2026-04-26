export const dynamic = 'force-dynamic'

import { getClients } from '@/lib/db/clients'
import { Plus } from 'lucide-react'
import { ClientsList } from '@/components/admin/ClientsList'
import { PageHeader, ActionButton } from '@/components/admin/AdminUI'

export default async function ClientsPage() {
  const clients = await getClients().catch(() => [])

  const now = new Date()

  // ── 5-group split ─────────────────────────────────────────────────────────
  // Portfolio  = is_portfolio (can overlap with others — shown here primarily)
  // Pruebas    = is_internal (and not portfolio)
  // Paid webs  = paid_at IS NOT NULL, not internal, not portfolio
  //   Activas  = paid + active + not expired
  //   Expiradas= paid + expired or expires_at < now
  // Pipeline   = no paid_at, not internal, not portfolio

  const portfolio  = clients.filter(c => c.is_portfolio)
  const pruebas    = clients.filter(c => c.is_internal && !c.is_portfolio)
  const paid       = clients.filter(c => c.paid_at && !c.is_internal && !c.is_portfolio)
  const activas    = paid.filter(c =>
    c.status === 'active' && (!c.expires_at || new Date(c.expires_at) > now)
  )
  const expiradas  = paid.filter(c =>
    c.status === 'expired' || (c.expires_at && new Date(c.expires_at) < now)
  )
  const pipeline   = clients.filter(c => !c.paid_at && !c.is_internal && !c.is_portfolio)

  // ── Stats for Activas tab ─────────────────────────────────────────────────
  const stats = {
    active:   activas.length,
    expiring: activas.filter(c =>
      c.expires_at && new Date(c.expires_at).getTime() - now.getTime() < 30 * 86_400_000
    ).length,
    expired:  expiradas.length,
    revenue:  activas.reduce((sum, c) => sum + (c.annual_amount || 99), 0),
  }

  const total = clients.length

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Webs"
        subtitle={`${total} webs · ${activas.length} activas · ${pipeline.length} en pipeline`}
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Webs' }]}
        action={
          <ActionButton href="/admin/clients/new" variant="primary" size="sm">
            <Plus style={{ width: 13, height: 13 }} /> Nueva web
          </ActionButton>
        }
      />
      <ClientsList
        pipeline={pipeline}
        activas={activas}
        expiradas={expiradas}
        pruebas={pruebas}
        portfolio={portfolio}
        stats={stats}
      />
    </div>
  )
}
