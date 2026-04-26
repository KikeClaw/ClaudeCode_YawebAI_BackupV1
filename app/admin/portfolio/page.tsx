'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ExternalLink, RefreshCw, Play, CheckCircle, AlertCircle, Loader2, Zap,
  UtensilsCrossed, Wine, Scissors, Scale, Stethoscope,
  Dumbbell, Hotel, Pill, GraduationCap, ShoppingBag, Wrench, Building2,
  Sun, Moon, Copy, Check,
  type LucideIcon,
} from 'lucide-react'
import { PORTFOLIO_DEMOS, type PortfolioDemoConfig } from '@/lib/portfolio-demos'
import { PageHeader, AdminCard, ActionButton } from '@/components/admin/AdminUI'
import type { Client } from '@/types'

// ── Model groups ──────────────────────────────────────────────────────────────

const MODEL_GROUPS: Array<{
  model: string
  label: string
  subtitle: string
  color: 'warning' | 'primary' | 'success' | 'secondary' | 'info'
}> = [
  { model: 'claude-opus-4-7',          label: 'Opus 4.7',         subtitle: 'Máxima calidad — resultados premium',      color: 'warning'   },
  { model: 'claude-sonnet-4-6',         label: 'Sonnet 4.6',       subtitle: 'Recomendado — mejor calidad/precio',       color: 'primary'   },
  { model: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5',        subtitle: 'Rápido y económico',                       color: 'success'   },
  { model: 'gpt-4o',                    label: 'GPT-4o',           subtitle: 'OpenAI — modelo alternativo',              color: 'secondary' },
  { model: 'gemini-2.0-flash',          label: 'Gemini 2.0 Flash', subtitle: 'Google — modelo alternativo',             color: 'info'      },
]

// ── Vertical icon map ─────────────────────────────────────────────────────────

const VERTICAL_ICONS: Record<string, { Icon: LucideIcon; label: string }> = {
  restaurant: { Icon: UtensilsCrossed, label: 'Restaurante' },
  bar:        { Icon: Wine,            label: 'Bar / Café'  },
  salon:      { Icon: Scissors,        label: 'Peluquería'  },
  lawyer:     { Icon: Scale,           label: 'Abogado'     },
  clinic:     { Icon: Stethoscope,     label: 'Clínica'     },
  gym:        { Icon: Dumbbell,        label: 'Gimnasio'    },
  hotel:      { Icon: Hotel,           label: 'Hotel'       },
  pharmacy:   { Icon: Pill,            label: 'Farmacia'    },
  academy:    { Icon: GraduationCap,   label: 'Academia'    },
  shop:       { Icon: ShoppingBag,     label: 'Tienda'      },
  workshop:   { Icon: Wrench,          label: 'Taller'      },
  generic:    { Icon: Building2,       label: 'Otro'        },
}

function getModelColor(model: string): 'warning' | 'primary' | 'success' | 'secondary' | 'info' {
  if (model.includes('opus'))   return 'warning'
  if (model.includes('haiku'))  return 'success'
  if (model === 'gpt-4o')       return 'secondary'
  if (model.includes('gemini')) return 'info'
  return 'primary'
}

function getModelLabel(model: string): string {
  if (model.includes('opus'))   return 'Opus'
  if (model.includes('haiku'))  return 'Haiku'
  if (model === 'gpt-4o')       return 'GPT-4o'
  if (model.includes('gemini')) return 'Gemini'
  return 'Sonnet'
}

// ── Stage labels (mirrors new/page.tsx stages) ───────────────────────────────

const PORTFOLIO_STAGES = [
  { at: 0,  label: 'Iniciando…' },
  { at: 8,  label: 'Buscando información del negocio…' },
  { at: 18, label: 'Generando el sitio web con IA…' },
  { at: 50, label: 'Escribiendo el contenido…' },
  { at: 80, label: 'Puliendo los detalles…' },
  { at: 94, label: 'Guardando la web…' },
]

function getPortfolioStageLabel(progress: number, serverMessage?: string): string {
  // Prefer live server message (more accurate), fall back to time-based label
  if (serverMessage) return serverMessage
  let label = PORTFOLIO_STAGES[0].label
  for (const s of PORTFOLIO_STAGES) { if (progress >= s.at) label = s.label }
  return label
}

// ── Progress bar (same curve as main form) ───────────────────────────────────

const PROGRESS_CURVE: [number, number][] = [
  [0,   0],
  [8,   6_000],
  [18,  14_000],
  [32,  30_000],
  [50,  60_000],
  [68,  100_000],
  [80,  140_000],
  [88,  180_000],
  [94,  240_000],
  [97,  300_000],
]

function interpolateProgress(elapsed: number): number {
  for (let i = 1; i < PROGRESS_CURVE.length; i++) {
    const [p0, t0] = PROGRESS_CURVE[i - 1]
    const [p1, t1] = PROGRESS_CURVE[i]
    if (elapsed <= t1) {
      const ratio = (elapsed - t0) / (t1 - t0)
      return p0 + (p1 - p0) * ratio
    }
  }
  return PROGRESS_CURVE[PROGRESS_CURVE.length - 1][0]
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedEntry {
  demoUrl: string
  clientId: string
}

// ── Card component ────────────────────────────────────────────────────────────

function DemoCard({
  demo,
  generated,
  isGenerating,
  progress,
  message,
  onGenerate,
}: {
  demo: PortfolioDemoConfig
  generated: GeneratedEntry | null
  isGenerating: boolean
  progress: number
  message?: string
  onGenerate: (demo: PortfolioDemoConfig) => void
}) {
  const [copied, setCopied] = useState(false)

  function copyDemoUrl() {
    if (!generated) return
    navigator.clipboard.writeText(generated.demoUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const verticalInfo = VERTICAL_ICONS[demo.vertical] ?? { Icon: Building2, label: demo.vertical }
  const { Icon: VertIcon, label: vertLabel } = verticalInfo
  const modelLabel = getModelLabel(demo.model)
  const modelColor = getModelColor(demo.model)
  const pct = Math.round(progress)

  return (
    <div className="card h-100 d-flex flex-column">
      {/* Card header */}
      <div className="card-body pb-2">
        <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
          <div className="flex-fill" style={{ minWidth: 0 }}>
            <h6 className="fw-bold mb-0 text-truncate text-body-secondary" style={{ fontSize: 13 }}>{demo.name}</h6>
            <p className="mb-0 text-muted text-truncate" style={{ fontSize: 12 }}>{demo.location} · {demo.tagline}</p>
          </div>
          {/* Status badge */}
          {generated ? (
            <span className="badge rounded-pill bg-label-success d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: 11 }}>
              <CheckCircle size={10} /> Lista
            </span>
          ) : isGenerating ? (
            <span className="badge rounded-pill bg-label-primary d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: 11 }}>
              <Loader2 size={10} className="animate-spin" /> Generando
            </span>
          ) : (
            <span className="badge rounded-pill bg-label-secondary d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: 11 }}>
              <AlertCircle size={10} /> Pendiente
            </span>
          )}
        </div>

        {/* Parameter pills */}
        <div className="d-flex flex-wrap gap-1 mt-2">
          <span className="badge bg-label-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: 11, fontWeight: 500 }}>
            <VertIcon size={10} /> {vertLabel}
          </span>
          <span className="badge bg-label-secondary d-inline-flex align-items-center gap-1" style={{ fontSize: 11, fontWeight: 500 }}>
            {demo.siteTheme === 'dark'
              ? <><Moon size={10} /> Oscuro</>
              : <><Sun size={10} /> Claro</>
            }
          </span>
          <span className="badge bg-label-secondary" style={{ fontSize: 11, fontWeight: 500 }}>
            {demo.stylePreset.charAt(0).toUpperCase() + demo.stylePreset.slice(1)}
          </span>
          <span className="badge bg-label-secondary" style={{ fontSize: 11, fontWeight: 500 }}>
            {demo.language.toUpperCase()}
          </span>
          <span className={`badge bg-label-${modelColor}`} style={{ fontSize: 11, fontWeight: 500 }}>
            {modelLabel}
          </span>
        </div>
      </div>

      {/* Progress bar (shown when generating) */}
      {isGenerating && (
        <div className="px-3 pb-2">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-muted text-truncate" style={{ fontSize: 11, maxWidth: '75%' }}>
              {getPortfolioStageLabel(progress, message)}
            </span>
            <span className="fw-semibold text-primary" style={{ fontSize: 11, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{pct}%</span>
          </div>
          <div className="progress" style={{ height: 4 }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
              style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card-footer bg-transparent d-flex align-items-center gap-2 mt-auto">
        {generated ? (
          <>
            <a
              href={generated.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-success d-flex align-items-center gap-1"
            >
              <ExternalLink size={12} /> Ver demo
            </a>
            <button
              onClick={copyDemoUrl}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              title="Copiar enlace"
            >
              {copied ? <Check size={12} style={{ color: '#10b981' }} /> : <Copy size={12} />}
            </button>
            <button
              onClick={() => onGenerate(demo)}
              disabled={isGenerating}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            >
              <RefreshCw size={12} /> Regenerar
            </button>
          </>
        ) : (
          <button
            onClick={() => onGenerate(demo)}
            disabled={isGenerating}
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
          >
            {isGenerating ? (
              <><Loader2 size={12} className="animate-spin" /> Generando...</>
            ) : (
              <><Play size={12} /> Generar</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminPortfolioPage() {
  const [generatedMap, setGeneratedMap] = useState<Record<string, GeneratedEntry>>({})
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [progressMap, setProgressMap] = useState<Record<string, number>>({})
  const [messageMap, setMessageMap] = useState<Record<string, string>>({})
  const startTimesRef = useRef<Record<string, number>>({})
  const [bulkRunning, setBulkRunning] = useState(false)

  useEffect(() => {
    fetch('/api/portfolio')
      .then(r => r.json())
      .then((clients: Client[]) => {
        const map: Record<string, GeneratedEntry> = {}
        for (const client of clients) {
          const demo = PORTFOLIO_DEMOS.find(d => d.name === client.name)
          if (demo) {
            const demoUrl = `${window.location.origin}/demo/${client.slug}`
            map[demo.id] = { demoUrl, clientId: client.id }
          }
        }
        setGeneratedMap(map)
      })
      .catch(() => {/* silently ignore */})
  }, [])

  const markGenerated = useCallback((demoId: string, entry: GeneratedEntry) => {
    setGeneratedMap(prev => ({ ...prev, [demoId]: entry }))
    setGeneratingIds(prev => { const s = new Set(prev); s.delete(demoId); return s })
    setProgressMap(prev => ({ ...prev, [demoId]: 100 }))
  }, [])

  const pollJob = useCallback((jobId: string, demoId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/${jobId}`)
        if (!res.ok) {
          setGeneratingIds(prev => { const s = new Set(prev); s.delete(demoId); return s })
          return
        }
        const job = await res.json()
        if (job.message) setMessageMap(prev => ({ ...prev, [demoId]: job.message }))
        if (job.status === 'done' && job.clientId && job.slug) {
          await fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: job.clientId, value: true }),
          })
          // Use current origin so the URL works on any domain (Railway, yaweb.ai, etc.)
          const demoUrl = `${window.location.origin}/demo/${job.slug}`
          markGenerated(demoId, { demoUrl, clientId: job.clientId })
        } else if (job.status === 'error') {
          setGeneratingIds(prev => { const s = new Set(prev); s.delete(demoId); return s })
        } else {
          setTimeout(poll, 3000)
        }
      } catch {
        setTimeout(poll, 5000)
      }
    }
    poll()
  }, [markGenerated])

  const animateProgress = useCallback((demoId: string, startTime: number) => {
    const frame = () => {
      const elapsed = Date.now() - startTime
      const p = interpolateProgress(elapsed)
      setProgressMap(prev => {
        // Stop updating if generation already finished (set to 100 by markGenerated)
        if ((prev[demoId] ?? 0) >= 100) return prev
        return { ...prev, [demoId]: p }
      })
      if (p < 97) {
        requestAnimationFrame(frame)
      }
    }
    requestAnimationFrame(frame)
  }, [])  // no deps — reads nothing from closure, avoids stale Set bug

  const handleGenerate = useCallback(async (demo: PortfolioDemoConfig) => {
    if (generatingIds.has(demo.id)) return

    setGeneratingIds(prev => new Set(prev).add(demo.id))
    setProgressMap(prev => ({ ...prev, [demo.id]: 0 }))

    const startTime = Date.now()
    startTimesRef.current[demo.id] = startTime

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extra_context: demo.context,
          menu_text: demo.menuText ?? undefined,
          whatsapp: demo.whatsapp ?? undefined,
          instagram: demo.social?.instagram ?? undefined,
          facebook: demo.social?.facebook ?? undefined,
          tiktok: demo.social?.tiktok ?? undefined,
          model: demo.model,
          site_theme: demo.siteTheme,
          style_preset: demo.stylePreset,
          tone: demo.tone,
          density: demo.density,
          language: demo.language,
          vertical_hint: demo.vertical,
          palette: demo.palette ?? undefined,
          value_prop: demo.valueProp ?? undefined,
          cta_type: demo.ctaType ?? undefined,
          booking_url: demo.bookingUrl ?? undefined,
        }),
      })
      const data: { job_id?: string; error?: string } = await res.json()
      if (!res.ok || !data.job_id) throw new Error(data.error ?? 'Error')

      animateProgress(demo.id, startTime)
      pollJob(data.job_id, demo.id)
    } catch {
      setGeneratingIds(prev => { const s = new Set(prev); s.delete(demo.id); return s })
    }
  }, [generatingIds, animateProgress, pollJob])

  const handleGenerateAll = useCallback(async () => {
    if (bulkRunning) return
    setBulkRunning(true)
    const pending = PORTFOLIO_DEMOS.filter(d => !generatedMap[d.id] && !generatingIds.has(d.id))
    for (const demo of pending) {
      if (!generatedMap[demo.id]) {
        await handleGenerate(demo)
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    setBulkRunning(false)
  }, [bulkRunning, generatedMap, generatingIds, handleGenerate])

  const generatedCount = Object.keys(generatedMap).length
  const pendingCount = PORTFOLIO_DEMOS.length - generatedCount

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <PageHeader
        title="Portfolio de demos"
        subtitle="Genera webs de ejemplo para mostrar en la página pública de portfolio"
        breadcrumb={[{ label: 'Admin', href: '/admin' }, { label: 'Portfolio' }]}
        action={
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted" style={{ fontSize: 13 }}>
              <strong className="text-body-secondary">{generatedCount}</strong>/{PORTFOLIO_DEMOS.length} generadas
            </span>
            {pendingCount > 0 && (
              <ActionButton onClick={handleGenerateAll} disabled={bulkRunning} variant="primary" size="sm">
                {bulkRunning ? (
                  <><Loader2 size={13} className="animate-spin" /> Generando {pendingCount}...</>
                ) : (
                  <><Zap size={13} /> Generar todo ({pendingCount})</>
                )}
              </ActionButton>
            )}
            {generatedCount > 0 && (
              <ActionButton href="/portfolio" variant="outline-secondary" size="sm">
                <ExternalLink size={13} /> Ver portfolio
              </ActionButton>
            )}
          </div>
        }
      />

      {/* Progress overview */}
      <AdminCard style={{ marginBottom: 24 }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="fw-semibold text-muted" style={{ fontSize: 12 }}>Progreso total</span>
          <span className="fw-bold text-primary" style={{ fontSize: 12 }}>{generatedCount}/{PORTFOLIO_DEMOS.length}</span>
        </div>
        <div className="progress" style={{ height: 6 }}>
          <div
            className="progress-bar bg-primary"
            style={{ width: `${(generatedCount / PORTFOLIO_DEMOS.length) * 100}%`, transition: 'width 0.5s ease' }}
          />
        </div>
      </AdminCard>

      {/* Grouped sections */}
      {MODEL_GROUPS.map(group => {
        const demos = PORTFOLIO_DEMOS.filter(d => d.model === group.model)
        if (demos.length === 0) return null
        const groupGenerated = demos.filter(d => generatedMap[d.id]).length

        return (
          <div key={group.model} className="mb-5">
            {/* Section header */}
            <div
              className={`d-flex align-items-center justify-content-between px-4 py-3 mb-3 rounded bg-label-${group.color}`}
              style={{ borderLeft: `4px solid var(--bs-${group.color})` }}
            >
              <div>
                <h6 className="fw-bold mb-0 text-body-secondary" style={{ fontSize: 14 }}>{group.label}</h6>
                <p className="mb-0 text-muted" style={{ fontSize: 12 }}>{group.subtitle}</p>
              </div>
              <span className={`badge rounded-pill bg-${group.color}`} style={{ fontSize: 11 }}>
                {groupGenerated}/{demos.length}
              </span>
            </div>

            {/* Cards grid */}
            <div className="row g-3">
              {demos.map(demo => (
                <div key={demo.id} className="col-xl-4 col-md-6">
                  <DemoCard
                    demo={demo}
                    generated={generatedMap[demo.id] ?? null}
                    isGenerating={generatingIds.has(demo.id)}
                    progress={progressMap[demo.id] ?? 0}
                    message={messageMap[demo.id]}
                    onGenerate={handleGenerate}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
