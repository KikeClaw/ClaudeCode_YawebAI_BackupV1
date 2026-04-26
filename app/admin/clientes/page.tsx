export const dynamic = 'force-dynamic'

import { getClients } from '@/lib/db/clients'
import { Users } from 'lucide-react'
import { ClientsList } from '@/components/admin/ClientsList'
import { PageHeader, ActionButton } from '@/components/admin/AdminUI'

export default async function ClientesPage() {
  const all = await getClients().catch(() => [])
  const now = new Date()

  // Only active paid clients (no demos, no internal test sites)
  const paid = all.filter(c => c.paid_at && !c.is_internal && !c.is_portfolio)
  const activas = paid.filter(c =>
    c.status === 'active' && (!c.expires_at || new Date(c.expires_at) > now)
  )
  const expiradas = paid.filter(c =>
    c.status === 'expired' || (c.expires_at && new Date(c.expires_at) < now)
  )

  const stats = {
    active:   activas.length,
    expiring: activas.filter(c =>
      c.expires_at && new Date(c.expires_at).getTime() - now.getTime() < 30 * 86_400_000
    ).length,
    expired:  expiradas.length,
    revenue:  activas.reduce((sum, c) => sum + (c.annual_amount || 99), 0),
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Clientes"
        subtitle={`${activas.length} activos · ${expiradas.length} expirados · ${stats.revenue}€/año`}
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Clientes' }]}
        action={
          <ActionButton href="/admin/clients/new" variant="primary" size="sm">
            <Users style={{ width: 13, height: 13 }} /> Nueva web
          </ActionButton>
        }
      />
      <ClientsList
        pipeline={[]}
        activas={activas}
        expiradas={expiradas}
        pruebas={[]}
        portfolio={[]}
        stats={stats}
        defaultTab="activas"
      />
    </div>
  )
}
