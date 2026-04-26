'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Campaign, Lead } from '@/types'
import {
  Mail, Send, Eye, MousePointer, CheckCircle, TrendingUp,
  ChevronDown, ChevronUp, Zap, RefreshCw, X,
} from 'lucide-react'
import { PageHeader, AdminCard } from '@/components/admin/AdminUI'

/* ─────────────────────────────────────────────────────────────
   Email preview modal
───────────────────────────────────────────────────────────── */
interface PreviewData {
  subject: string
  html: string
  text: string
  lead: { id: string; name: string; email: string | null }
}

function PreviewModal({
  preview,
  onClose,
  onSend,
  sending,
}: {
  preview: PreviewData
  onClose: () => void
  onSend: () => void
  sending: boolean
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1055,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: 'var(--bs-body-bg)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between p-4 border-bottom">
          <div>
            <div className="fw-bold text-body" style={{ fontSize: 14 }}>Vista previa del email</div>
            <div className="text-body-secondary" style={{ fontSize: 12, marginTop: 2 }}>
              Para: {preview.lead.name} &lt;{preview.lead.email}&gt;
            </div>
          </div>
          <button onClick={onClose} className="btn btn-sm btn-outline-secondary d-flex align-items-center" style={{ padding: '4px 8px' }}>
            <X style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* Subject line */}
        <div className="px-4 py-3 border-bottom" style={{ background: 'var(--bs-tertiary-bg)' }}>
          <span className="text-body-secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asunto</span>
          <div className="fw-semibold text-body mt-1" style={{ fontSize: 14 }}>{preview.subject}</div>
        </div>

        {/* Email body preview */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <iframe
            srcDoc={preview.html}
            style={{ width: '100%', height: 420, border: 'none', borderRadius: 8 }}
            title="Email preview"
          />
        </div>

        {/* Actions */}
        <div className="d-flex align-items-center justify-content-between p-4 border-top">
          <p className="text-body-secondary mb-0" style={{ fontSize: 12 }}>
            Muestra un email de ejemplo — cada lead recibe su propia versión personalizada
          </p>
          <div className="d-flex gap-2">
            <button onClick={onClose} className="btn btn-outline-secondary" style={{ fontSize: 13 }}>
              Cancelar
            </button>
            <button
              onClick={onSend}
              disabled={sending}
              className="btn btn-primary d-flex align-items-center gap-2"
              style={{ fontSize: 13 }}
            >
              <Send style={{ width: 13, height: 13 }} />
              {sending ? 'Enviando...' : 'Confirmar envío'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Campaign history row (expandable)
───────────────────────────────────────────────────────────── */
const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', demo_generating: 'Generando', demo_ready: 'Demo lista',
  email_sent: 'Email enviado', demo_visited: 'Visitó demo',
  converted: 'Convertido', rejected: 'Rechazado',
}

function CampaignRow({
  c,
  leads,
  idx,
  total,
  onFollowup,
  followingUp,
}: {
  c: Campaign
  leads: Lead[]
  idx: number
  total: number
  onFollowup: (id: string) => void
  followingUp: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const campaignLeads = leads.filter(l => l.campaign_id === c.id)

  return (
    <div className={idx < total - 1 ? 'border-bottom' : ''}>
      {/* Summary row */}
      <div className="px-4 py-3">
        <div className="d-flex align-items-start justify-content-between mb-2">
          <div style={{ flex: 1 }}>
            <div className="fw-bold text-body" style={{ fontSize: 13 }}>{c.name}</div>
            <div className="text-body-secondary" style={{ fontSize: 12, marginTop: 2 }}>{c.subject}</div>
          </div>
          <div className="d-flex align-items-center gap-2 ms-3">
            {c.sent_at && (
              <span className="text-body-secondary" style={{ fontSize: 11 }}>
                {new Date(c.sent_at).toLocaleDateString('es-ES')}
              </span>
            )}
            {/* Follow-up button — only if there were non-openers */}
            {c.sent_count > 0 && c.opened_count < c.sent_count && (
              <button
                onClick={() => onFollowup(c.id)}
                disabled={followingUp === c.id}
                className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1"
                style={{ fontSize: 11 }}
                title="Enviar follow-up a los que no abrieron"
              >
                <Zap style={{ width: 11, height: 11 }} />
                {followingUp === c.id ? 'Enviando...' : `Follow-up (${c.sent_count - c.opened_count})`}
              </button>
            )}
            {/* Expand button — only if we have lead data */}
            {campaignLeads.length > 0 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                style={{ fontSize: 11 }}
              >
                {expanded ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />}
                {expanded ? 'Ocultar' : `Ver ${campaignLeads.length}`}
              </button>
            )}
          </div>
        </div>

        {/* Stats strip */}
        <div className="d-flex flex-wrap gap-3 text-body-secondary" style={{ fontSize: 12 }}>
          <span className="d-flex align-items-center gap-1">
            <Send style={{ width: 11, height: 11 }} />{c.sent_count} enviados
          </span>
          <span className="d-flex align-items-center gap-1">
            <Eye style={{ width: 11, height: 11 }} />{c.opened_count} abrieron
          </span>
          <span className="d-flex align-items-center gap-1">
            <MousePointer style={{ width: 11, height: 11 }} />{c.visited_count} visitaron
          </span>
          <span className="d-flex align-items-center gap-1">
            <CheckCircle style={{ width: 11, height: 11 }} />{c.converted_count} convirtieron
          </span>
          {c.sent_count > 0 && (
            <span className="d-flex align-items-center gap-1 fw-semibold text-success">
              <TrendingUp style={{ width: 11, height: 11 }} />
              {Math.round(c.opened_count / c.sent_count * 100)}% apertura
            </span>
          )}
        </div>
      </div>

      {/* Expandable lead list */}
      {expanded && campaignLeads.length > 0 && (
        <div className="px-4 pb-3" style={{ background: 'var(--bs-tertiary-bg)' }}>
          <div className="rounded border overflow-hidden">
            {campaignLeads.map((lead, i) => (
              <div
                key={lead.id}
                className={`d-flex align-items-center justify-content-between px-3 py-2 ${i < campaignLeads.length - 1 ? 'border-bottom' : ''}`}
                style={{ fontSize: 12 }}
              >
                <div>
                  <span className="fw-semibold text-body">{lead.business_name}</span>
                  {lead.email && (
                    <span className="text-body-secondary ms-2">{lead.email}</span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-2">
                  {lead.email_opened_at && (
                    <span className="d-flex align-items-center gap-1 text-primary" title={`Abrió: ${new Date(lead.email_opened_at).toLocaleString('es-ES')}`}>
                      <Eye style={{ width: 10, height: 10 }} /> Abrió
                    </span>
                  )}
                  {lead.demo_visited_at && (
                    <span className="d-flex align-items-center gap-1 text-info" title={`Visitó: ${new Date(lead.demo_visited_at).toLocaleString('es-ES')}`}>
                      <MousePointer style={{ width: 10, height: 10 }} /> Visitó
                    </span>
                  )}
                  <span
                    className={`badge rounded-pill ${
                      lead.status === 'converted' ? 'bg-label-success' :
                      lead.status === 'demo_visited' ? 'bg-label-info' :
                      lead.status === 'email_sent' ? 'bg-label-primary' :
                      lead.status === 'rejected' ? 'bg-label-danger' :
                      'bg-label-secondary'
                    }`}
                    style={{ fontSize: 10 }}
                  >
                    {STATUS_LABELS[lead.status] || lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────────── */
export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewData | null>(null)
  const [followingUp, setFollowingUp] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const [form, setForm] = useState({ name: '', subject: '', body_html: '', use_ai: true })

  const readyLeads = leads.filter(l => l.status === 'demo_ready' && l.email && l.demo_slug)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [cRes, lRes] = await Promise.all([fetch('/api/campaigns'), fetch('/api/leads')])
    if (cRes.ok) setCampaigns(await cRes.json())
    if (lRes.ok) setLeads(await lRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Preview → send flow ── */
  async function handlePreview(e: React.FormEvent) {
    e.preventDefault()
    if (!readyLeads.length) return
    setPreviewing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/campaigns/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: readyLeads[0].id }),
      })
      const data = await res.json()
      if (res.ok) {
        setPreviewData(data)
      } else {
        setMessage({ text: data.error || 'Error generando preview', ok: false })
      }
    } catch (err) {
      setMessage({ text: String(err), ok: false })
    }
    setPreviewing(false)
  }

  async function handleSend() {
    setSending(true)
    setMessage(null)
    const res = await fetch('/api/campaigns/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_ids: readyLeads.map(l => l.id),
        campaign_name: form.name,
        subject: form.subject,
        body_html: form.body_html,
        use_ai: form.use_ai,
      }),
    })
    const data = await res.json()
    setPreviewData(null)
    setMessage(res.ok
      ? { text: `${data.sent} emails enviados (${data.failed} fallaron)`, ok: true }
      : { text: data.error, ok: false }
    )
    await fetchData()
    setSending(false)
  }

  /* ── Follow-up ── */
  async function handleFollowup(campaignId: string) {
    setFollowingUp(campaignId)
    const res = await fetch(`/api/campaigns/${campaignId}/followup`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setMessage({ text: `Follow-up enviado a ${data.sent} leads`, ok: true })
    } else {
      setMessage({ text: data.error || 'Error enviando follow-up', ok: false })
    }
    await fetchData()
    setFollowingUp(null)
  }

  return (
    <>
      {previewData && (
        <PreviewModal
          preview={previewData}
          onClose={() => setPreviewData(null)}
          onSend={handleSend}
          sending={sending}
        />
      )}

      <div className="container-xxl flex-grow-1 container-p-y">
        <PageHeader
          title="Campañas de email"
          subtitle={`${readyLeads.length} leads con demo lista para enviar`}
          breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Campañas' }]}
          action={
            <button
              onClick={fetchData}
              disabled={loading}
              className="btn btn-outline-secondary d-flex align-items-center"
              style={{ padding: '6px 10px' }}
            >
              <RefreshCw style={{ width: 15, height: 15, opacity: loading ? 0.4 : 1 }} />
            </button>
          }
        />

        {/* Nueva campaña */}
        <AdminCard
          title="Nueva campaña"
          titleIcon={<Mail style={{ width: 14, height: 14 }} />}
          style={{ marginBottom: 20 }}
        >
          {readyLeads.length === 0 ? (
            <div className="text-center py-5">
              <div className="d-flex justify-content-center mb-3">
                <Mail style={{ width: 28, height: 28, color: '#dee2e6' }} />
              </div>
              <p className="text-muted mb-1" style={{ fontSize: 13 }}>No hay leads con demo lista y email.</p>
              <p className="text-muted" style={{ fontSize: 12 }}>
                Ve a <strong className="text-body">Leads</strong>, genera demos y añade emails primero.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePreview}>
              <div className="alert alert-primary d-flex align-items-center gap-2 mb-4" style={{ fontSize: 13 }}>
                <Send style={{ width: 14, height: 14, flexShrink: 0 }} />
                <span>Se enviará a <strong>{readyLeads.length} leads</strong> con demo lista</span>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Nombre de la campaña</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Campaña Abril 2026"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Asunto del email</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    placeholder="Hemos creado tu web — mírala gratis"
                  />
                </div>
              </div>

              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="use_ai"
                  checked={form.use_ai}
                  onChange={e => setForm(f => ({ ...f, use_ai: e.target.checked }))}
                />
                <label className="form-check-label" htmlFor="use_ai" style={{ fontSize: 14 }}>
                  Usar IA para personalizar cada email (Haiku)
                </label>
              </div>

              {!form.use_ai && (
                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Cuerpo del email (HTML) — usa {'{{'} demo_url {'}}'} y {'{{'} business_name {'}}'}
                  </label>
                  <textarea
                    className="form-control font-monospace"
                    rows={6}
                    value={form.body_html}
                    onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
                    placeholder="<p>Hola, hemos creado una demo para <strong>{{business_name}}</strong>...</p>"
                    style={{ resize: 'none' }}
                  />
                </div>
              )}

              {message && (
                <div className={`alert ${message.ok ? 'alert-success' : 'alert-danger'} mb-4`} style={{ fontSize: 13 }}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={previewing || sending}
                className="btn btn-primary d-flex align-items-center gap-2"
              >
                <Eye style={{ width: 14, height: 14 }} />
                {previewing ? 'Generando preview...' : `Vista previa y enviar (${readyLeads.length} leads)`}
              </button>
            </form>
          )}
        </AdminCard>

        {/* Historial */}
        <AdminCard title="Historial de campañas" noPadding>
          {loading ? (
            <p className="text-center text-muted py-5" style={{ fontSize: 13 }}>Cargando...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-center text-muted py-5" style={{ fontSize: 13 }}>Sin campañas aún</p>
          ) : (
            <div>
              {campaigns.map((c, i) => (
                <CampaignRow
                  key={c.id}
                  c={c}
                  leads={leads}
                  idx={i}
                  total={campaigns.length}
                  onFollowup={handleFollowup}
                  followingUp={followingUp}
                />
              ))}
            </div>
          )}
        </AdminCard>
      </div>
    </>
  )
}
