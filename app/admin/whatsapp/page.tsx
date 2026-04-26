'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Client, Lead } from '@/types'
import { MessageSquare, Copy, Check, ExternalLink, RefreshCw, Send, Phone, Tag } from 'lucide-react'
import { PageHeader, AdminCard } from '@/components/admin/AdminUI'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'
const WA_SENT_KEY = 'yw_wa_sent'

const TEMPLATES = [
  { id: 'intro',      label: 'Intro demo',          sub: 'Primer contacto — mostrar la web generada' },
  { id: 'followup',   label: 'Seguimiento',          sub: '2-3 días después sin respuesta' },
  { id: 'lastchance', label: 'Última oportunidad',   sub: 'Último intento, honesto y breve' },
  { id: 'renewal',    label: 'Renovación',           sub: 'Clientes activos — recordatorio de renovación' },
] as const
type Template = typeof TEMPLATES[number]['id']

const VERTICAL_ES: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar/Café', salon: 'Peluquería', clinic: 'Clínica',
  gym: 'Gimnasio', lawyer: 'Abogado', hotel: 'Hotel', pharmacy: 'Farmacia',
  academy: 'Academia', shop: 'Tienda', workshop: 'Taller', generic: 'Negocio local',
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  const s = d.startsWith('00') ? d.slice(2) : d
  return s.length <= 9 ? `34${s}` : s
}

/* Unified contact item — either a Client or a Lead with a demo */
interface ContactItem {
  id: string
  name: string
  vertical: string
  slug: string
  phone: string
  source: 'client' | 'lead'
  clientStatus?: string
  leadStatus?: string
}

function toContactItems(clients: Client[], leads: Lead[]): ContactItem[] {
  const items: ContactItem[] = []

  for (const c of clients) {
    if ((c.status === 'demo' || c.status === 'active') && (c.phone || c.whatsapp)) {
      items.push({
        id: `client-${c.id}`,
        name: c.name,
        vertical: c.vertical,
        slug: c.slug,
        phone: (c.whatsapp || c.phone)!,
        source: 'client',
        clientStatus: c.status,
      })
    }
  }

  for (const l of leads) {
    if (l.status === 'demo_ready' && l.phone && l.demo_slug) {
      // skip if already in clients (same slug)
      if (clients.some(c => c.slug === l.demo_slug)) continue
      items.push({
        id: `lead-${l.id}`,
        name: l.business_name,
        vertical: l.vertical,
        slug: l.demo_slug,
        phone: l.phone,
        source: 'lead',
        leadStatus: l.status,
      })
    }
  }

  return items
}

export default function WhatsAppPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState<Template>('intro')
  const [messages, setMessages] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [showSent, setShowSent] = useState(false)

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WA_SENT_KEY) || '[]')
      setSent(new Set(saved))
    } catch { /* ignore */ }
  }, [])

  const saveSent = (next: Set<string>) => {
    setSent(next)
    localStorage.setItem(WA_SENT_KEY, JSON.stringify(Array.from(next)))
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [cRes, lRes] = await Promise.all([fetch('/api/clients'), fetch('/api/leads')])
    if (cRes.ok) setClients(await cRes.json())
    if (lRes.ok) setLeads(await lRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const contacts = toContactItems(clients, leads)
  const visible = contacts.filter(c => showSent || !sent.has(c.id))
  const pendingCount = contacts.filter(c => !sent.has(c.id)).length
  const sentCount = contacts.filter(c => sent.has(c.id)).length

  async function generateMessage(contact: ContactItem) {
    setGenerating(prev => new Set(prev).add(contact.id))
    const demoUrl = `${APP_URL}/demo/${contact.slug}`
    try {
      const res = await fetch('/api/whatsapp/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: contact.name,
          vertical: contact.vertical,
          demo_url: demoUrl,
          template,
        }),
      })
      const data = await res.json()
      if (data.message) setMessages(prev => ({ ...prev, [contact.id]: data.message }))
    } catch { /* ignore */ }
    setGenerating(prev => { const next = new Set(prev); next.delete(contact.id); return next })
  }

  async function generateAll() {
    const vis = contacts.filter(c => showSent || !sent.has(c.id))
    await Promise.all(vis.map(generateMessage))
  }

  async function copyMessage(id: string, message: string) {
    await navigator.clipboard.writeText(message)
    setCopied(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [id]: false })), 2000)
  }

  function toggleSent(id: string) {
    const next = new Set(sent)
    next.has(id) ? next.delete(id) : next.add(id)
    saveSent(next)
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="WhatsApp Outreach"
        subtitle={`${contacts.filter(c => c.source === 'client' && c.clientStatus === 'demo').length} demos · ${contacts.filter(c => c.source === 'client' && c.clientStatus === 'active').length} activos · ${contacts.filter(c => c.source === 'lead').length} leads · ${pendingCount} pendientes · ${sentCount} enviados`}
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'WhatsApp' }]}
        action={
          <button
            onClick={fetchAll}
            className="btn btn-outline-secondary d-flex align-items-center"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw style={{ width: 15, height: 15 }} />
          </button>
        }
      />

      {/* Template selector */}
      <AdminCard title="Plantilla de mensaje" style={{ marginBottom: 16 }}>
        <div className="row g-2">
          {TEMPLATES.map(t => (
            <div key={t.id} className="col-6 col-lg-3">
              <button
                type="button"
                onClick={() => { setTemplate(t.id); setMessages({}) }}
                className={`w-100 text-start p-3 rounded border-2 ${template === t.id ? 'border-primary bg-label-primary' : 'border bg-white'}`}
                style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div className={`fw-semibold mb-1 ${template === t.id ? 'text-primary' : 'text-body'}`} style={{ fontSize: 13 }}>{t.label}</div>
                <div className={template === t.id ? 'text-primary' : 'text-body-secondary'} style={{ fontSize: 11, lineHeight: 1.4 }}>{t.sub}</div>
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Actions bar */}
      <div className="d-flex align-items-center justify-content-between mb-4 gap-3">
        <button
          onClick={generateAll}
          disabled={visible.length === 0 || generating.size > 0}
          className="btn btn-primary d-flex align-items-center gap-2"
          style={{ fontSize: 13 }}
        >
          <MessageSquare style={{ width: 14, height: 14 }} />
          {generating.size > 0 ? `Generando ${generating.size}...` : `Generar ${visible.length} mensajes`}
        </button>
        <button
          onClick={() => setShowSent(v => !v)}
          className={`btn ${showSent ? 'btn-primary' : 'btn-outline-secondary'}`}
          style={{ fontSize: 13 }}
        >
          {showSent ? 'Ocultar enviados' : `Mostrar enviados (${sentCount})`}
        </button>
      </div>

      {/* Contact list */}
      {loading ? (
        <p className="text-center text-muted py-5" style={{ fontSize: 13 }}>Cargando...</p>
      ) : contacts.length === 0 ? (
        <AdminCard>
          <div className="text-center py-5">
            <div className="d-flex justify-content-center mb-3">
              <Phone style={{ width: 32, height: 32, color: '#dee2e6' }} />
            </div>
            <p className="fw-semibold text-muted mb-1" style={{ fontSize: 13 }}>Sin contactos con demo y teléfono</p>
            <p className="text-muted" style={{ fontSize: 12 }}>
              Genera demos desde <strong className="text-body">Nueva Web</strong> o <strong className="text-body">Prospectar</strong> y añade un teléfono
            </p>
          </div>
        </AdminCard>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted py-5" style={{ fontSize: 13 }}>
          Todos los mensajes están marcados como enviados.{' '}
          <button onClick={() => setShowSent(true)} className="btn btn-link p-0 fw-semibold" style={{ fontSize: 13 }}>
            Mostrar enviados
          </button>
        </p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {visible.map(contact => {
            const waPhone = formatPhone(contact.phone)
            const demoUrl = `${APP_URL}/demo/${contact.slug}`
            const msg = messages[contact.id]
            const isGenerating = generating.has(contact.id)
            const isSent = sent.has(contact.id)
            const waUrl = msg
              ? `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`
              : `https://wa.me/${waPhone}`

            return (
              <div
                key={contact.id}
                className={`card ${isSent ? 'bg-label-success border-success' : ''}`}
              >
                <div className="card-body">
                  {/* Contact header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span className="fw-semibold text-body" style={{ fontSize: 13 }}>{contact.name}</span>
                        <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 11 }}>
                          {VERTICAL_ES[contact.vertical] || contact.vertical}
                        </span>
                        {/* Source badge */}
                        <span
                          className={`badge rounded-pill d-flex align-items-center gap-1 ${
                            contact.source === 'lead' ? 'bg-label-warning' : 'bg-label-info'
                          }`}
                          style={{ fontSize: 10 }}
                        >
                          <Tag style={{ width: 9, height: 9 }} />
                          {contact.source === 'lead' ? 'Lead' : contact.clientStatus === 'active' ? 'Activo' : 'Demo'}
                        </span>
                        {isSent && (
                          <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>
                            ✓ Enviado
                          </span>
                        )}
                      </div>
                      <div className="d-flex align-items-center gap-3 text-body-secondary" style={{ fontSize: 11 }}>
                        <span className="d-flex align-items-center gap-1">
                          <Phone style={{ width: 11, height: 11 }} /> {contact.phone}
                        </span>
                        <a
                          href={demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-flex align-items-center gap-1 text-primary text-decoration-none"
                        >
                          <ExternalLink style={{ width: 11, height: 11 }} /> Ver demo
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => generateMessage(contact)}
                      disabled={isGenerating}
                      className="btn btn-sm btn-outline-secondary flex-shrink-0"
                      style={{ fontSize: 11, opacity: isGenerating ? 0.5 : 1 }}
                    >
                      {isGenerating ? '...' : '↺ Regenerar'}
                    </button>
                  </div>

                  {/* Message area */}
                  {isGenerating ? (
                    <div
                      className="rounded d-flex align-items-center justify-content-center mb-3 border border-dashed"
                      style={{ height: 80, background: '#f8fafc' }}
                    >
                      <span className="text-body-secondary" style={{ fontSize: 12 }}>Generando mensaje...</span>
                    </div>
                  ) : msg ? (
                    <textarea
                      value={msg}
                      onChange={e => setMessages(prev => ({ ...prev, [contact.id]: e.target.value }))}
                      rows={6}
                      className="form-control mb-3"
                      style={{ fontSize: 13, lineHeight: 1.6, resize: 'none' }}
                    />
                  ) : (
                    <div
                      className="rounded d-flex align-items-center justify-content-center mb-3 border border-dashed"
                      style={{ height: 64, background: '#f8fafc' }}
                    >
                      <span className="text-body-secondary" style={{ fontSize: 12 }}>Haz clic en &quot;Generar mensajes&quot; para ver el texto</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="d-flex align-items-center gap-2">
                    <button
                      onClick={() => msg && copyMessage(contact.id, msg)}
                      disabled={!msg}
                      className={`btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 ${copied[contact.id] ? 'text-success border-success' : ''}`}
                      style={{ fontSize: 11, opacity: msg ? 1 : 0.3 }}
                    >
                      {copied[contact.id] ? <Check style={{ width: 11, height: 11 }} /> : <Copy style={{ width: 11, height: 11 }} />}
                      {copied[contact.id] ? 'Copiado' : 'Copiar mensaje'}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm d-flex align-items-center gap-1 fw-semibold text-white"
                      style={{ fontSize: 11, background: '#25D366', border: 'none' }}
                    >
                      <Send style={{ width: 11, height: 11 }} /> Abrir WhatsApp
                    </a>
                    <button
                      onClick={() => toggleSent(contact.id)}
                      className={`btn btn-sm d-flex align-items-center gap-1 ms-auto ${isSent ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                      style={{ fontSize: 11 }}
                    >
                      <Check style={{ width: 11, height: 11 }} />
                      {isSent ? 'Marcar pendiente' : 'Marcar enviado'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
