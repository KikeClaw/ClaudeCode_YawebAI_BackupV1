'use client'

import { useState, useEffect } from 'react'
import { Zap, Star, Cpu, Key, ExternalLink, Info, Brain, FlaskConical, Rabbit } from 'lucide-react'
import { PageHeader, AdminCard } from '@/components/admin/AdminUI'

const MODELS = [
  // Anthropic
  {
    id: 'claude-opus-4-7',
    provider: 'Anthropic',
    name: 'Claude Opus 4.7',
    tagline: 'Máxima calidad',
    description: 'El modelo más potente de Anthropic. Diseños más creativos, textos más refinados y mejor comprensión del negocio.',
    badge: 'Premium',
    badgeColor: '#92400e', badgeBg: '#fef3c7',
    iconColor: '#f59e0b',
    icon: Star,
    estCost: 2.10,
    genTime: '~5–7 min',
    quality: 5,
    costNote: '$15/$75 por MTok',
  },
  {
    id: 'claude-sonnet-4-6',
    provider: 'Anthropic',
    name: 'Claude Sonnet 4.6',
    tagline: 'Recomendado',
    description: 'Equilibrio perfecto entre calidad y coste. Genera webs profesionales de alta calidad a una fracción del precio de Opus.',
    badge: 'Recomendado',
    badgeColor: '#3730a3', badgeBg: '#e0e7ff',
    iconColor: '#6366f1',
    icon: Zap,
    estCost: 0.42,
    genTime: '~3–5 min',
    quality: 4,
    costNote: '$3/$15 por MTok',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    provider: 'Anthropic',
    name: 'Claude Haiku 4.5',
    tagline: 'Económico',
    description: 'El más rápido y barato de Anthropic. Apto para pruebas o negocios simples. Complejidad de HTML puede ser menor.',
    badge: 'Económico',
    badgeColor: '#065f46', badgeBg: '#d1fae5',
    iconColor: '#10b981',
    icon: Cpu,
    estCost: 0.03,
    genTime: '~1–2 min',
    quality: 3,
    costNote: '$0.80/$4 por MTok',
  },
  // OpenAI
  {
    id: 'gpt-4o',
    provider: 'OpenAI',
    name: 'GPT-4o',
    tagline: 'Estilo diferente',
    description: 'El modelo principal de OpenAI. Genera HTML de gran calidad con un estilo visual diferente a Claude. Buena alternativa para comparar.',
    badge: 'OpenAI',
    badgeColor: '#065f46', badgeBg: '#d1fae5',
    iconColor: '#10b981',
    icon: Brain,
    estCost: 0.29,
    genTime: '~2–4 min',
    quality: 4,
    costNote: '$2.50/$10 por MTok',
  },
  // Google
  {
    id: 'gemini-2.5-flash',
    provider: 'Google',
    name: 'Gemini 2.5 Flash',
    tagline: 'Gratis · Rápido',
    description: 'La mejor opción gratuita de Google. Más capaz que 2.0 Flash, sin coste adicional con la misma API key. Ideal para pruebas y demos rápidas.',
    badge: 'Gratis',
    badgeColor: '#065f46', badgeBg: '#d1fae5',
    iconColor: '#0ea5e9',
    icon: FlaskConical,
    estCost: 0.02,
    genTime: '~1–2 min',
    quality: 4,
    costNote: '$0.15/$0.60 por MTok',
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'Google',
    name: 'Gemini 2.5 Pro',
    tagline: 'Alta capacidad',
    description: 'El modelo más capaz de Google. Razonamiento muy sólido, buen HTML. Interesante para comparar con Sonnet en calidad/precio.',
    badge: 'Google',
    badgeColor: '#1d4ed8', badgeBg: '#dbeafe',
    iconColor: '#3b82f6',
    icon: Brain,
    estCost: 0.27,
    genTime: '~3–5 min',
    quality: 4,
    costNote: '$1.25/$10 por MTok',
  },
  {
    id: 'gemini-2.0-flash',
    provider: 'Google',
    name: 'Gemini 2.0 Flash',
    tagline: 'Ultra barato',
    description: 'Versión anterior de Flash. Sustituido por 2.5 Flash (mejor y gratis). Disponible para comparar resultados.',
    badge: 'Google',
    badgeColor: '#1d4ed8', badgeBg: '#dbeafe',
    iconColor: '#38bdf8',
    icon: FlaskConical,
    estCost: 0.003,
    genTime: '~1–2 min',
    quality: 3,
    costNote: '$0.10/$0.40 por MTok',
  },
  // Groq
  {
    id: 'groq-llama-3.3-70b',
    provider: 'Groq',
    name: 'Llama 3.3 70B',
    tagline: 'Gratis · Ultrarrápido',
    description: 'Llama de Meta corriendo en hardware Groq. Extremadamente rápido (~5–10s). Calidad buena para sites sencillos. Requiere GROQ_API_KEY.',
    badge: 'Gratis',
    badgeColor: '#065f46', badgeBg: '#d1fae5',
    iconColor: '#f97316',
    icon: Rabbit,
    estCost: 0,
    genTime: '~10–30s',
    quality: 3,
    costNote: 'Gratuito (Groq free tier)',
  },
]

const API_KEYS = [
  { label: 'Anthropic API Key', envKey: 'ANTHROPIC_API_KEY', link: 'https://console.anthropic.com/', description: 'Claude Opus / Sonnet / Haiku' },
  { label: 'OpenAI API Key', envKey: 'OPENAI_API_KEY', link: 'https://platform.openai.com/', description: 'GPT-4o' },
  { label: 'Gemini API Key', envKey: 'GEMINI_API_KEY', link: 'https://aistudio.google.com/', description: 'Gemini 2.5 Flash (gratis) / 2.5 Pro / 2.0 Flash' },
  { label: 'Groq API Key', envKey: 'GROQ_API_KEY', link: 'https://console.groq.com/', description: 'Llama 3.3 70B (gratis, ultrarrápido)' },
  { label: 'Resend API Key', envKey: 'RESEND_API_KEY', link: 'https://resend.com/', description: 'Envío de emails de preview' },
  { label: 'Google Places API Key', envKey: 'GOOGLE_PLACES_API_KEY', link: 'https://console.cloud.google.com/', description: 'Datos de Google Maps/Business' },
  { label: 'Supabase URL', envKey: 'NEXT_PUBLIC_SUPABASE_URL', link: 'https://supabase.com/', description: 'Base de datos' },
  { label: 'Supabase Anon Key', envKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', link: 'https://supabase.com/', description: 'Acceso a Supabase' },
]

const BY_PROVIDER: Record<string, typeof MODELS> = {}
for (const m of MODELS) {
  if (!BY_PROVIDER[m.provider]) BY_PROVIDER[m.provider] = []
  BY_PROVIDER[m.provider].push(m)
}

function QualityDots({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: i <= n ? '#6366f1' : '#e2e8f0',
        }} />
      ))}
    </div>
  )
}

export default function SettingsPage() {
  const [keyStatus, setKeyStatus] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/settings/health').then(r => r.json()).then(setKeyStatus).catch(() => {})
  }, [])

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Configuración"
        subtitle="Modelo de IA por defecto y credenciales del sistema"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Configuración' }]}
      />

      {/* Model reference */}
      <AdminCard
        title="Modelos de IA"
        style={{ marginBottom: 20 }}
      >
        <p style={{ fontSize: 12, color: '#6c757d', marginBottom: 14 }}>
          Referencia de modelos disponibles y su coste estimado por web generada.
        </p>

        {/* Info banner */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', background: '#d1fae5', border: '1px solid #6ee7b7',
          borderRadius: 8, marginBottom: 16,
        }}>
          <span><Info style={{ width: 14, height: 14, color: '#059669', marginTop: 1 }} /></span>
          <p style={{ fontSize: 12, color: '#065f46', lineHeight: 1.5 }}>
            <strong>Modelo por defecto en Admin: Opus 4.7.</strong> Puedes cambiarlo por web individual en el formulario de creación. La Landing pública siempre usa Sonnet 4.6.
          </p>
        </div>

        {Object.entries(BY_PROVIDER).map(([provider, models]) => (
          <div key={provider} style={{ marginBottom: 16 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: '#9ca3af',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
            }}>{provider}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {models.map(m => {
                const Icon = m.icon
                return (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 8,
                    border: '1px solid #e2e8f0', background: '#fafbfc',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: m.iconColor, display: 'flex' }}>
                        <Icon className="w-4 h-4" />
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a2035' }}>{m.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                          color: m.badgeColor, background: m.badgeBg,
                        }}>{m.badge}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#6c757d', marginTop: 2, lineHeight: 1.5 }}>{m.description}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2035' }}>
                        {m.estCost === 0 ? 'Gratis' : `~${m.estCost < 0.01 ? m.estCost.toFixed(3) : m.estCost.toFixed(2)}€`}
                      </span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>{m.costNote}</span>
                      <QualityDots n={m.quality} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', background: '#dbeafe', border: '1px solid #93c5fd',
          borderRadius: 8, marginTop: 4,
        }}>
          <span><Info style={{ width: 14, height: 14, color: '#2563eb', marginTop: 1 }} /></span>
          <p style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.5 }}>
            Coste estimado con ~14k tokens de entrada y ~27.5k de salida (datos reales). GPT-4o y Gemini requieren sus propias API keys en{' '}
            <code style={{ background: '#bfdbfe', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>.env.local</code>.
          </p>
        </div>
      </AdminCard>

      {/* API Keys */}
      <AdminCard title="API Keys">
        <p style={{ fontSize: 12, color: '#6c757d', marginBottom: 14 }}>
          Se configuran en{' '}
          <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>.env.local</code>.
          Solo necesitas las de los modelos que uses.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {API_KEYS.map(k => {
            const ok = keyStatus[k.envKey]
            const unknown = ok === undefined
            return (
              <div key={k.envKey} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '11px 14px', background: '#fafbfc',
                border: '1px solid #e2e8f0', borderRadius: 8,
              }}>
                <span style={{ color: '#9ca3af', display: 'flex', flexShrink: 0 }}>
                  <Key style={{ width: 15, height: 15 }} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2035' }}>{k.label}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{k.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
                    color: unknown ? '#6b7280' : ok ? '#065f46' : '#991b1b',
                    background: unknown ? '#f3f4f6' : ok ? '#d1fae5' : '#fee2e2',
                  }}>
                    {unknown ? '···' : ok ? '✓ OK' : '✗ Falta'}
                  </span>
                  <a href={k.link} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#9ca3af', display: 'flex' }}>
                    <ExternalLink style={{ width: 14, height: 14 }} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 12 }}>
          Reinicia el servidor después de cambiar cualquier clave.
        </p>
      </AdminCard>
    </div>
  )
}
