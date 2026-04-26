export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import {
  Eye, Clock, DollarSign, CalendarDays, Star,
  Building2, Globe, Monitor, Cpu,
} from 'lucide-react'
import { getClientById, getSiteVersions } from '@/lib/db/clients'
import { ClientActions } from '@/components/admin/ClientActions'
import { QuickEditor } from '@/components/admin/QuickEditor'
import { VersionsPanel } from '@/components/admin/VersionsPanel'
import { ClientDetailPanels } from '@/components/admin/ClientDetailPanels'
import { PageHeader } from '@/components/admin/AdminUI'

// ── Helpers ────────────────────────────────────────────────────────────────────

function modelLabel(model?: string | null): string {
  if (!model) return 'Sonnet'
  if (model.includes('opus'))   return 'Opus 4.7'
  if (model.includes('haiku'))  return 'Haiku 4.5'
  if (model === 'gpt-4o')       return 'GPT-4o'
  if (model === 'gemini-2.5-flash') return 'Gemini 2.5 Flash'
  if (model === 'gemini-2.5-pro')  return 'Gemini 2.5 Pro'
  if (model.includes('gemini'))    return 'Gemini 2.0 Flash'
  if (model.includes('groq'))  return 'Llama 3.3'
  return 'Sonnet 4.6'
}

function fmtDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateLong(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

const VERTICAL_LABELS: Record<string, string> = {
  generic: 'Genérico', restaurant: 'Restaurante', bar: 'Bar / Café',
  salon: 'Peluquería', clinic: 'Clínica', academy: 'Academia',
  shop: 'Tienda', workshop: 'Taller', gym: 'Gimnasio',
  lawyer: 'Abogado', hotel: 'Hotel', pharmacy: 'Farmacia',
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [client, versions] = await Promise.all([
    getClientById(id),
    getSiteVersions(id).catch(() => []),
  ])

  if (!client) notFound()

  const days = client.expires_at
    ? Math.ceil((new Date(client.expires_at).getTime() - Date.now()) / 86_400_000)
    : null

  const expiryColor = days === null ? 'secondary'
    : days < 0   ? 'danger'
    : days <= 30  ? 'warning'
    : 'success'

  const isPaid      = !!client.paid_at
  const isPremium   = client.plan === 'premium'
  const isInternal  = !!client.is_internal
  const isPortfolio = !!client.is_portfolio

  // Status badge params
  const statusColor: Record<string, string> = {
    active: 'success', demo: 'info', expired: 'danger', inactive: 'secondary',
  }
  const statusLabel: Record<string, string> = {
    active: 'Activa', demo: 'Demo', expired: 'Expirada', inactive: 'Inactiva',
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        breadcrumb={[
          { label: 'Admin', href: '/admin' },
          { label: 'Webs', href: '/admin/clients' },
          { label: client.name },
        ]}
        title={client.name}
      />

      {/* ── Identity + KPI strip ──────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-start gap-4 flex-wrap">

            {/* Avatar */}
            <div
              className={`avatar-initial rounded d-flex align-items-center justify-content-center flex-shrink-0 ${
                isPortfolio ? 'bg-label-warning' : isPaid ? 'bg-label-success' : 'bg-label-primary'
              }`}
              style={{ width: 56, height: 56, fontSize: 22, fontWeight: 900 }}
            >
              {isPortfolio ? <Star size={24} /> : client.name[0]?.toUpperCase()}
            </div>

            {/* Name + badges */}
            <div className="flex-fill" style={{ minWidth: 0 }}>
              <div className="d-flex align-items-center flex-wrap gap-2 mb-2">
                <h5 className="mb-0 fw-bold" style={{ fontSize: 18, color: '#566a7f' }}>{client.name}</h5>

                {/* Status */}
                <span className={`badge rounded-pill bg-label-${statusColor[client.status] ?? 'secondary'}`} style={{ fontSize: 12 }}>
                  {statusLabel[client.status] ?? client.status}
                </span>

                {/* Plan */}
                {isPaid && (
                  <span className={`badge rounded-pill d-inline-flex align-items-center gap-1 ${isPremium ? 'bg-label-warning' : 'bg-label-secondary'}`} style={{ fontSize: 12 }}>
                    {isPremium && <Star size={10} />}
                    {isPremium ? 'Premium' : 'Basic'}
                  </span>
                )}

                {/* Expiry */}
                {client.expires_at && (
                  <span className={`badge rounded-pill bg-label-${expiryColor}`} style={{ fontSize: 12 }}>
                    {days !== null && days < 0
                      ? `Expirada ${fmtDate(client.expires_at)}`
                      : `Expira ${fmtDate(client.expires_at)} (${days}d)`
                    }
                  </span>
                )}

                {/* Flags */}
                {isInternal && (
                  <span className="badge rounded-pill bg-label-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                    <Building2 size={10} /> Prueba interna
                  </span>
                )}
                {isPortfolio && (
                  <span className="badge rounded-pill bg-label-warning d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                    <Star size={10} /> Portfolio
                  </span>
                )}

                {/* Channel */}
                {client.channel === 'landing' ? (
                  <span className="badge rounded-pill bg-label-primary d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                    <Globe size={10} /> Landing
                  </span>
                ) : (
                  <span className="badge rounded-pill bg-label-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                    <Monitor size={10} /> Admin
                  </span>
                )}

                {/* Model */}
                {client.model && (
                  <span className="badge rounded-pill bg-label-info d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
                    <Cpu size={10} /> {modelLabel(client.model)}
                  </span>
                )}
              </div>

              {/* Sub-line: vertical · slug */}
              <div className="d-flex align-items-center flex-wrap gap-2" style={{ fontSize: 13, color: '#697a8d' }}>
                <span>{VERTICAL_LABELS[client.vertical] ?? client.vertical}</span>
                <span style={{ opacity: 0.35 }}>·</span>
                <a href={`/demo/${client.slug}`} target="_blank" rel="noopener noreferrer"
                  className="font-monospace text-primary text-decoration-none" style={{ fontSize: 12 }}>
                  /{client.slug}
                </a>
                {client.custom_domain && (
                  <>
                    <span style={{ opacity: 0.35 }}>·</span>
                    <span className="text-info">{client.custom_domain}</span>
                  </>
                )}
              </div>
            </div>

            {/* KPI pills — right side */}
            <div className="d-flex gap-3 flex-wrap flex-shrink-0">
              <div className="text-center px-3 py-2 rounded" style={{ background: '#f8f9fa', minWidth: 90 }}>
                <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                  <Clock size={12} className="text-muted" />
                  <span className="text-uppercase fw-bold text-muted" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Creada</span>
                </div>
                <div className="fw-bold" style={{ fontSize: 13, color: '#566a7f' }}>{fmtDate(client.created_at)}</div>
              </div>

              {isPaid && (
                <>
                  <div className="text-center px-3 py-2 rounded" style={{ background: '#f0fdf4', minWidth: 90 }}>
                    <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                      <DollarSign size={12} style={{ color: '#10b981' }} />
                      <span className="text-uppercase fw-bold" style={{ fontSize: 10, letterSpacing: '0.06em', color: '#10b981' }}>Pagado</span>
                    </div>
                    <div className="fw-bold" style={{ fontSize: 13, color: '#059669' }}>{fmtDate(client.paid_at)}</div>
                  </div>

                  {client.annual_amount > 0 && (
                    <div className="text-center px-3 py-2 rounded" style={{ background: '#f0f0ff', minWidth: 80 }}>
                      <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                        <span className="text-uppercase fw-bold" style={{ fontSize: 10, letterSpacing: '0.06em', color: '#696cff' }}>Importe</span>
                      </div>
                      <div className="fw-black tabular-nums" style={{ fontSize: 16, color: '#696cff' }}>
                        {client.annual_amount}€
                        <span style={{ fontSize: 10, fontWeight: 500 }}>/año</span>
                      </div>
                    </div>
                  )}

                  {client.expires_at && (
                    <div className="text-center px-3 py-2 rounded" style={{
                      minWidth: 90,
                      background: days !== null && days < 0 ? '#fff1f2' : days !== null && days <= 30 ? '#fffbeb' : '#f8f9fa',
                    }}>
                      <div className="d-flex align-items-center justify-content-center gap-1 mb-1">
                        <CalendarDays size={12} className="text-muted" />
                        <span className="text-uppercase fw-bold text-muted" style={{ fontSize: 10, letterSpacing: '0.06em' }}>Expira</span>
                      </div>
                      <div className="fw-bold" style={{
                        fontSize: 13,
                        color: days !== null && days < 0 ? '#dc2626' : days !== null && days <= 30 ? '#d97706' : '#566a7f',
                      }}>
                        {fmtDate(client.expires_at)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      <div className="row g-4 align-items-start">

        {/* LEFT — Preview (60%) */}
        <div className="col-lg-7">
          <div className="card">
            {/* Preview toolbar */}
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="text-uppercase fw-bold text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                Vista previa
              </span>
              <a
                href={`/demo/${client.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="d-flex align-items-center gap-1 text-decoration-none fw-semibold"
                style={{ fontSize: 12, color: '#696cff' }}
              >
                <Eye size={12} />
                Abrir en nueva pestaña
              </a>
            </div>
            {/* Iframe */}
            <iframe
              src={`/demo/${client.slug}`}
              style={{ width: '100%', minHeight: 600, height: '72vh', border: 'none', display: 'block' }}
              title={`Vista previa de ${client.name}`}
            />
          </div>
        </div>

        {/* RIGHT — Panels (40%) */}
        <div className="col-lg-5 d-flex flex-column gap-4">

          {/* Contact info / Quick editor */}
          <QuickEditor
            clientId={client.id}
            businessName={client.name}
            initialPhone={client.phone ?? ''}
            initialWhatsapp={client.whatsapp ?? ''}
            initialEmail={client.email ?? ''}
            initialNotes={client.notes ?? ''}
          />

          {/* Site tools */}
          <ClientDetailPanels clientId={client.id} />

          {/* Versions */}
          <VersionsPanel clientId={client.id} versions={versions} />

          {/* Actions */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>Acciones</h5>
            </div>
            <div className="card-body">
              <ClientActions
                clientId={client.id}
                status={client.status}
                paidAt={client.paid_at}
                expiresAt={client.expires_at}
                isInternal={isInternal}
                isPortfolio={isPortfolio}
                variant="detail"
              />
            </div>
          </div>

          {/* Metadata card */}
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0" style={{ fontSize: 13 }}>Información técnica</h5>
            </div>
            <div className="card-body p-0">
              <table className="table table-sm mb-0" style={{ fontSize: 12 }}>
                <tbody>
                  <tr>
                    <td className="fw-semibold text-muted ps-3" style={{ width: '40%' }}>ID</td>
                    <td className="font-monospace pe-3" style={{ fontSize: 11, wordBreak: 'break-all' }}>{client.id}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-muted ps-3">Slug</td>
                    <td className="font-monospace text-primary pe-3">/{client.slug}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-muted ps-3">Creada</td>
                    <td className="pe-3">{fmtDateLong(client.created_at)}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-muted ps-3">Canal</td>
                    <td className="pe-3 text-capitalize">{client.channel ?? 'admin'}</td>
                  </tr>
                  <tr>
                    <td className="fw-semibold text-muted ps-3">Modelo IA</td>
                    <td className="pe-3">{modelLabel(client.model)}</td>
                  </tr>
                  {client.google_business_url && (
                    <tr>
                      <td className="fw-semibold text-muted ps-3">Google</td>
                      <td className="pe-3">
                        <a href={client.google_business_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary text-decoration-none" style={{ fontSize: 11 }}>
                          Ver ficha →
                        </a>
                      </td>
                    </tr>
                  )}
                  {client.github_repo_url && (
                    <tr>
                      <td className="fw-semibold text-muted ps-3">GitHub</td>
                      <td className="pe-3">
                        <a href={client.github_repo_url} target="_blank" rel="noopener noreferrer"
                          className="text-primary text-decoration-none" style={{ fontSize: 11 }}>
                          {client.github_repo_url.replace('https://github.com/', '')} →
                        </a>
                      </td>
                    </tr>
                  )}
                  {client.updated_at && (
                    <tr>
                      <td className="fw-semibold text-muted ps-3">Última edición</td>
                      <td className="pe-3">{fmtDateLong(client.updated_at)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
