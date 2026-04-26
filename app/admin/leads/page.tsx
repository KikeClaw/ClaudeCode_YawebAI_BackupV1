'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Lead } from '@/types'
import { PageHeader } from '@/components/admin/AdminUI'
import { X, Loader2, RefreshCw, ExternalLink } from 'lucide-react'

const VERTICALS = ['generic', 'restaurant', 'bar', 'salon', 'clinic', 'academy', 'shop', 'workshop', 'gym', 'lawyer', 'hotel', 'pharmacy']
const VERTICAL_LABELS: Record<string, string> = {
  generic: 'Genérico', restaurant: 'Restaurante', bar: 'Bar/Café',
  salon: 'Peluquería', clinic: 'Clínica', academy: 'Academia',
  shop: 'Tienda', workshop: 'Taller', gym: 'Gimnasio',
  lawyer: 'Abogado', hotel: 'Hotel', pharmacy: 'Farmacia',
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-label-secondary', demo_generating: 'bg-label-info',
  demo_ready: 'bg-label-warning', email_sent: 'bg-label-primary',
  demo_visited: 'bg-label-warning', converted: 'bg-label-success', rejected: 'bg-label-danger',
}
const STATUS_LABEL: Record<string, string> = {
  new: 'Nuevo', demo_generating: 'Generando...', demo_ready: 'Demo lista',
  email_sent: 'Email enviado', demo_visited: 'Visitó demo', converted: 'Convertido', rejected: 'Rechazado',
}

const PIPELINE_STAGES = [
  { key: 'new',          label: 'Nuevos',        badgeCls: 'bg-label-secondary' },
  { key: 'demo_ready',   label: 'Demo lista',     badgeCls: 'bg-label-warning'   },
  { key: 'email_sent',   label: 'Email enviado',  badgeCls: 'bg-label-primary'   },
  { key: 'demo_visited', label: 'Visitó demo',    badgeCls: 'bg-label-warning'   },
  { key: 'converted',    label: 'Convertido',     badgeCls: 'bg-label-success'   },
] as const

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  const s = d.startsWith('00') ? d.slice(2) : d
  return s.length <= 9 ? `34${s}` : s
}

// ── Edit modal ────────────────────────────────────────────────────────────────
interface EditModal {
  lead: Lead
  email:  string
  phone:  string
  notes:  string
  status: string
  saving: boolean
}

function LeadEditModal({ modal, onChange, onSave, onClose }: {
  modal: EditModal
  onChange: (patch: Partial<EditModal>) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,.45)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ fontSize: 15 }}>Editar lead — {modal.lead.business_name}</h5>
            <button onClick={onClose} className="btn-close" />
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={modal.email}
                  onChange={e => onChange({ email: e.target.value })}
                  placeholder="email@negocio.com"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Teléfono</label>
                <input
                  type="tel"
                  className="form-control"
                  value={modal.phone}
                  onChange={e => onChange({ phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Estado</label>
                <select
                  className="form-select"
                  value={modal.status}
                  onChange={e => onChange({ status: e.target.value })}
                >
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold" style={{ fontSize: 13 }}>Notas internas</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={modal.notes}
                  onChange={e => onChange({ notes: e.target.value })}
                  placeholder="Contexto, conversación, próximos pasos..."
                  style={{ resize: 'none', fontSize: 13 }}
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button onClick={onClose} className="btn btn-outline-secondary" style={{ fontSize: 13 }}>
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={modal.saving}
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              {modal.saving && <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} />}
              {modal.saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads, setLeads]             = useState<Lead[]>([])
  const [loading, setLoading]         = useState(false)
  const [city, setCity]               = useState('')
  const [vertical, setVertical]       = useState('restaurant')
  const [scrapeNoWebsite, setScrapeNoWebsite]     = useState(false)
  const [scrapeExcludeKnown, setScrapeExcludeKnown] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [message, setMessage]         = useState<{ text: string; ok: boolean } | null>(null)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [filterStage, setFilterStage] = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [editModal, setEditModal]     = useState<EditModal | null>(null)
  const [regenIds, setRegenIds]       = useState<Set<string>>(new Set()) // leads currently regenerating

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/leads')
    if (res.ok) setLeads(await res.json())
    setLoading(false)
  }, [])
  useEffect(() => { fetchLeads() }, [fetchLeads])

  // ── Scrape ────────────────────────────────────────────────────────────────
  async function handleScrape() {
    if (!city) return
    setActionLoading(true)
    setMessage(null)
    const res = await fetch('/api/leads/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, vertical, limit: 20, noWebsite: scrapeNoWebsite, excludeKnown: scrapeExcludeKnown }),
    })
    const data = await res.json()
    setMessage(res.ok
      ? { text: `${data.count} leads guardados de ${city}`, ok: true }
      : { text: data.error, ok: false }
    )
    await fetchLeads()
    setActionLoading(false)
  }

  // ── Bulk generate demos ───────────────────────────────────────────────────
  async function handleGenerateDemos() {
    const ids = Array.from(selected)
    if (!ids.length) return
    setActionLoading(true)
    setMessage({ text: 'Generando demos con Sonnet… puede tardar unos minutos', ok: true })
    const res = await fetch('/api/leads/generate-demos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_ids: ids }),
    })
    const data = await res.json()
    const ok = data.results?.filter((r: { success: boolean }) => r.success).length || 0
    setMessage({ text: `${ok} demos generadas correctamente`, ok: true })
    setSelected(new Set())
    await fetchLeads()
    setActionLoading(false)
  }

  // ── Regenerate single lead ────────────────────────────────────────────────
  async function handleRegenerate(lead: Lead) {
    setRegenIds(prev => new Set(prev).add(lead.id))
    try {
      const res = await fetch(`/api/leads/${lead.id}/regenerate`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === lead.id
          ? { ...l, demo_slug: data.slug, status: 'demo_ready' as const }
          : l
        ))
      } else {
        setMessage({ text: `Error regenerando: ${data.error}`, ok: false })
      }
    } catch {
      setMessage({ text: 'Error de red al regenerar', ok: false })
    }
    setRegenIds(prev => { const n = new Set(prev); n.delete(lead.id); return n })
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  async function handleReject(leadId: string) {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'rejected' }),
    })
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: 'rejected' as const } : l))
  }

  // ── Edit modal ────────────────────────────────────────────────────────────
  function openEdit(lead: Lead) {
    setEditModal({ lead, email: lead.email || '', phone: lead.phone || '', notes: lead.notes || '', status: lead.status, saving: false })
  }
  async function saveEdit() {
    if (!editModal) return
    setEditModal(m => m ? { ...m, saving: true } : null)
    await fetch(`/api/leads/${editModal.lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: editModal.email, phone: editModal.phone, notes: editModal.notes, status: editModal.status }),
    })
    setLeads(prev => prev.map(l => l.id === editModal.lead.id
      ? { ...l, email: editModal.email, phone: editModal.phone, notes: editModal.notes, status: editModal.status as Lead['status'] }
      : l
    ))
    setEditModal(null)
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stageCounts = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter(l => l.status === s.key).length
    return acc
  }, {} as Record<string, number>)

  const totalActive = leads.filter(l => l.status !== 'rejected').length
  const convRate = totalActive > 0 ? Math.round((stageCounts['converted'] || 0) / totalActive * 100) : 0

  const stageLeads   = filterStage ? leads.filter(l => l.status === filterStage) : leads
  const visibleLeads = useMemo(() => {
    if (!search.trim()) return stageLeads
    const q = search.toLowerCase()
    return stageLeads.filter(l =>
      l.business_name.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    )
  }, [stageLeads, search])

  const newLeads = leads.filter(l => l.status === 'new')

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      {editModal && (
        <LeadEditModal
          modal={editModal}
          onChange={p => setEditModal(m => m ? { ...m, ...p } : null)}
          onSave={saveEdit}
          onClose={() => setEditModal(null)}
        />
      )}

      <PageHeader
        title="Leads"
        subtitle={`${leads.length} leads · ${leads.filter(l => l.status === 'converted').length} convertidos · ${convRate}% conversión`}
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Leads' }]}
        action={
          <button onClick={fetchLeads} className="btn btn-outline-secondary" style={{ padding: '6px 10px' }}>
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
        }
      />

      {/* ── Funnel stats ── */}
      <div className="card mb-4">
        <div className="card-body py-3">
          <div className="d-flex align-items-center gap-1 flex-wrap" style={{ fontSize: 13 }}>
            {PIPELINE_STAGES.map((stage, i) => {
              const count = stageCounts[stage.key] || 0
              const prevCount = i > 0 ? (stageCounts[PIPELINE_STAGES[i-1].key] || 0) : null
              const rate = prevCount ? Math.round(count / prevCount * 100) : null
              return (
                <div key={stage.key} className="d-flex align-items-center gap-1">
                  <button
                    onClick={() => setFilterStage(filterStage === stage.key ? null : stage.key)}
                    className={`d-flex align-items-center gap-2 px-3 py-2 rounded border-0 ${filterStage === stage.key ? 'bg-primary text-white' : 'bg-label-secondary text-body'}`}
                    style={{ cursor: 'pointer', transition: 'all .15s', fontSize: 12 }}
                  >
                    <span className="fw-black" style={{ fontSize: 18, lineHeight: 1 }}>{count}</span>
                    <span className="fw-semibold">{stage.label}</span>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <div className="text-body-secondary d-flex flex-column align-items-center" style={{ fontSize: 10, minWidth: 32 }}>
                      <span>→</span>
                      {rate !== null && <span className="fw-bold" style={{ color: rate >= 50 ? '#28a745' : rate >= 20 ? '#fd7e14' : '#dc3545' }}>{rate}%</span>}
                    </div>
                  )}
                </div>
              )
            })}
            {filterStage && (
              <button onClick={() => setFilterStage(null)} className="btn btn-sm btn-link text-muted p-1 ms-1">
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scraper ── */}
      <div className="card mb-6">
        <div className="card-header">
          <h5 className="card-title mb-0 d-flex align-items-center gap-2">
            <i className="icon-base bx bx-search-alt icon-md" />
            Buscar negocios
          </h5>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label">Ciudad</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
                placeholder="Madrid, Barcelona..."
                className="form-control"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Categoría</label>
              <select value={vertical} onChange={e => setVertical(e.target.value)} className="form-select">
                {VERTICALS.map(v => <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <button
                onClick={handleScrape}
                disabled={actionLoading || !city}
                className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <i className="icon-base bx bx-search icon-sm" />
                {actionLoading ? 'Buscando...' : 'Buscar leads'}
              </button>
            </div>
            <div className="col-12 d-flex flex-wrap gap-3 pt-1">
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" id="noWebsite" checked={scrapeNoWebsite} onChange={e => setScrapeNoWebsite(e.target.checked)} />
                <label className="form-check-label small fw-semibold" htmlFor="noWebsite">Solo sin web</label>
              </div>
              <div className="form-check form-switch mb-0">
                <input className="form-check-input" type="checkbox" id="excludeKnown" checked={scrapeExcludeKnown} onChange={e => setScrapeExcludeKnown(e.target.checked)} />
                <label className="form-check-label small fw-semibold" htmlFor="excludeKnown">Excluir ya guardados</label>
              </div>
            </div>
          </div>
          {message && (
            <div className={`alert ${message.ok ? 'alert-success' : 'alert-danger'} mt-3 mb-0 py-2`} role="alert">
              {message.text}
            </div>
          )}
        </div>
      </div>

      {/* ── Bulk actions ── */}
      {selected.size > 0 && (
        <div className="alert alert-primary d-flex align-items-center justify-content-between mb-4" role="alert">
          <span className="fw-semibold">{selected.size} seleccionados</span>
          <div className="d-flex gap-2">
            <button onClick={handleGenerateDemos} disabled={actionLoading} className="btn btn-sm btn-primary d-flex align-items-center gap-1">
              <i className="icon-base bx bx-magic icon-sm" /> Generar demos (Sonnet)
            </button>
            <button onClick={() => setSelected(new Set())} className="btn btn-sm btn-outline-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {newLeads.length > 0 && selected.size === 0 && (
        <button onClick={() => setSelected(new Set(newLeads.map(l => l.id)))} className="btn btn-sm btn-link text-primary p-0 mb-3 fw-semibold text-decoration-none">
          Seleccionar todos los nuevos ({newLeads.length})
        </button>
      )}

      {/* ── Search ── */}
      <div className="input-group mb-4">
        <span className="input-group-text"><i className="icon-base bx bx-search icon-sm" /></span>
        <input type="text" placeholder="Buscar por nombre, ciudad, email o teléfono…" value={search} onChange={e => setSearch(e.target.value)} className="form-control" />
      </div>

      {/* ── Leads table ── */}
      {loading ? (
        <div className="card card-body text-center py-5 text-body-secondary">
          <div className="spinner-border spinner-border-sm mx-auto mb-2" role="status" />
          Cargando...
        </div>
      ) : visibleLeads.length === 0 ? (
        <div className="card card-body text-center py-5">
          <i className="icon-base bx bx-user-pin text-body-secondary d-block mb-2" style={{ fontSize: 40 }} />
          <p className="text-body-secondary mb-0">{filterStage ? 'No hay leads en esta etapa' : 'Sin leads aún — usa el buscador de arriba'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 32 }}></th>
                  <th>Negocio</th>
                  <th>Ciudad</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                  <th>Sector</th>
                  <th>Demo</th>
                  <th>Fecha</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map(lead => {
                  const badgeCls  = STATUS_BADGE[lead.status] || STATUS_BADGE.new
                  const label     = STATUS_LABEL[lead.status] || 'Nuevo'
                  const isSel     = selected.has(lead.id)
                  const canSelect = lead.status === 'new'
                  const demoUrl   = lead.demo_slug ? `${APP_URL}/demo/${lead.demo_slug}` : ''
                  const waPhone   = lead.phone ? formatPhone(lead.phone) : ''
                  const waUrl     = lead.phone && lead.demo_slug
                    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(`Hola, hemos creado una web demo para ${lead.business_name}: ${demoUrl}`)}`
                    : ''
                  const isRegen   = regenIds.has(lead.id)

                  return (
                    <tr key={lead.id} className={isSel ? 'table-active' : ''}>
                      <td>
                        {canSelect && (
                          <input type="checkbox" className="form-check-input" checked={isSel} onChange={() => toggleSelect(lead.id)} />
                        )}
                      </td>
                      <td>
                        <div className="fw-semibold text-body">{lead.business_name}</div>
                        {lead.notes && (
                          <div className="text-body-secondary" style={{ fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            📝 {lead.notes}
                          </div>
                        )}
                        {lead.has_website && <span className="badge bg-label-secondary ms-1" style={{ fontSize: 10 }}>tiene web</span>}
                      </td>
                      <td className="text-body-secondary">{lead.city || '—'}</td>
                      <td className="text-body-secondary">{lead.phone || '—'}</td>
                      <td className="text-body-secondary">{lead.email || <span className="text-danger" style={{ fontSize: 11 }}>sin email</span>}</td>
                      <td><span className={`badge rounded-pill ${badgeCls}`}>{label}</span></td>
                      <td className="text-body-secondary">{VERTICAL_LABELS[lead.vertical] || lead.vertical}</td>
                      <td>
                        {demoUrl
                          ? <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1 text-primary text-decoration-none fw-semibold" style={{ fontSize: 12 }}>
                              <ExternalLink style={{ width: 11, height: 11 }} /> Ver
                            </a>
                          : <span className="text-body-secondary" style={{ fontSize: 11 }}>—</span>}
                      </td>
                      <td className="text-body-secondary" style={{ whiteSpace: 'nowrap' }}>
                        {lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1 flex-wrap">
                          {/* Edit */}
                          <button
                            onClick={() => openEdit(lead)}
                            className="btn btn-sm btn-outline-secondary"
                            title="Editar lead"
                          >
                            <i className="icon-base bx bx-pencil icon-xs" />
                          </button>
                          {/* Regenerar */}
                          {lead.google_place_id && (
                            <button
                              onClick={() => handleRegenerate(lead)}
                              disabled={isRegen}
                              className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                              title="Regenerar demo con Sonnet"
                            >
                              {isRegen
                                ? <Loader2 className="animate-spin" style={{ width: 11, height: 11 }} />
                                : <i className="icon-base bx bx-refresh icon-xs" />}
                            </button>
                          )}
                          {/* Ver demo */}
                          {lead.demo_slug && (
                            <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1">
                              <i className="icon-base bx bx-link-external icon-xs" /> Demo
                            </a>
                          )}
                          {/* WhatsApp */}
                          {waUrl && (
                            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success d-flex align-items-center gap-1">
                              <i className="icon-base bx bxl-whatsapp icon-sm" /> WA
                            </a>
                          )}
                          {/* Rechazar */}
                          {lead.status !== 'rejected' && lead.status !== 'converted' && (
                            <button onClick={() => handleReject(lead.id)} className="btn btn-sm btn-outline-danger" title="Rechazar">✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
