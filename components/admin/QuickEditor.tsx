'use client'

import { useState } from 'react'
import {
  Phone, MessageCircle, Mail, FileText,
  Save, CheckCircle2, AlertCircle, User,
} from 'lucide-react'

interface Props {
  clientId: string
  businessName?: string
  initialPhone?: string
  initialWhatsapp?: string
  initialEmail?: string
  initialNotes?: string
}

function Field({
  label, icon, children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="mb-3">
      <label className="form-label fw-semibold d-flex align-items-center gap-1" style={{ fontSize: 12, color: '#566a7f' }}>
        {icon}
        {label}
      </label>
      {children}
    </div>
  )
}

export function QuickEditor({
  clientId,
  businessName,
  initialPhone,
  initialWhatsapp,
  initialEmail,
  initialNotes,
}: Props) {
  const [phone,    setPhone]    = useState(initialPhone    ?? '')
  const [whatsapp, setWhatsapp] = useState(initialWhatsapp ?? '')
  const [email,    setEmail]    = useState(initialEmail    ?? '')
  const [notes,    setNotes]    = useState(initialNotes    ?? '')
  const [saving,   setSaving]   = useState(false)
  const [result,   setResult]   = useState<'success' | 'error' | null>(null)

  async function handleSave() {
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, whatsapp, email, notes }),
      })
      setResult(res.ok ? 'success' : 'error')
    } catch {
      setResult('error')
    } finally {
      setSaving(false)
      setTimeout(() => setResult(null), 3000)
    }
  }

  return (
    <div className="card">
      <div className="card-header d-flex align-items-center gap-2">
        <User size={14} className="text-muted" />
        <h5 className="card-title mb-0" style={{ fontSize: 13 }}>Datos de contacto</h5>
        {businessName && (
          <span className="text-muted ms-auto" style={{ fontSize: 12 }}>{businessName}</span>
        )}
      </div>
      <div className="card-body">

        <div className="row g-3 mb-1">
          <div className="col-md-6">
            <Field label="Teléfono" icon={<Phone size={12} />}>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="form-control"
                style={{ fontSize: 13 }}
              />
            </Field>
          </div>
          <div className="col-md-6">
            <Field label="WhatsApp" icon={<MessageCircle size={12} />}>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+34 600 000 000"
                className="form-control"
                style={{ fontSize: 13 }}
              />
              <div className="form-text" style={{ fontSize: 11 }}>Si es distinto al teléfono</div>
            </Field>
          </div>
        </div>

        <Field label="Email del cliente" icon={<Mail size={12} />}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="contacto@negocio.com"
            className="form-control"
            style={{ fontSize: 13 }}
          />
          <div className="form-text" style={{ fontSize: 11 }}>
            Se usará para notificaciones de renovación y comunicación con el cliente
          </div>
        </Field>

        <Field label="Notas internas" icon={<FileText size={12} />}>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Solo visible en el panel admin. Ej: cliente preferido, paga por Bizum, reunión pendiente..."
            className="form-control"
            style={{ fontSize: 13, resize: 'vertical' }}
          />
        </Field>

        <div className="d-flex align-items-center gap-3 mt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary d-flex align-items-center gap-2"
            style={{ fontSize: 13 }}
          >
            <Save size={13} />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>

          {result === 'success' && (
            <span className="d-flex align-items-center gap-1 text-success fw-semibold" style={{ fontSize: 13 }}>
              <CheckCircle2 size={14} /> Guardado
            </span>
          )}
          {result === 'error' && (
            <span className="d-flex align-items-center gap-1 text-danger fw-semibold" style={{ fontSize: 13 }}>
              <AlertCircle size={14} /> Error al guardar
            </span>
          )}
        </div>

      </div>
    </div>
  )
}
