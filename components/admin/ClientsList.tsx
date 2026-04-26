'use client'

import { useState, useMemo, useCallback } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ClientActions } from './ClientActions'
import {
  Trash2, Clock, Search, X, Globe, Monitor,
  CheckCircle2, Timer, AlertTriangle, XCircle, TrendingUp, Star, Wand2, Paperclip,
  Copy, Check,
} from 'lucide-react'
import type { Client } from '@/types'

// ── Image helpers ─────────────────────────────────────────────────────────────

interface AttachedImage {
  preview: string   // data-URI for <img> src
  data: string      // pure base64 (no prefix)
  mediaType: string
  name: string
}

function fileToAttached(file: File): Promise<AttachedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUri = reader.result as string
      const [header, data] = dataUri.split(',')
      const mediaType = header.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg'
      resolve({ preview: dataUri, data, mediaType, name: file.name })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── AI Edit Modal ─────────────────────────────────────────────────────────────

function AiEditModal({ clientId, slug, onClose }: {
  clientId: string
  slug: string
  onClose: () => void
}) {
  const [instruction, setInstruction] = useState('')
  const [images, setImages] = useState<AttachedImage[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ model: string; costEur: number; demoUrl: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)

  function copyResultLink() {
    if (!result) return
    navigator.clipboard.writeText(result.demoUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  const complexity = useCallback((text: string, hasImages: boolean): { label: string; color: string } => {
    const lower = text.toLowerCase()
    const medium = ['sección', 'section', 'párrafo', 'imagen', 'foto', 'enlace', 'botón', 'button',
      'título', 'heading', 'reescribir', 'rewrite', 'eliminar', 'remove', 'borrar', 'mover', 'añadir texto']
    if (medium.some(w => lower.includes(w))) return { label: 'Sonnet ~0.05€', color: '#696cff' }
    if (hasImages) return { label: 'Haiku + Visión ~0.02€', color: '#10b981' }
    if (text.trim().length > 0) return { label: 'Haiku ~0.01€', color: '#10b981' }
    return { label: '—', color: '#9ca3af' }
  }, [])

  const { label: complexLabel, color: complexColor } = complexity(instruction, images.length > 0)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - images.length)
    const attached = await Promise.all(files.map(fileToAttached))
    setImages(prev => [...prev, ...attached].slice(0, 3))
    e.target.value = '' // reset so same file can be re-attached
  }

  function removeImage(idx: number) {
    setImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function apply() {
    if (!instruction.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          instruction: instruction.trim(),
          images: images.map(({ data, mediaType }) => ({ data, mediaType })),
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'Error desconocido')
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #e9ecef',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Wand2 size={16} style={{ color: '#696cff' }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#1a2035' }}>Editar con IA</span>
            <span style={{ fontSize: 12, color: '#8592a3' }}>— {slug}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={16} style={{ color: '#8592a3' }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {!result ? (
            <>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#566a7f', display: 'block', marginBottom: 6 }}>
                Describe el cambio a aplicar
              </label>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder={'Ejemplos:\n• "El texto del menú de navegación no se ve, cámbialo a color oscuro"\n• "El botón de WhatsApp tiene fondo blanco, ponlo verde"\n• "Aumenta el tamaño del título principal"'}
                rows={5}
                disabled={loading}
                style={{
                  width: '100%', borderRadius: 8, border: '1px solid #d1d5db',
                  padding: '10px 12px', fontSize: 13, lineHeight: 1.5, resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
              />

              {/* Image attachments row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {/* Thumbnails */}
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={img.preview}
                      alt={img.name}
                      style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', display: 'block' }}
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#374151', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0, lineHeight: 1,
                      }}
                    >
                      <X size={10} style={{ color: '#fff' }} />
                    </button>
                  </div>
                ))}

                {/* Add photo button */}
                {images.length < 3 && (
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 7,
                    border: '1.5px dashed #d1d5db', cursor: 'pointer',
                    fontSize: 12, color: '#6b7280', fontWeight: 500,
                    flexShrink: 0, userSelect: 'none',
                    transition: 'border-color .15s, color .15s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#696cff'; (e.currentTarget as HTMLElement).style.color = '#696cff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d1d5db'; (e.currentTarget as HTMLElement).style.color = '#6b7280' }}
                  >
                    <Paperclip size={13} />
                    {images.length === 0 ? 'Adjuntar foto' : 'Añadir otra'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                  </label>
                )}

                {images.length > 0 && (
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 2 }}>
                    {images.length}/3 · La IA verá el contexto visual
                  </span>
                )}
              </div>

              {/* Complexity indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  Modelo detectado:{' '}
                  <span style={{ fontWeight: 600, color: complexColor }}>{complexLabel}</span>
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>
                  La versión anterior se guarda automáticamente
                </span>
              </div>

              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 12px', background: '#fef2f2',
                  border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#b91c1c',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
                <button onClick={onClose} disabled={loading}
                  className="btn btn-sm btn-outline-secondary">
                  Cancelar
                </button>
                <button
                  onClick={apply}
                  disabled={loading || !instruction.trim()}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm" />Aplicando...</>
                    : <><Wand2 size={13} />Aplicar cambio</>}
                </button>
              </div>
            </>
          ) : (
            /* Success state */
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <CheckCircle2 size={40} style={{ color: '#10b981', marginBottom: 12 }} />
              <p style={{ fontWeight: 700, fontSize: 15, color: '#1a2035', marginBottom: 4 }}>
                ¡Cambio aplicado!
              </p>
              <p style={{ fontSize: 13, color: '#8592a3', marginBottom: 16 }}>
                Modelo: <strong>{result.model}</strong> · Coste: <strong>~{result.costEur}€</strong>
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={result.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                >
                  Ver resultado
                </a>
                <button
                  onClick={copyResultLink}
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  style={{ color: linkCopied ? '#10b981' : undefined }}
                >
                  {linkCopied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar link</>}
                </button>
                <button
                  onClick={() => { setResult(null); setInstruction(''); setImages([]) }}
                  className="btn btn-sm btn-outline-secondary"
                >
                  Otro cambio
                </button>
                <button onClick={onClose} className="btn btn-sm btn-outline-secondary">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERTICAL_LABELS: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar / Café',    salon:    'Peluquería',
  lawyer:     'Abogado',     clinic: 'Clínica',     gym:      'Gimnasio',
  hotel:      'Hotel',       pharmacy: 'Farmacia',  academy:  'Academia',
  shop:       'Tienda',      workshop: 'Taller',    generic:  'Otro',
}

function fmtDate(d: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', opts ?? { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtShort(d: string | null | undefined): string {
  return fmtDate(d, { day: 'numeric', month: 'short' })
}

function timeAgo(d: string | null | undefined): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}d`
  return fmtShort(d)
}

function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000)
}

function modelLabel(m: string | null | undefined): string {
  if (!m) return '—'
  if (m.includes('opus'))   return 'Opus'
  if (m.includes('haiku'))  return 'Haiku'
  if (m === 'gpt-4o')       return 'GPT-4o'
  if (m.includes('gemini')) return 'Gemini'
  return 'Sonnet'
}

// ── Small badge components ────────────────────────────────────────────────────

function PlanBadge({ plan }: { plan?: string }) {
  if (plan === 'premium') {
    return (
      <span className="badge rounded-pill bg-label-warning d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
        <Star size={10} /> Premium
      </span>
    )
  }
  return (
    <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 12 }}>
      Basic
    </span>
  )
}

function ModelBadge({ model }: { model?: string }) {
  const label = modelLabel(model)
  const color = label === 'Opus' ? 'warning' : label === 'Haiku' ? 'success' :
                label === 'GPT-4o' ? 'secondary' : label === 'Gemini' ? 'info' :
                label === '—' ? 'secondary' : 'primary'
  return <span className={`badge rounded-pill bg-label-${color}`} style={{ fontSize: 12 }}>{label}</span>
}

function ChannelBadge({ channel }: { channel?: string }) {
  if (!channel || channel === 'admin') return (
    <span className="badge rounded-pill bg-label-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
      <Monitor size={10} /> Admin
    </span>
  )
  if (channel === 'landing') return (
    <span className="badge rounded-pill bg-label-primary d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
      <Globe size={10} /> Landing
    </span>
  )
  return <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 12 }}>{channel}</span>
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color, icon }: {
  label: string; value: string | number
  color: 'success' | 'warning' | 'danger' | 'primary'; icon: ReactNode
}) {
  return (
    <div className="card flex-fill">
      <div className="card-body py-3">
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className={`avatar-initial rounded bg-label-${color} d-flex align-items-center justify-content-center`}
            style={{ width: 28, height: 28, flexShrink: 0 }}>
            {icon}
          </span>
          <span className="text-uppercase fw-bold text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            {label}
          </span>
        </div>
        <div className="fw-black tabular-nums" style={{ fontSize: 22, color: '#566a7f' }}>{value}</div>
      </div>
    </div>
  )
}

// ── Client row ────────────────────────────────────────────────────────────────

type TabKey = 'pipeline' | 'activas' | 'expiradas' | 'pruebas' | 'portfolio'

function ClientRow({
  client, index, total, selected, onToggle, tab,
}: {
  client: Client; index: number; total: number
  selected: boolean; onToggle: () => void; tab: TabKey
}) {
  const [aiEditOpen, setAiEditOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const days = daysUntil(client.expires_at)

  function copyDemoLink() {
    const url = `${window.location.origin}/demo/${client.slug}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  const vertLabel = VERTICAL_LABELS[client.vertical ?? ''] ?? (client.vertical ?? '—')

  // ── Status badge (smart — shows expiry context when needed)
  const StatusPill = () => {
    if (client.status === 'active') {
      if (days !== null && days < 0)   return <span className="badge rounded-pill bg-label-danger"  style={{ fontSize: 12 }}>Expirada</span>
      if (days !== null && days <= 30) return <span className="badge rounded-pill bg-label-warning d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}><AlertTriangle size={11} />Expira {days}d</span>
      return <span className="badge rounded-pill bg-label-success" style={{ fontSize: 12 }}>Activa</span>
    }
    if (client.status === 'demo')    return <span className="badge rounded-pill bg-label-info"      style={{ fontSize: 12 }}>Demo</span>
    if (client.status === 'expired') return <span className="badge rounded-pill bg-label-danger"    style={{ fontSize: 12 }}>Expirada</span>
    return <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 12 }}>Inactiva</span>
  }

  return (
    <div
      className={`d-flex align-items-center gap-3 px-4 py-4 ${index < total - 1 ? 'border-bottom' : ''}`}
      style={{ background: selected ? 'rgba(105,108,255,0.05)' : undefined }}
    >
      {/* Checkbox */}
      <input type="checkbox" checked={selected} onChange={onToggle}
        className="form-check-input flex-shrink-0 mt-0" style={{ cursor: 'pointer' }} />

      {/* Avatar */}
      <span
        className={`avatar-initial rounded flex-shrink-0 d-flex align-items-center justify-content-center ${
          tab === 'portfolio' ? 'bg-label-warning' :
          tab === 'pruebas'   ? 'bg-label-secondary' :
          tab === 'expiradas' ? 'bg-label-danger' : 'bg-label-primary'
        }`}
        style={{ width: 42, height: 42, fontWeight: 700, fontSize: 15 }}>
        {client.is_portfolio
          ? <Star size={18} />
          : client.name[0]?.toUpperCase()
        }
      </span>

      {/* Main info */}
      <div className="flex-fill" style={{ minWidth: 0 }}>

        {/* Row 1: name + badges */}
        <div className="d-flex align-items-center flex-wrap gap-1 mb-2">
          <Link href={`/admin/clients/${client.id}`}
            className="fw-bold text-decoration-none me-1"
            style={{ fontSize: 15, color: '#566a7f' }}>
            {client.name}
          </Link>
          <StatusPill />
          {/* Plan badge — always shown for paid webs */}
          {client.paid_at && <PlanBadge plan={client.plan} />}
          <ChannelBadge channel={client.channel} />
          <ModelBadge model={client.model} />
          {client.is_portfolio && tab !== 'portfolio' && (
            <span className="badge rounded-pill bg-label-warning d-inline-flex align-items-center gap-1" style={{ fontSize: 12 }}>
              <Star size={10} /> Portfolio
            </span>
          )}
        </div>

        {/* Row 2: vertical · slug · email */}
        <div className="d-flex align-items-center flex-wrap gap-2 mb-1" style={{ fontSize: 13, color: '#697a8d' }}>
          <span className="fw-medium">{vertLabel}</span>
          <span style={{ opacity: 0.35 }}>·</span>
          <span className="font-monospace text-primary" style={{ fontSize: 12 }}>/{client.slug}</span>
          {client.email && (
            <><span style={{ opacity: 0.35 }}>·</span>
            <span className="text-truncate" style={{ maxWidth: 260 }}>{client.email}</span></>
          )}
          {client.custom_domain && (
            <><span style={{ opacity: 0.35 }}>·</span>
            <span className="text-info fw-medium" style={{ fontSize: 13 }}>{client.custom_domain}</span></>
          )}
        </div>

        {/* Row 3: dates — context-aware per tab */}
        <div className="d-flex align-items-center flex-wrap gap-3" style={{ fontSize: 12, color: '#8592a3' }}>
          <span className="d-flex align-items-center gap-1">
            <Clock size={12} />
            {fmtDate(client.created_at)}
          </span>

          {/* Activas + Expiradas: show paid date, expiry, and amount */}
          {(tab === 'activas' || tab === 'expiradas') && (
            <>
              {client.paid_at && (
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  Pagado {fmtShort(client.paid_at)}
                </span>
              )}
              {client.expires_at && (
                <span style={{
                  fontWeight: 600,
                  color: days !== null && days < 0 ? '#ff3e1d' :
                         days !== null && days <= 30 ? '#fd7e14' : '#697a8d',
                }}>
                  · Expira {fmtDate(client.expires_at)}
                  {days !== null ? ` (${days > 0 ? days + 'd' : 'caducada'})` : ''}
                </span>
              )}
              {client.annual_amount > 0 && (
                <span className="fw-bold" style={{ color: '#696cff' }}>
                  {client.annual_amount}€/año
                </span>
              )}
            </>
          )}

          {/* Cost + token info — shown on all tabs */}
          {client.cost_usd !== undefined && client.cost_usd !== null && (
            client.cost_usd === 0
              ? <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>Gratis</span>
              : <span className="badge rounded-pill bg-label-info" style={{ fontSize: 11 }}>
                  ${client.cost_usd < 0.01 ? client.cost_usd.toFixed(4) : client.cost_usd.toFixed(3)}
                </span>
          )}
          {client.input_tokens !== undefined && client.input_tokens !== null && (
            <span style={{ fontSize: 11 }}>{client.input_tokens.toLocaleString()}+{client.output_tokens?.toLocaleString()} tok</span>
          )}

          {/* Pipeline: show time since generation */}
          {tab === 'pipeline' && (
            <span>Generada hace {timeAgo(client.created_at)}</span>
          )}

          {/* Portfolio: show which plan + amount if paid */}
          {tab === 'portfolio' && client.paid_at && (
            <>
              <span style={{ color: '#10b981', fontWeight: 600 }}>
                Pagado {fmtShort(client.paid_at)}
              </span>
              {client.annual_amount > 0 && (
                <span className="fw-bold" style={{ color: '#696cff' }}>
                  {client.annual_amount}€/año
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="d-flex align-items-center gap-1 flex-shrink-0">
        {/* Preview link */}
        <a
          href={`/demo/${client.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center gap-1 px-2"
          title="Ver la web generada en una nueva pestaña"
          style={{ fontSize: 12 }}
        >
          <i className="bx bx-link-external" style={{ fontSize: 14 }} />
        </a>
        {/* Copy demo link */}
        <button
          onClick={copyDemoLink}
          className="btn btn-sm btn-link text-decoration-none d-flex align-items-center px-2"
          title="Copiar enlace de la demo"
          style={{ color: copied ? '#10b981' : '#697a8d' }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
        {/* WhatsApp share */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hola, aquí puedes ver la web que hemos preparado para ${client.name}: ${window.location.origin}/demo/${client.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-link text-muted text-decoration-none d-flex align-items-center px-2"
          title="Compartir por WhatsApp"
          style={{ fontSize: 16, lineHeight: 1 }}
        >
          <i className="bx bxl-whatsapp" style={{ fontSize: 16 }} />
        </a>
        <button
          onClick={() => setAiEditOpen(true)}
          className="btn btn-sm btn-outline-primary"
          style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
          title="Editar con IA — aplica cambios quirúrgicos sin regenerar"
        >
          <Wand2 size={12} />
          IA
        </button>
        <Link href={`/admin/clients/${client.id}`}
          className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12 }}>
          Editar
        </Link>
        {aiEditOpen && (
          <AiEditModal
            clientId={client.id}
            slug={client.slug}
            onClose={() => setAiEditOpen(false)}
          />
        )}
        <ClientActions
          clientId={client.id}
          status={client.status}
          paidAt={client.paid_at}
          expiresAt={client.expires_at}
          isInternal={client.is_internal}
          isPortfolio={client.is_portfolio}
        />
      </div>
    </div>
  )
}

// ── Filters bar ───────────────────────────────────────────────────────────────

function FiltersBar({
  query, verticalFilter,
  onQuery, onVertical, onClear,
  total, filtered,
}: {
  query: string; verticalFilter: string
  onQuery: (v: string) => void; onVertical: (v: string) => void
  onClear: () => void; total: number; filtered: number
}) {
  const hasFilters = query || verticalFilter !== 'all'

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div className="position-relative flex-fill" style={{ minWidth: 200 }}>
        <Search size={13} className="text-muted position-absolute" style={{ top: '50%', left: 12, transform: 'translateY(-50%)' }} />
        <input
          type="text" placeholder="Buscar nombre, slug, email…"
          value={query} onChange={e => onQuery(e.target.value)}
          className="form-control" style={{ paddingLeft: 34, fontSize: 13 }}
        />
      </div>
      <select value={verticalFilter} onChange={e => onVertical(e.target.value)}
        className="form-select" style={{ width: 'auto', fontSize: 13 }}>
        <option value="all">Todos los sectores</option>
        {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      {hasFilters && (
        <button onClick={onClear} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
          <X size={13} /> Limpiar
        </button>
      )}
      {hasFilters && (
        <span className="text-muted fw-semibold" style={{ fontSize: 12 }}>{filtered} de {total}</span>
      )}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<TabKey, string> = {
  pipeline:  'No hay demos en pipeline. Genera la primera web desde "Nueva web".',
  activas:   'No hay webs activas aún. Convierte una demo para empezar.',
  expiradas: 'Ninguna web ha caducado. ¡Bien!',
  pruebas:   'No hay webs marcadas como internas.',
  portfolio: 'No hay webs en portfolio. Usa ··· → Añadir al Portfolio en cualquier fila.',
}

function EmptyState({ tab, hasFilters }: { tab: TabKey; hasFilters: boolean }) {
  return (
    <div className="card">
      <div className="card-body text-center py-5">
        <i className="bx bx-globe mb-2 d-block" style={{ fontSize: 36, color: '#d9dee3' }} />
        <p className="text-muted mb-0" style={{ fontSize: 13 }}>
          {hasFilters ? 'Ninguna web coincide con los filtros.' : EMPTY_MESSAGES[tab]}
        </p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  pipeline:   Client[]
  activas:    Client[]
  expiradas:  Client[]
  pruebas:    Client[]
  portfolio:  Client[]
  stats:      { active: number; expiring: number; expired: number; revenue: number }
  defaultTab?: TabKey
}

export function ClientsList({ pipeline, activas, expiradas, pruebas, portfolio, stats, defaultTab }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>(defaultTab ?? 'pipeline')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [query, setQuery] = useState('')
  const [verticalFilter, setVerticalFilter] = useState('all')

  function changeTab(t: TabKey) {
    setTab(t)
    setSelected(new Set())
    setQuery('')
    setVerticalFilter('all')
  }

  const sourceMap: Record<TabKey, Client[]> = {
    pipeline, activas, expiradas, pruebas, portfolio,
  }
  const sourceList = sourceMap[tab]

  const filtered = useMemo(() => sourceList.filter(c => {
    if (verticalFilter !== 'all' && c.vertical !== verticalFilter) return false
    if (query) {
      const q = query.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
    }
    return true
  }), [sourceList, query, verticalFilter])

  const toggle = (id: string) =>
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleAll = () =>
    setSelected(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(c => c.id)))

  async function deleteSelected() {
    if (!confirm(`¿Eliminar ${selected.size} web${selected.size > 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    await Promise.all([...selected].map(id => fetch(`/api/clients/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    router.refresh()
    setDeleting(false)
  }

  const hasFilters = !!(query || verticalFilter !== 'all')

  // ── Tab definitions ───────────────────────────────────────────────────────
  const TABS: Array<{
    key: TabKey; label: string; count: number
    color: 'success' | 'warning' | 'danger' | 'secondary' | 'info' | 'primary'
    title: string
  }> = [
    { key: 'pipeline',  label: 'Pipeline',   count: pipeline.length,  color: 'info',      title: 'Demos generadas aún no convertidas' },
    { key: 'activas',   label: 'Activas',    count: activas.length,   color: 'success',   title: 'Webs con pago activo' },
    { key: 'expiradas', label: 'Expiradas',  count: expiradas.length, color: 'danger',    title: 'Webs con suscripción caducada' },
    { key: 'pruebas',   label: 'Pruebas',    count: pruebas.length,   color: 'secondary', title: 'Webs internas / de prueba' },
    { key: 'portfolio', label: 'Portfolio',  count: portfolio.length, color: 'warning',   title: 'Webs destacadas para mostrar en el portfolio' },
  ]

  return (
    <div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <ul className="nav nav-tabs mb-4">
        {TABS.map(({ key, label, count, color, title }) => (
          <li key={key} className="nav-item">
            <button
              className={`nav-link d-flex align-items-center gap-2 ${tab === key ? 'active' : ''}`}
              onClick={() => changeTab(key)}
              title={title}
              style={{ fontSize: 13 }}
            >
              {label}
              <span className={`badge rounded-pill ${tab === key ? `bg-${color}` : 'bg-label-secondary'}`}
                style={{ fontSize: 11 }}>
                {count}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* ── Stats bar (Activas tab) ────────────────────────────────────────── */}
      {tab === 'activas' && (
        <div className="d-flex gap-3 mb-4">
          <StatCard label="Activas"        value={stats.active}        color="success" icon={<CheckCircle2 size={14} />} />
          <StatCard label="Expiran pronto" value={stats.expiring}      color="warning" icon={<Timer size={14} />} />
          <StatCard label="Expiradas"      value={stats.expired}       color="danger"  icon={<XCircle size={14} />} />
          <StatCard label="Ingresos/año"   value={`${stats.revenue}€`} color="primary" icon={<TrendingUp size={14} />} />
        </div>
      )}

      {/* ── Contextual banners ────────────────────────────────────────────── */}
      {tab === 'pipeline' && pipeline.length > 0 && (
        <div className="alert alert-info d-flex align-items-center gap-2 mb-3 py-2" role="alert">
          <AlertTriangle size={15} className="flex-shrink-0" />
          <span style={{ fontSize: 13 }}>
            <strong>{pipeline.length}</strong> demos sin convertir.{' '}
            Selecciona plan <strong>B</strong>asic o <strong>P</strong>remium y pulsa{' '}
            <strong>Convertir</strong> para registrar el pago y activar 1 año.{' '}
            Usa <strong>···</strong> para más opciones.
          </span>
        </div>
      )}
      {tab === 'expiradas' && expiradas.length > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 py-2" role="alert">
          <XCircle size={15} className="flex-shrink-0" />
          <span style={{ fontSize: 13 }}>
            <strong>{expiradas.length}</strong> web{expiradas.length > 1 ? 's' : ''} con suscripción caducada.{' '}
            Pulsa <strong>+1 año</strong> para renovar.
          </span>
        </div>
      )}
      {tab === 'portfolio' && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-3 py-2" role="alert">
          <Star size={15} className="flex-shrink-0" />
          <span style={{ fontSize: 13 }}>
            Webs destacadas visibles en el carrusel de la landing. Para añadir o quitar,
            usa <strong>···</strong> → Añadir/Quitar del Portfolio en cualquier fila.
          </span>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <FiltersBar
        query={query} verticalFilter={verticalFilter}
        onQuery={setQuery} onVertical={setVerticalFilter}
        onClear={() => { setQuery(''); setVerticalFilter('all') }}
        total={sourceList.length} filtered={filtered.length}
      />

      {/* ── Bulk delete bar ───────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="alert alert-danger d-flex align-items-center gap-3 mb-3 py-2">
          <span className="fw-bold" style={{ fontSize: 13 }}>
            {selected.size} seleccionada{selected.size > 1 ? 's' : ''}
          </span>
          <button onClick={deleteSelected} disabled={deleting}
            className="btn btn-sm btn-danger d-flex align-items-center gap-1">
            <Trash2 size={13} /> {deleting ? 'Eliminando…' : 'Eliminar selección'}
          </button>
          <button onClick={() => setSelected(new Set())}
            className="btn btn-sm btn-link text-danger ms-auto text-decoration-none fw-semibold">
            Cancelar
          </button>
        </div>
      )}

      {/* ── Select all ────────────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="d-flex align-items-center gap-2 px-4 py-2 mb-1">
          <input type="checkbox" className="form-check-input mt-0" style={{ cursor: 'pointer' }}
            checked={selected.size === filtered.length && filtered.length > 0}
            onChange={toggleAll} />
          <span className="text-uppercase fw-bold text-muted" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
            Seleccionar todo ({filtered.length})
          </span>
        </div>
      )}

      {/* ── List ──────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState tab={tab} hasFilters={hasFilters} />
      ) : (
        <div className="card">
          {filtered.map((client, i) => (
            <ClientRow
              key={client.id}
              client={client}
              index={i}
              total={filtered.length}
              selected={selected.has(client.id)}
              onToggle={() => toggle(client.id)}
              tab={tab}
            />
          ))}
        </div>
      )}

    </div>
  )
}
