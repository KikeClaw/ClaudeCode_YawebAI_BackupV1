'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, DollarSign, Trash2, Building2, RefreshCw,
  MoreHorizontal, Star, StarOff, Bell, CheckCircle,
} from 'lucide-react'

interface Props {
  clientId: string
  status: string
  paidAt?: string | null
  expiresAt?: string | null
  isInternal?: boolean
  isPortfolio?: boolean
  variant?: 'list' | 'detail'
}

export function ClientActions({ clientId, status, paidAt, expiresAt, isInternal, isPortfolio, variant = 'list' }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [planChoice, setPlanChoice] = useState<'basic' | 'premium'>('basic')
  const [reminding, setReminding] = useState(false)
  const [reminded, setReminded] = useState<string | null>(null)  // null | 'ok' | error msg

  async function update(action: string, extra?: Record<string, unknown>) {
    setLoading(true)
    setOpen(false)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...extra }),
    })
    router.refresh()
    setLoading(false)
  }

  async function convertWithPlan() {
    const amount = planChoice === 'premium' ? 199 : 99
    await update('mark_paid', { plan: planChoice, annual_amount: amount })
  }

  async function sendReminder() {
    setReminding(true)
    setReminded(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/remind`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setReminded('ok')
      } else {
        setReminded(data.error || 'Error enviando email')
      }
    } catch {
      setReminded('Error de red')
    } finally {
      setReminding(false)
      setTimeout(() => setReminded(null), 5000)
    }
  }

  const daysLeft = expiresAt
    ? Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    : null
  const showReminder = !!paidAt && !!expiresAt

  async function handleDelete() {
    if (!confirm('¿Eliminar esta web? Esta acción no se puede deshacer.')) return
    setLoading(true)
    setOpen(false)
    await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
    router.refresh()
    setLoading(false)
  }

  // ── DETAIL VIEW — show everything expanded ────────────────────────────────
  if (variant === 'detail') {
    return (
      <div className="d-flex flex-wrap align-items-center gap-2">
        {!paidAt && (
          <>
            {/* Plan selector */}
            <div className="btn-group btn-group-sm" role="group" aria-label="Plan">
              <button type="button"
                className={`btn btn-sm ${planChoice === 'basic' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setPlanChoice('basic')}
                style={{ fontSize: 12 }}>
                Basic 99€
              </button>
              <button type="button"
                className={`btn btn-sm ${planChoice === 'premium' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => setPlanChoice('premium')}
                style={{ fontSize: 12 }}>
                Premium 199€
              </button>
            </div>
            <button onClick={convertWithPlan} disabled={loading}
              className="btn btn-primary d-flex align-items-center gap-2">
              <DollarSign size={14} /> Registrar pago (+1 año)
            </button>
          </>
        )}
        {(status === 'active' || status === 'expired') && paidAt && (
          <button onClick={() => update('renew')} disabled={loading}
            className="btn btn-outline-primary d-flex align-items-center gap-2">
            <RefreshCw size={14} /> Renovar +1 año
          </button>
        )}
        {status === 'demo' && (
          <button onClick={() => update('activate')} disabled={loading}
            className="btn btn-outline-success d-flex align-items-center gap-2"
            title="Activa sin registrar pago — usa 'Registrar pago' para la conversión normal">
            <CheckCircle2 size={14} /> Activar sin pago
          </button>
        )}
        <button onClick={() => update(isPortfolio ? 'unmark_portfolio' : 'mark_portfolio')} disabled={loading}
          className={`btn d-flex align-items-center gap-2 ${isPortfolio ? 'btn-warning' : 'btn-outline-secondary'}`}>
          {isPortfolio ? <StarOff size={14} /> : <Star size={14} />}
          {isPortfolio ? 'Quitar del Portfolio' : 'Añadir al Portfolio'}
        </button>
        <button onClick={() => update(isInternal ? 'unmark_internal' : 'mark_internal')} disabled={loading}
          className={`btn d-flex align-items-center gap-2 ${isInternal ? 'btn-warning' : 'btn-outline-secondary'}`}>
          <Building2 size={14} />
          {isInternal ? 'Quitar de Pruebas' : 'Mover a Pruebas'}
        </button>
        <button onClick={handleDelete} disabled={loading}
          className="btn btn-outline-danger d-flex align-items-center gap-2">
          <Trash2 size={14} /> Eliminar
        </button>

        {/* Renewal reminder — only for paid clients with expiry */}
        {showReminder && (
          <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top w-100 flex-wrap">
            <button
              onClick={sendReminder}
              disabled={reminding}
              className="btn btn-outline-secondary d-flex align-items-center gap-2"
              title={daysLeft !== null && daysLeft < 0
                ? 'Enviar email al cliente avisando que su web ha caducado'
                : `Enviar email al cliente recordando que su web caduca en ${daysLeft}d`}
            >
              <Bell size={14} />
              {reminding ? 'Enviando…' : 'Enviar recordatorio de renovación'}
            </button>
            {reminded === 'ok' && (
              <span className="d-flex align-items-center gap-1 text-success fw-semibold" style={{ fontSize: 13 }}>
                <CheckCircle size={13} /> Email enviado
              </span>
            )}
            {reminded && reminded !== 'ok' && (
              <span className="text-danger fw-semibold" style={{ fontSize: 13 }}>{reminded}</span>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── LIST VIEW — one primary CTA + overflow menu ───────────────────────────
  //
  //   No paid_at    → plan picker + "Convertir"
  //   paid + active → "Renovar" if expiring
  //   paid + expired → "Renovar"

  const showConvert = !paidAt
  const showRenew   = !!paidAt && (status === 'active' || status === 'expired')

  return (
    <div className="d-flex align-items-center gap-1 flex-shrink-0">

      {/* Primary action — plan picker + Convertir */}
      {showConvert && (
        <div className="d-flex align-items-center gap-1">
          {/* Compact plan toggle */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className={`btn btn-sm ${planChoice === 'basic' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setPlanChoice('basic')}
              style={{ fontSize: 10, padding: '2px 7px', lineHeight: 1.4 }}
            >
              B
            </button>
            <button
              type="button"
              className={`btn btn-sm ${planChoice === 'premium' ? 'btn-warning' : 'btn-outline-secondary'}`}
              onClick={() => setPlanChoice('premium')}
              style={{ fontSize: 10, padding: '2px 7px', lineHeight: 1.4 }}
            >
              P
            </button>
          </div>
          <button
            onClick={convertWithPlan}
            disabled={loading}
            className="btn btn-sm btn-success d-flex align-items-center gap-1 fw-semibold"
            title={`Registra el pago (${planChoice === 'premium' ? 199 : 99}€), activa la web y añade 1 año de suscripción`}
          >
            <DollarSign size={12} /> Convertir
          </button>
        </div>
      )}
      {showRenew && (
        <button
          onClick={() => update('renew')}
          disabled={loading}
          className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
          title="Extiende la suscripción un año más"
        >
          <RefreshCw size={12} /> +1 año
        </button>
      )}

      {/* Overflow menu — secondary actions */}
      <div className="position-relative">
        <button
          onClick={() => setOpen(v => !v)}
          disabled={loading}
          className="btn btn-sm btn-outline-secondary d-flex align-items-center"
          title="Más acciones"
        >
          <MoreHorizontal size={14} />
        </button>
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
              onClick={() => setOpen(false)}
            />
            {/* Dropdown */}
            <div
              className="card shadow"
              style={{
                position: 'absolute', right: 0, top: '110%', zIndex: 1000,
                minWidth: 210, padding: '4px 0',
              }}
            >
              {/* Activate without payment (edge case) */}
              {status === 'demo' && !paidAt && (
                <button
                  onClick={() => update('activate')}
                  className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                  style={{ fontSize: 13, color: '#566a7f', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <CheckCircle2 size={13} className="text-muted" />
                  Activar sin pago
                  <span className="ms-auto badge bg-label-secondary" style={{ fontSize: 10 }}>gratis</span>
                </button>
              )}
              {/* Portfolio toggle */}
              <button
                onClick={() => update(isPortfolio ? 'unmark_portfolio' : 'mark_portfolio')}
                className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                style={{ fontSize: 13, color: isPortfolio ? '#e4a11b' : '#566a7f', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {isPortfolio ? <StarOff size={13} /> : <Star size={13} />}
                {isPortfolio ? 'Quitar del Portfolio' : 'Añadir al Portfolio'}
              </button>
              {/* Renewal reminder */}
              {showReminder && (
                <button
                  onClick={sendReminder}
                  className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                  style={{ fontSize: 13, color: '#566a7f', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Bell size={13} className="text-muted" />
                  {reminding ? 'Enviando…' : 'Enviar recordatorio'}
                  {reminded === 'ok' && <CheckCircle size={12} className="text-success ms-auto" />}
                </button>
              )}
              {/* Move to Pruebas / back */}
              <button
                onClick={() => update(isInternal ? 'unmark_internal' : 'mark_internal')}
                className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start"
                style={{ fontSize: 13, color: '#566a7f', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8f9fa')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Building2 size={13} className="text-muted" />
                {isInternal ? 'Quitar de Pruebas' : 'Mover a Pruebas'}
              </button>
              {/* Divider */}
              <div className="border-top my-1" />
              {/* Delete */}
              <button
                onClick={handleDelete}
                className="d-flex align-items-center gap-2 px-3 py-2 w-100 border-0 bg-transparent text-start text-danger"
                style={{ fontSize: 13, cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fff5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Trash2 size={13} />
                Eliminar web
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
