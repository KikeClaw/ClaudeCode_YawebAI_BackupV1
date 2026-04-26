'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle2, XCircle, Clock, RefreshCw, Sparkles, FileCode, Database } from 'lucide-react'
import { PageHeader, AdminCard } from '@/components/admin/AdminUI'

type CheckResult = { ok: boolean; message: string }
type HealthData = { ok: boolean; checks: Record<string, CheckResult> }

const SERVICES = [
  {
    key: 'supabase',
    name: 'Supabase',
    desc: 'Base de datos',
    guide: 'supabase.com → New project → Settings → API',
    vars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY'],
    extra: 'Ejecuta supabase/schema.sql en el SQL Editor de Supabase',
  },
  {
    key: 'anthropic',
    name: 'Claude AI',
    desc: 'Generación de contenido',
    guide: 'console.anthropic.com → API Keys → Create Key',
    vars: ['ANTHROPIC_API_KEY'],
  },
  {
    key: 'google_places',
    name: 'Google Places API',
    desc: 'Datos de negocios locales',
    guide: 'console.cloud.google.com → APIs → Places API (New) → Credentials',
    vars: ['GOOGLE_PLACES_API_KEY'],
    extra: 'Activa "Places API (New)" y asegúrate de tener billing activado',
  },
  {
    key: 'resend',
    name: 'Resend',
    desc: 'Envío de emails',
    guide: 'resend.com → API Keys → Add API Key',
    vars: ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
    extra: 'Verifica el dominio yaweb.ai en Resend → Domains',
  },
]

export default function SetupPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)

  async function runCheck() {
    setLoading(true)
    const res = await fetch('/api/health')
    setHealth(await res.json())
    setLoading(false)
  }

  useEffect(() => { runCheck() }, [])

  const allOk = health?.ok

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Setup"
        subtitle="Verifica que todas las integraciones estén activas"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Setup' }]}
      />

      {/* Status banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', marginBottom: 20, borderRadius: 8,
        border: `1px solid ${allOk ? '#6ee7b7' : '#fde68a'}`,
        background: allOk ? '#d1fae5' : '#fffbeb',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {allOk
            ? <CheckCircle2 style={{ width: 18, height: 18, color: '#059669', flexShrink: 0 }} />
            : <Clock style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0 }} />
          }
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a2035' }}>
              {allOk ? '¡Todo configurado!' : 'Faltan configuraciones'}
            </p>
            <p style={{ fontSize: 12, color: '#6c757d', marginTop: 2 }}>
              {allOk ? 'Puedes empezar a generar webs.' : 'Completa los pasos y pulsa Verificar.'}
            </p>
          </div>
        </div>
        <button
          onClick={runCheck}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            border: '1px solid #dee2e6', borderRadius: 6, background: '#fff',
            color: '#6c757d', opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Verificar
        </button>
      </div>

      {/* Services */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        {SERVICES.map(svc => {
          const check = health?.checks[svc.key]
          const status = !health ? 'pending' : check?.ok ? 'ok' : 'error'

          return (
            <div key={svc.key} style={{
              background: '#fff', border: '1px solid #dee2e6', borderRadius: 8, padding: '14px 16px',
              boxShadow: '0 0 1px rgba(0,0,0,.08), 0 1px 3px rgba(0,0,0,.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>
                  {status === 'ok'      && <CheckCircle2 style={{ width: 15, height: 15, color: '#059669' }} />}
                  {status === 'error'   && <XCircle style={{ width: 15, height: 15, color: '#ef4444' }} />}
                  {status === 'pending' && <Clock style={{ width: 15, height: 15, color: '#d1d5db' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2035' }}>{svc.name}</span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{svc.desc}</span>
                  </div>
                  {check && !check.ok && (
                    <p style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{check.message}</p>
                  )}
                  {status !== 'ok' && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: 11, color: '#6c757d' }}>
                        <span style={{ fontWeight: 600, color: '#1a2035' }}>Dónde obtenerlo:</span> {svc.guide}
                      </p>
                      {svc.extra && (
                        <p style={{ fontSize: 11, color: '#92400e', background: '#fef3c7', padding: '6px 10px', borderRadius: 6 }}>{svc.extra}</p>
                      )}
                      <div style={{ background: '#f8fafc', border: '1px solid #f0f2f5', borderRadius: 6, padding: 10 }}>
                        <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>Variables en .env.local:</p>
                        {svc.vars.map(v => (
                          <div key={v} style={{ fontFamily: 'monospace', fontSize: 11, color: '#6366f1' }}>{v}=...</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* .env.local template */}
      <AdminCard
        title="Plantilla .env.local"
        titleIcon={<FileCode style={{ width: 14, height: 14 }} />}
        style={{ marginBottom: 16 }}
      >
        <p style={{ fontSize: 12, color: '#6c757d', marginBottom: 10 }}>
          Copia esto en{' '}
          <code style={{ fontFamily: 'monospace', color: '#6366f1', background: '#ede9fe', padding: '1px 5px', borderRadius: 4 }}>
            yaweb/.env.local
          </code>:
        </p>
        <pre style={{
          fontSize: 11, color: '#374151', background: '#f8fafc', borderRadius: 8,
          padding: '14px 16px', overflow: 'auto', lineHeight: 1.7, fontFamily: 'monospace',
          border: '1px solid #f0f2f5',
        }}>
{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_KEY=sb_secret_...

ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_PLACES_API_KEY=AIza...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hola@yaweb.ai
RESEND_FROM_NAME=yaweb.ai

NEXT_PUBLIC_APP_URL=https://yaweb.ai
NEXT_PUBLIC_APP_DOMAIN=yaweb.ai
ADMIN_PASSWORD=elige-una-password-segura`}
        </pre>
      </AdminCard>

      {/* Supabase schema */}
      <AdminCard
        title="Ejecutar schema de Supabase"
        titleIcon={<Database style={{ width: 14, height: 14 }} />}
      >
        <ol style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            <>Ve a tu proyecto en <span style={{ color: '#6366f1', fontWeight: 600 }}>supabase.com</span></>,
            <>Abre <strong style={{ color: '#1a2035' }}>SQL Editor</strong></>,
            <>Pega el contenido de <code style={{ fontFamily: 'monospace', fontSize: 11, color: '#6366f1' }}>supabase/schema.sql</code></>,
            <>Pulsa <strong style={{ color: '#1a2035' }}>Run</strong></>,
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#6c757d', listStyle: 'none' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#d1d5db', flexShrink: 0, paddingTop: 1 }}>{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </AdminCard>

      {allOk && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Link
            href="/admin/clients/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', background: '#6366f1', color: '#fff',
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <Sparkles style={{ width: 15, height: 15 }} /> Generar primera web
          </Link>
        </div>
      )}
    </div>
  )
}
