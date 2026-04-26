'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { STYLE_PRESETS, STYLE_PRESET_KEYS, type StylePresetKey } from '@/lib/style-presets'
import { SiteRenderer } from '@/components/site/SiteRenderer'
import type { HtmlContent, SiteData } from '@/types'
import {
  ExternalLink, Copy, Check,
  Zap, Star, Cpu, Brain, FlaskConical, ChevronDown,
  History, Trash2, Plus, Wand2,
  UtensilsCrossed, Wine, Scissors, Scale, Stethoscope,
  Dumbbell, Hotel, Pill, GraduationCap, ShoppingBag, Wrench, Building2,
  Sun, Moon, Globe, Rabbit,
  Phone, MessageCircle, Mail, Banknote,
  BarChart2,
  type LucideIcon,
} from 'lucide-react'

function IframePreview({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => { if (ref.current) ref.current.srcdoc = html }, [html])
  return <iframe ref={ref} style={{ width: '100%', height: '100%', border: 'none' }} sandbox="allow-forms allow-scripts allow-same-origin allow-popups" title={title} />
}

// Progress curve: [progress%, elapsed_ms]
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

const STAGES = [
  { at: 0,  label: 'Buscando el negocio en Google Maps...' },
  { at: 8,  label: 'Leyendo reseñas, horarios y fotos...' },
  { at: 18, label: 'Analizando el negocio con IA...' },
  { at: 32, label: 'Diseñando layout y paleta de colores...' },
  { at: 50, label: 'Escribiendo el contenido...' },
  { at: 68, label: 'Generando secciones y social proof...' },
  { at: 80, label: 'Añadiendo animaciones y detalles...' },
  { at: 88, label: 'Revisando y optimizando el código...' },
  { at: 94, label: 'Guardando y preparando la demo...' },
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

function getStageLabel(progress: number): string {
  let label = STAGES[0].label
  for (const s of STAGES) { if (progress >= s.at) label = s.label }
  return label
}

// Toggle pill — clean Apple-style, tablet-friendly, no subtitle clutter
const PILL_BTN: React.CSSProperties = {
  minHeight: 48,
  fontSize: 15,
  fontWeight: 500,
  lineHeight: 1.2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
}

function TogglePill<T extends string>({
  label, options, value, onChange,
}: {
  label: string
  options: { value: T; label: ReactNode; sub?: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const is4 = options.length === 4
  return (
    <div className="mb-5">
      <label className="form-label">{label}</label>
      {is4 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map(opt => {
            const active = value === opt.value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`btn ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={PILL_BTN}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="btn-group w-100" role="group">
          {options.map(opt => {
            const active = value === opt.value
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`btn ${active ? 'btn-primary' : 'btn-outline-secondary'}`}
                style={PILL_BTN}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Vertical data ─────────────────────────────────────────────────────────────

type VerticalKey = 'restaurant' | 'salon' | 'lawyer' | 'gym' | 'hotel' | 'clinic' | 'pharmacy' | 'bar' | 'shop' | 'academy' | 'workshop' | 'generic'

const VERTICALS: { key: VerticalKey; Icon: LucideIcon; label: string }[] = [
  { key: 'restaurant', Icon: UtensilsCrossed, label: 'Restaurante' },
  { key: 'bar',        Icon: Wine,            label: 'Bar'         },
  { key: 'salon',      Icon: Scissors,        label: 'Peluquería'  },
  { key: 'lawyer',     Icon: Scale,           label: 'Abogado'     },
  { key: 'clinic',     Icon: Stethoscope,     label: 'Clínica'     },
  { key: 'gym',        Icon: Dumbbell,        label: 'Gimnasio'    },
  { key: 'hotel',      Icon: Hotel,           label: 'Hotel'       },
  { key: 'pharmacy',   Icon: Pill,            label: 'Farmacia'    },
  { key: 'academy',    Icon: GraduationCap,   label: 'Academia'    },
  { key: 'shop',       Icon: ShoppingBag,     label: 'Tienda'      },
  { key: 'workshop',   Icon: Wrench,          label: 'Taller'      },
  { key: 'generic',    Icon: Building2,       label: 'Otro'        },
]

// Palette chips per vertical — informational only (not sent to AI, just visual preview)
const VERTICAL_PALETTES: Record<VerticalKey, { name: string; colors: string[] }[]> = {
  restaurant: [
    { name: 'Cálido terracota', colors: ['#b5623c', '#e8d5c4', '#2c2c2c', '#f9f5f1'] },
    { name: 'Elegante negro',   colors: ['#1a1a1a', '#d4a853', '#f7f3ee', '#8b7355'] },
  ],
  bar: [
    { name: 'Noche vibrante', colors: ['#7c3aed', '#f59e0b', '#1a1a2e', '#e2e8f0'] },
    { name: 'Industrial',     colors: ['#374151', '#ef4444', '#f9fafb', '#6b7280'] },
  ],
  salon: [
    { name: 'Rosa nude',    colors: ['#d4a5a5', '#f7e7e7', '#2d2d2d', '#8b6f6f'] },
    { name: 'Minimalista', colors: ['#1a1a1a', '#c9b89a', '#fafaf9', '#6b6b6b'] },
  ],
  lawyer: [
    { name: 'Azul corporativo', colors: ['#1e3a5f', '#c9a84c', '#f8f9fa', '#495057'] },
    { name: 'Grafito sobrio',   colors: ['#212529', '#6c757d', '#f8f9fa', '#343a40'] },
  ],
  clinic: [
    { name: 'Azul salud',  colors: ['#0ea5e9', '#e0f2fe', '#1e293b', '#64748b'] },
    { name: 'Verde calma', colors: ['#10b981', '#d1fae5', '#1f2937', '#6b7280'] },
  ],
  gym: [
    { name: 'Energía roja',    colors: ['#dc2626', '#171717', '#f5f5f5', '#a3a3a3'] },
    { name: 'Naranja potencia', colors: ['#ea580c', '#1c1917', '#fafaf9', '#78716c'] },
  ],
  hotel: [
    { name: 'Dorado lujo', colors: ['#b8962e', '#1a1209', '#fdf8f0', '#8b7355'] },
    { name: 'Azul resort', colors: ['#0369a1', '#f0f9ff', '#0c4a6e', '#bae6fd'] },
  ],
  pharmacy: [
    { name: 'Verde confianza', colors: ['#15803d', '#f0fdf4', '#14532d', '#86efac'] },
    { name: 'Azul limpio',     colors: ['#1d4ed8', '#eff6ff', '#1e3a8a', '#93c5fd'] },
  ],
  academy: [
    { name: 'Azul saber',      colors: ['#2563eb', '#eff6ff', '#1e1b4b', '#818cf8'] },
    { name: 'Naranja creativo', colors: ['#f97316', '#fff7ed', '#1c1917', '#fed7aa'] },
  ],
  shop: [
    { name: 'Negro premium', colors: ['#0f0f0f', '#d97706', '#fafafa', '#525252'] },
    { name: 'Coral moderno',  colors: ['#f43f5e', '#fff1f2', '#1f2937', '#fda4af'] },
  ],
  workshop: [
    { name: 'Industrial azul', colors: ['#1e40af', '#172554', '#f8fafc', '#94a3b8'] },
    { name: 'Naranja técnico', colors: ['#ea580c', '#431407', '#fafaf9', '#fed7aa'] },
  ],
  generic: [
    { name: 'Azul profesional', colors: ['#2563eb', '#eff6ff', '#1e293b', '#94a3b8'] },
    { name: 'Verde neutro',     colors: ['#059669', '#ecfdf5', '#064e3b', '#6ee7b7'] },
  ],
}

// Quick-fill example contexts
const EXAMPLE_CONTEXTS: { key: VerticalKey; label: string; context: string }[] = [
  {
    key: 'restaurant',
    label: 'Restaurante',
    context: `Restaurante Casa Pepe — Cocina vasca tradicional en el centro de Bilbao.
Especialidad en bacalao al pil pil, txangurro y chuletón de buey.
Menú del día 14€ (L-V). Carta para grupos y eventos privados.
Bodega con más de 80 referencias de vino. Ambiente familiar, 40 años de historia.
Dueño: Pepe Anduiza. Tel: +34 944 000 000. Capacidad: 60 comensales.`,
  },
  {
    key: 'salon',
    label: 'Peluquería',
    context: `Peluquería Noa — Salón de belleza en Madrid (barrio Malasaña).
Especialistas en coloración, mechas balayage y tratamientos de queratina.
También uñas y micropigmentación de cejas. Solo con cita previa.
Equipo de 4 estilistas formados en Italia. Clientes de 18 a 55 años.
Instagram: @peluqueria_noa. WhatsApp: +34 691 000 000.`,
  },
  {
    key: 'lawyer',
    label: 'Abogado',
    context: `Bufete Martínez & Asociados — Despacho de abogados en Barcelona.
Áreas: derecho laboral, despidos, accidentes de tráfico, divorcios y herencias.
Primera consulta gratuita. Honorarios claros, sin sorpresas.
15 años de experiencia. Más de 2.000 casos ganados.
Atención en castellano y catalán. Presencial y online.`,
  },
  {
    key: 'gym',
    label: 'Gimnasio',
    context: `GymForce Valencia — Gimnasio de alta intensidad y crossfit.
Clases: HIIT, boxeo, yoga, spinning y musculación libre.
Horario 6:00–23:00 todos los días. Cuota desde 29€/mes.
Entrenadores personales certificados. Zona de recuperación con sauna.
Prueba gratuita los primeros 7 días. WhatsApp: +34 620 000 000.`,
  },
  {
    key: 'hotel',
    label: 'Hotel',
    context: `Hotel Villa Mar — Boutique hotel 4 estrellas en Marbella, primera línea de playa.
24 habitaciones con vistas al mar. Piscina, spa y restaurante propio.
Desayuno incluido. Check-in flexible. Admite mascotas.
Ideal para parejas y escapadas de lujo. Traslados al aeropuerto disponibles.
Precio desde 180€/noche. Reservas: +34 952 000 000.`,
  },
]

// ── Saved context history ────────────────────────────────────────────────────

const LS_CONTEXTS_KEY = 'yw_saved_contexts'

interface SavedContext {
  id: string
  text: string
  savedAt: number
  preview: string
}

function loadSavedContexts(): SavedContext[] {
  try {
    const raw = localStorage.getItem(LS_CONTEXTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SavedContext[]
  } catch { return [] }
}

function saveContext(text: string) {
  const contexts = loadSavedContexts()
  const newCtx: SavedContext = {
    id: Date.now().toString(36),
    text,
    savedAt: Date.now(),
    preview: text.split('\n')[0].slice(0, 60),
  }
  const updated = [newCtx, ...contexts].slice(0, 10)
  localStorage.setItem(LS_CONTEXTS_KEY, JSON.stringify(updated))
}

function deleteContext(id: string) {
  const contexts = loadSavedContexts().filter(c => c.id !== id)
  localStorage.setItem(LS_CONTEXTS_KEY, JSON.stringify(contexts))
}

// ── AI Models (module-level so confirm modal + generating screen can use it) ──

// Ordered by cost descending (free models at the bottom, ordered by quality)
// Costs based on real generation data: ~14k input + ~27.5k output tokens (full mode)
// Compact models (Haiku, Gemini 2.0, Groq): ~6k input + ~7k output tokens
const AI_MODELS = [
  { id: 'claude-opus-4-7',                label: 'Opus 4.7',         cost: '~2.10€',  costNum: 2.10,  quality: 96, Icon: Star,         color: '#f59e0b', provider: 'Anthropic' },
  { id: 'claude-sonnet-4-6',              label: 'Sonnet 4.6',       cost: '~0.42€',  costNum: 0.42,  quality: 85, Icon: Zap,          color: '#696cff', provider: 'Anthropic' },
  { id: 'gpt-4o',                         label: 'GPT-4o',           cost: '~0.29€',  costNum: 0.29,  quality: 82, Icon: Brain,        color: '#10a37f', provider: 'OpenAI'    },
  { id: 'gemini-2.5-pro',                 label: 'Gemini 2.5 Pro',   cost: '~0.27€',  costNum: 0.27,  quality: 80, Icon: Brain,        color: '#4285f4', provider: 'Google'    },
  { id: 'claude-haiku-4-5-20251001',      label: 'Haiku 4.5',        cost: '~0.03€',  costNum: 0.03,  quality: 63, Icon: Cpu,          color: '#10b981', provider: 'Anthropic' },
  { id: 'gemini-2.5-flash',               label: 'Gemini 2.5 Flash', cost: '~0.02€',  costNum: 0.02,  quality: 70, Icon: FlaskConical, color: '#0ea5e9', provider: 'Google'    },
  { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash', cost: '~0.003€', costNum: 0.003, quality: 55, Icon: FlaskConical, color: '#38bdf8', provider: 'Google'    },
  { id: 'groq-llama-3.3-70b',             label: 'Llama 3.3 70B',    cost: 'Gratis',  costNum: 0,     quality: 58, Icon: Rabbit,       color: '#f97316', provider: 'Groq'      },
]

// ── Language options ─────────────────────────────────────────────────────────

const LANGUAGES = [
  { value: 'es' as const, label: 'ES' },
  { value: 'en' as const, label: 'EN' },
  { value: 'de' as const, label: 'DE' },
  { value: 'fr' as const, label: 'FR' },
]

type Step = 'input' | 'generating' | 'preview' | 'done'

export default function NewClientPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('input')
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [extraContext, setExtraContext] = useState('')
  const [menuText, setMenuText] = useState('')
  const [model, setModel] = useState('claude-opus-4-7')
  const [siteTheme, setSiteTheme] = useState<'light' | 'dark'>('light')
  const [stylePreset, setStylePreset] = useState<StylePresetKey>('auto')
  const [tone, setTone] = useState<'friendly' | 'formal'>('friendly')
  const [density, setDensity] = useState<'full' | 'minimal'>('full')
  const [generateVariants, setGenerateVariants] = useState(false)
  const [readWebsite, setReadWebsite] = useState(false)
  const [inspirationUrl, setInspirationUrl] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [servicesText, setServicesText] = useState('')
  const [valueProp, setValueProp] = useState('')
  const [bookingUrl, setBookingUrl] = useState('')
  const [heroPhotoUrl, setHeroPhotoUrl] = useState('')
  const [heroPhotoUploading, setHeroPhotoUploading] = useState(false)
  const [heroPhotoError, setHeroPhotoError] = useState('')
  const [ctaType, setCtaType] = useState<'phone' | 'whatsapp' | 'email' | 'quote'>('phone')
  const [isInternal, setIsInternal] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [language, setLanguage] = useState<'es' | 'en' | 'de' | 'fr'>('es')
  const [verticalHint, setVerticalHint] = useState<VerticalKey | ''>('')
  const [selectedPalette, setSelectedPalette] = useState<{ name: string; colors: string[] } | null>(null)
  const [showPalettes, setShowPalettes] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [savedContexts, setSavedContexts] = useState<SavedContext[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ slug: string; demo_url: string; business_name: string; client_id: string; template: string; inputTokens?: number; outputTokens?: number; costUsd?: number } | null>(null)
  const [buildReport, setBuildReport] = useState<import('@/lib/ai/generator').BuildReport | null>(null)
  const [showBuildReport, setShowBuildReport] = useState(false)
  const [htmlTruncated, setHtmlTruncated] = useState(false)
  const [validationWarning, setValidationWarning] = useState<string | null>(null)
  const [aiValidationIssues, setAiValidationIssues] = useState<string[]>([])
  const [errorLog, setErrorLog] = useState<string | null>(null)
  const [cacheReadTokens, setCacheReadTokens] = useState<number | null>(null)
  const [cacheWriteTokens, setCacheWriteTokens] = useState<number | null>(null)
  const [siteContent, setSiteContent] = useState<SiteData | HtmlContent | null>(null)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const startTimeRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const tickProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current
    const p = interpolateProgress(elapsed)
    setProgress(p)
    if (p < 97) rafRef.current = requestAnimationFrame(tickProgress)
  }, [])

  const pollJob = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/generate/${jobId}`)
        if (res.status === 404) {
          cancelAnimationFrame(rafRef.current)
          localStorage.removeItem('yaweb_job')
          setError('La generación fue interrumpida (servidor reiniciado). Inicia de nuevo.')
          setStep('input')
          return
        }
        if (!res.ok) throw new Error('Job not found')
        const job = await res.json()

        if (job.status === 'done') {
          cancelAnimationFrame(rafRef.current)
          localStorage.removeItem('yaweb_job')
          setProgress(100)
          setResult({ slug: job.slug, demo_url: job.demoUrl, business_name: job.businessName, client_id: job.clientId, template: 'html', inputTokens: job.inputTokens, outputTokens: job.outputTokens, costUsd: job.costUsd })
          if (job.buildReport) setBuildReport(job.buildReport)
          if (job.truncated) setHtmlTruncated(true)
          if (job.validationWarning) setValidationWarning(job.validationWarning)
          if (job.aiValidationIssues?.length) setAiValidationIssues(job.aiValidationIssues)
          if (job.cacheReadTokens  != null) setCacheReadTokens(job.cacheReadTokens)
          if (job.cacheWriteTokens != null) setCacheWriteTokens(job.cacheWriteTokens)

          const siteRes = await fetch('/api/clients')
          const clients = await siteRes.json()
          const client = clients.find((c: { id: string; site_content?: { content: SiteData | HtmlContent }[] | { content: SiteData | HtmlContent } }) => c.id === job.clientId)
          const content = Array.isArray(client?.site_content) ? client.site_content[0]?.content : client?.site_content?.content
          setSiteContent(content || null)
          setTimeout(() => setStep('preview'), 400)
        } else if (job.status === 'error') {
          cancelAnimationFrame(rafRef.current)
          localStorage.removeItem('yaweb_job')
          setError(typeof job.error === 'string' ? job.error : job.error ? JSON.stringify(job.error) : 'Error generando la web')
          if (job.errorLog) setErrorLog(job.errorLog)
          setStep('input')
        } else {
          setTimeout(poll, 3000)
        }
      } catch {
        setTimeout(poll, 5000)
      }
    }
    poll()
  }, [tickProgress])

  // Restore saved model + pre-fill from URL params
  useEffect(() => {
    const saved = localStorage.getItem('yaweb_model')
    if (saved) setModel(saved)
    const params = new URLSearchParams(window.location.search)
    if (params.get('google_url')) setUrl(params.get('google_url')!)
    if (params.get('email')) setEmail(params.get('email')!)
    setSavedContexts(loadSavedContexts())
  }, [])

  // Resume in-progress job on mount
  useEffect(() => {
    const saved = localStorage.getItem('yaweb_job')
    if (!saved) return
    try {
      const { jobId, startedAt } = JSON.parse(saved)
      if (Date.now() - startedAt > 10 * 60 * 1000) { localStorage.removeItem('yaweb_job'); return }
      setStep('generating')
      startTimeRef.current = startedAt
      rafRef.current = requestAnimationFrame(tickProgress)
      pollJob(jobId)
    } catch { localStorage.removeItem('yaweb_job') }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleLoadExample(ex: typeof EXAMPLE_CONTEXTS[0]) {
    setExtraContext(ex.context)
    setVerticalHint(ex.key)
    setSelectedPalette(null)
  }

  function handleSaveContext() {
    if (!extraContext.trim()) return
    saveContext(extraContext)
    setSavedContexts(loadSavedContexts())
  }

  function handleDeleteContext(id: string) {
    deleteContext(id)
    setSavedContexts(loadSavedContexts())
  }

  async function handleHeroPhotoUpload(file: File) {
    setHeroPhotoUploading(true)
    setHeroPhotoError('')
    setHeroPhotoUrl('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error subiendo la foto')
      setHeroPhotoUrl(data.url)
    } catch (err) {
      setHeroPhotoError(String(err))
    } finally {
      setHeroPhotoUploading(false)
    }
  }

  // Step 1 — show confirmation modal
  function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() && !extraContext.trim()) return
    setError('')
    setErrorLog(null)
    setShowConfirm(true)
  }

  // Step 2 — user confirmed, actually call the API
  async function doGenerate() {
    setShowConfirm(false)
    setProgress(0)
    setStep('generating')
    startTimeRef.current = Date.now()
    rafRef.current = requestAnimationFrame(tickProgress)
    localStorage.setItem('yaweb_model', model)
    setCacheReadTokens(null)
    setCacheWriteTokens(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_url: url || undefined,
          email: email || undefined,
          phone: phone || undefined,
          whatsapp: whatsapp.trim() || undefined,
          contact_email: email || undefined,
          extra_context: extraContext.trim() || undefined,
          menu_text: menuText.trim() || undefined,
          model,
          site_theme: siteTheme,
          style_preset: stylePreset,
          tone,
          density,
          variants: generateVariants,
          language,
          vertical_hint: verticalHint || undefined,
          palette: selectedPalette?.colors,
          is_internal: isInternal,
          read_website: readWebsite,
          inspiration_url: inspirationUrl.trim() || undefined,
          instagram: instagram.trim() || undefined,
          facebook: facebook.trim() || undefined,
          cta_type: ctaType !== 'phone' ? ctaType : undefined,
          services_text: servicesText.trim() || undefined,
          hero_photo_url: heroPhotoUrl || undefined,
          value_prop: valueProp.trim() || undefined,
          booking_url: bookingUrl.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error generando la web')

      localStorage.setItem('yaweb_job', JSON.stringify({ jobId: data.job_id, startedAt: startTimeRef.current }))
      pollJob(data.job_id)
    } catch (err) {
      cancelAnimationFrame(rafRef.current)
      setError(String(err))
      setStep('input')
    }
  }

  async function handleCopy() {
    if (!result) return
    const url = `${window.location.origin}/demo/${result.slug}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDiscard() {
    if (!result || discarding) return
    if (!confirm(`¿Seguro que quieres eliminar "${result.business_name}"? Esta acción no se puede deshacer.`)) return
    setDiscarding(true)
    try {
      await fetch(`/api/clients/${result.client_id}`, { method: 'DELETE' })
    } catch { /* ignore */ }
    // Reset to form so user can try again
    setResult(null)
    setSiteContent(null)
    setProgress(0)
    setDiscarding(false)
  }

  // ── Generating state ─────────────────────────────────────────────────────────
  if (step === 'generating') {
    const pct = Math.round(progress)
    const label = getStageLabel(progress)
    const activeModel = AI_MODELS.find(m => m.id === model) ?? AI_MODELS[0]
    const { Icon: ModelIcon, color: modelColor, label: modelLabel, cost: modelCost, costNum: modelCostNum, provider } = activeModel
    return (
      <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh', padding: '32px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div className="d-flex align-items-center justify-content-center mx-auto mb-3 rounded"
            style={{ width: 42, height: 42, background: 'linear-gradient(135deg, #696cff 0%, #5f61e6 100%)' }}>
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>ya</span>
          </div>
          <h5 className="text-center fw-semibold mb-1" style={{ color: '#566a7f' }}>Generando la web con IA</h5>
          <p className="text-center text-muted mb-3" style={{ fontSize: 13 }}>Diseñando una web única para este negocio</p>

          {/* Model info strip */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4 px-3 py-2 rounded"
            style={{ background: '#f8f9fa', border: '1px solid #e7e7e8' }}>
            <ModelIcon size={14} style={{ color: modelColor, flexShrink: 0 }} />
            <span className="fw-semibold" style={{ fontSize: 13, color: '#566a7f' }}>{modelLabel}</span>
            <span className="text-muted" style={{ fontSize: 12 }}>·</span>
            <span className="text-muted" style={{ fontSize: 12 }}>{provider}</span>
            <span className="badge rounded-pill ms-1"
              style={{ fontSize: 10, background: modelCostNum === 0 ? '#d1fae5' : '#e0e7ff', color: modelCostNum === 0 ? '#065f46' : '#3730a3' }}>
              {modelCost}
            </span>
            {generateVariants && (
              <span className="badge rounded-pill bg-label-warning ms-1" style={{ fontSize: 10 }}>A/B</span>
            )}
          </div>
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted" style={{ fontSize: 12 }}>{label}</span>
              <span className="fw-semibold text-primary" style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
            </div>
            <div className="progress" style={{ height: 6 }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
              />
            </div>
          </div>
          <div className="d-flex justify-content-between mt-4">
            {['Google', 'IA diseña', 'Contenido', 'Detalles', 'Listo'].map((s, i) => {
              const thresholds = [0, 18, 50, 80, 97]
              const done = progress >= thresholds[i]
              return (
                <div key={s} className="d-flex flex-column align-items-center" style={{ gap: 4 }}>
                  <div
                    className={`rounded-circle ${done ? 'bg-primary' : 'bg-light'}`}
                    style={{ width: 8, height: 8, transition: 'background-color 0.3s' }}
                  />
                  <span style={{ fontSize: 10, color: done ? '#696cff' : '#d9dee3', transition: 'color 0.3s' }}>{s}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Preview state ────────────────────────────────────────────────────────────
  if (step === 'preview' && result) {
    const isHtml = (siteContent as HtmlContent)?._type === 'html'
    return (
      <div className="d-flex flex-column" style={{ height: '100vh' }}>
        <div className="border-bottom bg-white px-4 py-3 d-flex align-items-center justify-content-between"
          style={{ position: 'sticky', top: 0, zIndex: 50, flexShrink: 0 }}>
          <div className="d-flex align-items-center gap-2">
            <span className="avatar-initial rounded-circle bg-label-primary flex-shrink-0"
              style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
              {result.business_name[0]?.toUpperCase()}
            </span>
            <span className="fw-semibold" style={{ fontSize: 13, color: '#566a7f' }}>{result.business_name}</span>
            <span className="badge rounded-pill bg-label-warning" style={{ fontSize: 11 }}>Demo</span>
            {result.costUsd !== undefined && (
              result.costUsd === 0
                ? <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}>Gratis</span>
                : <span className="badge rounded-pill bg-label-info" style={{ fontSize: 11 }} title="Coste de la generación (tokens de entrada + salida)">
                    ${result.costUsd < 0.01 ? result.costUsd.toFixed(4) : result.costUsd.toFixed(3)}
                  </span>
            )}
            {result.inputTokens !== undefined && (
              <span style={{ fontSize: 11, color: '#8592a3' }} title="Tokens de entrada + salida">
                {result.inputTokens.toLocaleString()}+{result.outputTokens?.toLocaleString()} tok
              </span>
            )}
            {/* Cache indicator — only shown for Claude models */}
            {cacheReadTokens != null && cacheReadTokens > 0 && (
              <span className="badge rounded-pill bg-label-success" style={{ fontSize: 11 }}
                title={`${cacheReadTokens.toLocaleString()} tokens leídos de caché — ahorro ~${((cacheReadTokens * 0.9 * 3) / 1_000_000).toFixed(4)}€`}>
                ⚡ Caché
              </span>
            )}
            {cacheWriteTokens != null && cacheWriteTokens > 0 && (cacheReadTokens == null || cacheReadTokens === 0) && (
              <span className="badge rounded-pill bg-label-secondary" style={{ fontSize: 11 }}
                title={`${cacheWriteTokens.toLocaleString()} tokens escritos en caché — próxima generación con el mismo preset será más barata`}>
                📝 Caché creado
              </span>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <a href={`/demo/${result.slug}`} target="_blank" rel="noopener noreferrer"
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
              <ExternalLink size={12} /> Abrir en pestaña
            </a>
            <button onClick={handleCopy}
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
              {copied ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied ? 'Copiado' : 'Copiar link'}
            </button>
            <button onClick={handleDiscard} disabled={discarding}
              className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1">
              <Trash2 size={12} /> {discarding ? 'Eliminando…' : 'Descartar'}
            </button>
            {buildReport && (
              <button onClick={() => setShowBuildReport(v => !v)}
                className={`btn btn-sm d-flex align-items-center gap-1 ${showBuildReport ? 'btn-primary' : 'btn-outline-secondary'}`}>
                <BarChart2 size={12} /> Build Report
              </button>
            )}
            <button onClick={() => router.push('/admin/clients')}
              className="btn btn-sm btn-primary d-flex align-items-center gap-1">
              Ir al listado
            </button>
          </div>
        </div>

        {/* ── Build Report panel ─────────────────────────────────────────── */}
        {showBuildReport && buildReport && (
          <div style={{ borderBottom: '1px solid #e9ecef', background: '#f8fafc', overflowY: 'auto', maxHeight: 340, flexShrink: 0 }}>
            <div className="px-4 py-3">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-3">
                  <span className="fw-semibold" style={{ fontSize: 13 }}>Build Report — {buildReport.business_name}</span>
                  <span className="badge bg-label-secondary" style={{ fontSize: 10 }}>{buildReport.model}</span>
                  <span className="badge bg-label-secondary" style={{ fontSize: 10 }}>{buildReport.vertical}</span>
                  {buildReport.compact_mode && <span className="badge bg-label-warning" style={{ fontSize: 10 }}>Modo compacto</span>}
                  {htmlTruncated && <span className="badge bg-label-danger" style={{ fontSize: 10 }}>⚠️ HTML truncado</span>}
                  {validationWarning && (
                    <span className="badge bg-label-warning" style={{ fontSize: 10 }} title={`Código: ${validationWarning}`}>
                      ⚠️ {validationWarning === 'too_short' ? 'HTML corto' : validationWarning === 'no_styles' ? 'Sin estilos' : validationWarning === 'has_placeholders' ? 'Placeholders' : validationWarning === 'too_few_sections' ? 'Pocas secciones' : `Alerta: ${validationWarning}`}
                    </span>
                  )}
                  {aiValidationIssues.length > 0 && (
                    <span className="badge bg-label-danger" style={{ fontSize: 10 }}>
                      🔍 {aiValidationIssues.length} problema{aiValidationIssues.length > 1 ? 's' : ''} IA
                    </span>
                  )}
                  {aiValidationIssues.length === 0 && buildReport && (
                    <span className="badge bg-label-success" style={{ fontSize: 10 }}>✓ Revisión IA OK</span>
                  )}
                  <span style={{ fontSize: 11, color: '#8592a3' }}>
                    {buildReport.stats.input_tokens.toLocaleString()}+{buildReport.stats.output_tokens.toLocaleString()} tok ·
                    ${buildReport.stats.cost_usd < 0.01 ? buildReport.stats.cost_usd.toFixed(4) : buildReport.stats.cost_usd.toFixed(3)}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#8592a3' }}>{new Date(buildReport.generated_at).toLocaleTimeString('es-ES')}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #dee2e6' }}>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: '#566a7f', width: '35%' }}>Sección</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, color: '#566a7f', width: '15%' }}>En Google Places</th>
                      <th style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 600, color: '#566a7f', width: '15%' }}>Incorporado</th>
                      <th style={{ padding: '4px 8px', textAlign: 'left', fontWeight: 600, color: '#566a7f' }}>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildReport.rows.map((row, i) => {
                      const statusBadge = (s: string) => {
                        if (s === 'yes')     return <span style={{ color: '#28a745', fontWeight: 600 }}>✅</span>
                        if (s === 'no')      return <span style={{ color: '#dc3545', fontWeight: 600 }}>❌</span>
                        if (s === 'partial') return <span style={{ color: '#fd7e14', fontWeight: 600 }}>⚠️</span>
                        return                      <span style={{ color: '#adb5bd' }}>—</span>
                      }
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f3f5', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)' }}>
                          <td style={{ padding: '3px 8px', color: '#384551' }}>{row.emoji} {row.section}</td>
                          <td style={{ padding: '3px 8px', textAlign: 'center' }}>{statusBadge(row.in_google)}</td>
                          <td style={{ padding: '3px 8px', textAlign: 'center' }}>{statusBadge(row.incorporated)}</td>
                          <td style={{ padding: '3px 8px', color: '#8592a3', fontSize: 11 }}>{row.detail || ''}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── AI quality audit issues ─────────────────────────────── */}
              {aiValidationIssues.length > 0 && (
                <div style={{ marginTop: 12, background: '#fff8ed', border: '1px solid #f6c23e', borderRadius: 6, padding: '10px 14px' }}>
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#856404' }}>🔍 Revisión IA — {aiValidationIssues.length} problema{aiValidationIssues.length > 1 ? 's' : ''} detectado{aiValidationIssues.length > 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 11, color: '#8592a3' }}>Usa el botón ✏️ IA de la lista para corregirlos</span>
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: 12, color: '#664d03' }}>
                    {aiValidationIssues.map((issue, i) => (
                      <li key={i} style={{ marginBottom: 3 }}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {isHtml ? (
            <IframePreview html={(siteContent as HtmlContent).html} title={result.business_name} />
          ) : siteContent ? (
            <div style={{ overflowY: 'auto', height: '100%' }}><SiteRenderer data={siteContent as SiteData} isDemo={true} /></div>
          ) : null}
        </div>
      </div>
    )
  }

  // ── Input form ───────────────────────────────────────────────────────────────
  const palettes = verticalHint ? VERTICAL_PALETTES[verticalHint] : null

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <form onSubmit={handleGenerate}>

        {/* ── Sneat-style page header ──────────────────────────────────────── */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-6 row-gap-4">
          <div className="d-flex flex-column justify-content-center">
            <h4 className="mb-1">Generar web con IA</h4>
            <p className="text-muted mb-0">Pega la URL de Google Business o describe el negocio</p>
          </div>
          <div className="d-flex align-content-center flex-wrap gap-4">
            <div className="d-flex gap-4">
              <button type="button" onClick={() => router.push('/admin/clients')} className="btn btn-label-secondary">
                Descartar
              </button>
            </div>
            <button
              type="submit"
              disabled={!url.trim() && !extraContext.trim()}
              className="btn btn-primary d-flex align-items-center gap-2"
            >
              <Wand2 size={16} /> Generar web
            </button>
          </div>
        </div>

        <div className="row">

          {/* ── Left column — main inputs ─────────────────────────────── */}
          <div className="col-12 col-lg-8">

            {/* ── Card 1: Negocio ── */}
            <div className="card mb-6">
              <div className="card-header">
                <h5 className="card-title mb-0">Datos del negocio</h5>
              </div>
              <div className="card-body">

            {/* Cliente / Prueba toggle */}
            <div className="mb-6">
              <label className="form-label">
                Tipo de web
              </label>
              <div className="btn-group w-100" role="group" aria-label="Tipo de web">
                <button
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={`btn ${!isInternal ? 'btn-primary' : 'btn-outline-secondary'}`}
                  style={{ lineHeight: 1.4 }}
                >
                  <div className="fw-semibold" style={{ fontSize: 13 }}>Cliente</div>
                  <div style={{ fontSize: 11, opacity: !isInternal ? 0.85 : 0.6 }}>Va al Pipeline → se convierte con pago</div>
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={`btn ${isInternal ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  style={{ lineHeight: 1.4 }}
                >
                  <div className="fw-semibold" style={{ fontSize: 13 }}>Prueba interna</div>
                  <div style={{ fontSize: 11, opacity: isInternal ? 0.85 : 0.6 }}>Va a Pruebas — no aparece en el pipeline</div>
                </button>
              </div>
            </div>

            {/* URL */}
            <div className="mb-6">
              <label className="form-label">
                URL de Google Business{' '}
                <span className="fw-normal text-muted">— opcional si hay contexto</span>
              </label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://maps.google.com/maps?cid=... ó https://g.page/..."
                className="form-control"
              />
              <div className="form-text">Copia la URL desde Google Maps del negocio</div>
            </div>

            {/* Vertical hint */}
            <div className="mb-6">
              <label className="form-label">
                Tipo de negocio{' '}
                <span className="fw-normal text-muted">— {url.trim() ? 'lo detecta la IA desde Google' : 'opcional, ayuda a la IA si no hay URL'}</span>
              </label>
              {url.trim() ? (
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                  Con URL de Google el vertical se detecta automáticamente — no es necesario seleccionarlo.
                </p>
              ) : (
              <div className="row g-2">
                {VERTICALS.map(({ key, Icon, label }) => (
                  <div key={key} className="col-4 col-sm-3 col-md-2">
                    <button
                      type="button"
                      onClick={() => {
                        setVerticalHint(key === verticalHint ? '' : key)
                        setShowPalettes(false)
                      }}
                      className={`btn w-100 d-flex align-items-center justify-content-center gap-1 ${verticalHint === key ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ minHeight: 44, fontSize: 13 }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  </div>
                ))}
              </div>
              )}

              {/* Palette preview when vertical is selected (only relevant without URL) */}
              {!url.trim() && palettes && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowPalettes(v => !v)}
                    className="btn btn-link btn-sm p-0 d-flex align-items-center gap-2 text-decoration-none"
                    style={{ fontSize: 12 }}
                  >
                    <span className="d-flex gap-1">
                      {palettes[0].colors.slice(0, 3).map(c => (
                        <span key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                      ))}
                    </span>
                    {showPalettes ? 'Ocultar paletas' : 'Ver paletas sugeridas →'}
                  </button>

                  {showPalettes && (
                    <div className="mt-2 d-flex flex-wrap gap-3">
                      {palettes.map(p => {
                        const isSelected = selectedPalette?.name === p.name
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => setSelectedPalette(isSelected ? null : p)}
                            className="btn p-2 d-flex flex-column gap-2"
                            style={{
                              border: `1px solid ${isSelected ? '#696cff' : '#d9dee3'}`,
                              background: isSelected ? 'rgba(105,108,255,0.08)' : 'transparent',
                              borderRadius: 8, lineHeight: 1,
                            }}
                          >
                            <div className="d-flex gap-1">
                              {p.colors.map(c => (
                                <div key={c} title={c} style={{ width: 28, height: 28, borderRadius: 4, background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                              ))}
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 500, color: isSelected ? '#696cff' : '#8592a3' }}>{p.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {selectedPalette && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      <div className="d-flex gap-1">
                        {selectedPalette.colors.map(c => (
                          <span key={c} style={{ width: 14, height: 14, borderRadius: 3, background: c, border: '1px solid rgba(0,0,0,0.1)', display: 'inline-block' }} />
                        ))}
                      </div>
                      <span className="text-primary fw-semibold" style={{ fontSize: 11 }}>{selectedPalette.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedPalette(null)}
                        className="btn btn-link btn-sm p-0 ms-1 text-muted text-decoration-none"
                        style={{ fontSize: 14, lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

              </div>{/* /card-body */}
            </div>{/* /card Negocio */}

            {/* ── Card 2: Contenido ── */}
            <div className="card mb-6">
              <div className="card-header">
                <h5 className="card-title mb-0">Contenido</h5>
              </div>
              <div className="card-body">

            {/* Extra context */}
            <div className="mb-6">
              <label className="form-label mb-1">
                Diferenciador clave{' '}
                <span className="fw-normal text-muted">(opcional)</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej: Urgencias el mismo día · Presupuesto sin compromiso · 20 años de experiencia"
                value={valueProp}
                onChange={e => setValueProp(e.target.value)}
              />
              <div className="form-text">Se usa en el hero y en la sección &lsquo;Por qué elegirnos&rsquo;. Una frase, sin puntos.</div>
            </div>

            {/* Booking URL */}
            <div className="mb-6">
              <label className="form-label mb-1">
                Reservas online{' '}
                <span className="fw-normal text-muted">(opcional)</span>
              </label>
              <input
                type="url"
                className="form-control"
                placeholder="https://calendly.com/tu-negocio  o  https://booksy.com/..."
                value={bookingUrl}
                onChange={e => setBookingUrl(e.target.value)}
              />
              <div className="form-text">
                Con Calendly → widget inline embebido. Con cualquier otra URL → botón &ldquo;Reservar cita&rdquo; prominente.
              </div>
            </div>

            <div className="mb-6">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="form-label mb-0">
                  Contexto adicional{' '}
                  <span className="fw-normal text-muted">— opcional</span>
                </label>
                <div className="d-flex gap-2">
                  {extraContext.trim() && (
                    <button
                      type="button"
                      onClick={handleSaveContext}
                      className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      style={{ fontSize: 11 }}
                    >
                      <Plus size={11} /> Guardar
                    </button>
                  )}
                  {savedContexts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistory(v => !v)}
                      className={`btn btn-sm d-flex align-items-center gap-1 ${showHistory ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize: 11 }}
                    >
                      <History size={11} /> Historial ({savedContexts.length})
                    </button>
                  )}
                </div>
              </div>

              {/* History dropdown */}
              {showHistory && savedContexts.length > 0 && (
                <div className="card mb-2">
                  <ul className="list-group list-group-flush">
                    {savedContexts.map(ctx => (
                      <li key={ctx.id} className="list-group-item d-flex align-items-center justify-content-between px-3 py-2">
                        <button
                          type="button"
                          onClick={() => { setExtraContext(ctx.text); setShowHistory(false) }}
                          className="text-start flex-grow-1 border-0 bg-transparent p-0"
                        >
                          <p className="mb-0 fw-medium text-truncate" style={{ fontSize: 12, color: '#566a7f' }}>{ctx.preview}</p>
                          <p className="mb-0 text-muted" style={{ fontSize: 10 }}>{new Date(ctx.savedAt).toLocaleDateString('es-ES')}</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContext(ctx.id)}
                          className="btn btn-link btn-sm text-danger p-0 ms-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <textarea
                value={extraContext}
                onChange={e => setExtraContext(e.target.value)}
                placeholder="Ej: Especialidad en cocina vasca, ambiente familiar. El dueño quiere destacar el menú del día y los eventos privados. Tono cercano, no formal."
                rows={3}
                className="form-control"
              />

              <div className="form-text">
                El cliente puede darte detalles que Google no tiene.{' '}
                <strong>Sin URL</strong>, este campo es el prompt completo.
              </div>
            </div>

              </div>{/* /card-body */}
            </div>{/* /card Contenido */}

            {/* ── Card 3: Contacto ── */}
            <div className="card mb-6">
              <div className="card-header">
                <h5 className="card-title mb-0">Contacto</h5>
              </div>
              <div className="card-body">

            {/* Email + Phone */}
            <div className="row g-6 mb-6">
              <div className="col-md-6">
                <label className="form-label">Email del cliente</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@negocio.com"
                  className="form-control"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="form-control"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div className="mb-6">
              <label className="form-label">
                WhatsApp{' '}
                <span className="fw-normal text-muted">— opcional si es distinto al teléfono</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="+34 600 000 000"
                className="form-control"
              />
            </div>

              </div>{/* /card-body */}
            </div>{/* /card Contacto */}

            {/* Advanced options */}
            <div className="card mb-6">
              <div className="card-header p-0">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(v => !v)}
                  className="d-flex align-items-center justify-content-between w-100 px-4 py-3 border-0 bg-transparent text-start fw-semibold"
                  style={{ color: '#384551', cursor: 'pointer' }}
                >
                  <span className="d-flex align-items-center gap-2">
                    Opciones avanzadas
                    {(menuText || generateVariants || !readWebsite || inspirationUrl) && (
                      <span className="badge rounded-pill bg-label-primary" style={{ fontSize: 10 }}>
                        activas
                      </span>
                    )}
                  </span>
                  <span
                    className="d-flex align-items-center justify-content-center rounded-circle bg-label-secondary"
                    style={{ width: 24, height: 24, flexShrink: 0, transition: 'transform 0.2s', transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <ChevronDown size={14} style={{ color: '#697a8d' }} />
                  </span>
                </button>
              </div>
              {showAdvanced && (
                <div className="card-body">
                  {/* Servicios */}
                  <div className="mb-3">
                    <label className="form-label">
                      Servicios / Precios{' '}
                      <span className="fw-normal text-muted">— para salones, talleres, gimnasios, etc.</span>
                    </label>
                    <textarea
                      value={servicesText}
                      onChange={e => setServicesText(e.target.value)}
                      placeholder={'Corte de cabello — 25€\nBalayage completo — desde 120€\nTratamiento Olaplex — 60€\n\nNails\nManos — 35€\nPies — 40€\nManos + Pies — 65€'}
                      rows={6}
                      className="form-control font-monospace"
                    />
                    <div className="form-text">Pega el listado real de servicios y precios. La IA los renderizará en tarjetas bonitas — no inventará nada.</div>
                  </div>

                  {/* Carta / Menú */}
                  <div className="mb-3">
                    <label className="form-label">
                      Carta / Menú{' '}
                      <span className="fw-normal text-muted">— restaurantes y bares</span>
                    </label>
                    <textarea
                      value={menuText}
                      onChange={e => setMenuText(e.target.value)}
                      placeholder={'Entrantes:\n- Croquetas caseras 8€\n- Jamón ibérico 14€\n\nPrincipales:\n- Bacalao al pil pil 18€\n- Chuletón 1kg 42€\n\nPostres:\n- Tarta de queso 6€'}
                      rows={6}
                      className="form-control font-monospace"
                    />
                    <div className="form-text">Pega el texto real de la carta. La IA lo renderizará — no inventará platos ni precios.</div>
                  </div>

                  {/* Variants A/B */}
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="variantsSwitch"
                      checked={generateVariants}
                      onChange={e => setGenerateVariants(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="variantsSwitch">
                      Generar variantes A/B
                    </label>
                    <div className="form-text">Genera dos estilos visuales distintos en paralelo. Doble coste, doble resultado.</div>
                  </div>

                  {/* Read existing website */}
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="readWebsiteSwitch"
                      checked={readWebsite}
                      onChange={e => setReadWebsite(e.target.checked)}
                    />
                    <label className="form-check-label d-flex align-items-center gap-1" htmlFor="readWebsiteSwitch">
                      <Globe size={13} className="text-muted" />
                      Leer web existente del negocio
                    </label>
                    <div className="form-text">Si Google Places tiene URL de su web actual, la leemos para extraer menú real, precios y servicios. Desactívalo si genera ruido.</div>
                  </div>

                  {/* Inspiration URL */}
                  <div className="mt-3 pt-3 border-top">
                    <label className="form-label d-flex align-items-center gap-1">
                      <Globe size={13} className="text-muted" />
                      URL de inspiración{' '}
                      <span className="fw-normal text-muted">— opcional</span>
                    </label>
                    <input
                      type="url"
                      value={inspirationUrl}
                      onChange={e => setInspirationUrl(e.target.value)}
                      placeholder="https://ejemplo.com — copiará el estilo visual"
                      className="form-control"
                    />
                    <div className="form-text">
                      Pega cualquier web cuyo diseño te guste. Haiku extraerá colores, tipografía y estructura para usarlos como referencia. No copia contenido, solo el estilo.
                    </div>
                  </div>

                  {/* Hero photo upload */}
                  <div className="mt-3 pt-3 border-top">
                    <label className="form-label d-flex align-items-center gap-1">
                      Foto del hero{' '}
                      <span className="fw-normal text-muted">— opcional</span>
                    </label>
                    <div className="d-flex align-items-start gap-3">
                      <div className="flex-fill">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="form-control"
                          disabled={heroPhotoUploading}
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) handleHeroPhotoUpload(f)
                          }}
                        />
                        <div className="form-text">
                          JPG, PNG o WebP · máx 5 MB. Sustituye la foto de Google en el fondo del hero.
                        </div>
                        {heroPhotoUploading && (
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <div className="spinner-border spinner-border-sm text-primary" role="status" />
                            <span className="text-muted" style={{ fontSize: 12 }}>Subiendo foto…</span>
                          </div>
                        )}
                        {heroPhotoError && (
                          <div className="text-danger mt-1" style={{ fontSize: 12 }}>{heroPhotoError}</div>
                        )}
                      </div>
                      {heroPhotoUrl && !heroPhotoUploading && (
                        <div className="position-relative flex-shrink-0">
                          <img
                            src={heroPhotoUrl}
                            alt="Hero preview"
                            style={{ width: 80, height: 56, objectFit: 'cover', borderRadius: 6, border: '2px solid #696cff' }}
                          />
                          <button
                            type="button"
                            onClick={() => { setHeroPhotoUrl(''); setHeroPhotoError('') }}
                            className="btn btn-sm position-absolute"
                            style={{ top: -8, right: -8, width: 18, height: 18, padding: 0, borderRadius: '50%', background: '#dc3545', color: '#fff', fontSize: 10, lineHeight: 1, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            aria-label="Quitar foto"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Social media */}
                  <div className="mt-3 pt-3 border-top">
                    <label className="form-label mb-2 d-flex align-items-center gap-1">
                      Redes sociales{' '}
                      <span className="fw-normal text-muted">— opcional</span>
                    </label>
                    <div className="row g-2">
                      <div className="col-md-6">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text"><i className="bx bxl-instagram" style={{ fontSize: 14 }} /></span>
                          <input
                            type="text"
                            value={instagram}
                            onChange={e => setInstagram(e.target.value)}
                            placeholder="@handle ó URL"
                            className="form-control"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="input-group input-group-sm">
                          <span className="input-group-text"><i className="bx bxl-facebook" style={{ fontSize: 14 }} /></span>
                          <input
                            type="text"
                            value={facebook}
                            onChange={e => setFacebook(e.target.value)}
                            placeholder="URL de Facebook"
                            className="form-control"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="form-text">Si existen, la IA añade iconos sociales en el footer.</div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="alert alert-danger mb-3" role="alert">
                <div className="d-flex align-items-center mb-2">
                  <i className="bx bx-error-circle me-2" style={{ fontSize: 18, flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
                {errorLog && (
                  <div style={{ marginTop: 10 }}>
                    <pre style={{ fontSize: 10, background: 'rgba(0,0,0,.06)', borderRadius: 6, padding: '8px 10px', maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>{errorLog}</pre>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mt-2"
                      style={{ fontSize: 11 }}
                      onClick={() => { navigator.clipboard.writeText(errorLog); }}
                    >
                      <i className="bx bx-copy me-1" />Copiar log de error
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ── Right column — generation params ──────────────────────── */}
          <div className="col-12 col-lg-4">
            <div className="card mb-6" style={{ position: 'sticky', top: '4.5rem' }}>
              <div className="card-header">
                <h5 className="card-title mb-0">Parámetros de generación</h5>
              </div>
              <div className="card-body">

                {/* Language selector */}
                <div className="mb-6">
                  <label className="form-label">
                    Idioma de la web
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => setLanguage(lang.value)}
                        className={`btn ${language === lang.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                        style={{ minHeight: 44, minWidth: 64, fontSize: 15, fontWeight: 600, letterSpacing: '0.03em' }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle pills */}
                <TogglePill
                  label="Tema del sitio"
                  value={siteTheme}
                  onChange={setSiteTheme}
                  options={[
                    { value: 'light', label: <><Sun size={11} />Claro</>,   sub: 'Fondo blanco' },
                    { value: 'dark',  label: <><Moon size={11} />Oscuro</>,  sub: 'Fondo oscuro' },
                  ]}
                />
                {/* Style preset — visual card grid */}
                <div className="mb-5">
                  <label className="form-label">Estilo visual</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 6 }}>
                    {STYLE_PRESET_KEYS.map(key => {
                      const p = STYLE_PRESETS[key]
                      const active = stylePreset === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStylePreset(key)}
                          style={{
                            border: active ? '2px solid #696cff' : '2px solid transparent',
                            borderRadius: 10,
                            padding: '8px 6px 6px',
                            background: active ? 'rgba(105,108,255,.08)' : 'var(--bs-body-bg, #fff)',
                            boxShadow: active ? '0 0 0 1px #696cff22' : '0 1px 3px rgba(0,0,0,.08)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all .15s',
                          }}
                        >
                          {/* Color swatches */}
                          <div style={{ display: 'flex', gap: 4, marginBottom: 7 }}>
                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.accentColor, display: 'inline-block', flexShrink: 0 }} />
                            <span style={{ width: 16, height: 16, borderRadius: '50%', background: p.bgColor, border: '1px solid rgba(0,0,0,.1)', display: 'inline-block', flexShrink: 0 }} />
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: active ? '#696cff' : 'var(--bs-body-color, #111)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.description}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <TogglePill
                  label="Tono del texto"
                  value={tone}
                  onChange={setTone}
                  options={[
                    { value: 'friendly', label: 'Cercano', sub: 'Tuteo, emojis' },
                    { value: 'formal',   label: 'Formal',  sub: 'Usted, serio' },
                  ]}
                />
                <TogglePill
                  label="Densidad"
                  value={density}
                  onChange={setDensity}
                  options={[
                    { value: 'full',    label: 'Completo', sub: 'Todas las secciones' },
                    { value: 'minimal', label: 'Mínimo',   sub: 'Landing limpia' },
                  ]}
                />
                <TogglePill
                  label="CTA principal"
                  value={ctaType}
                  onChange={setCtaType}
                  options={[
                    { value: 'phone',    label: <><Phone size={11} />Llamar</>,       sub: 'Tel como acción'   },
                    { value: 'whatsapp', label: <><MessageCircle size={11} />WA</>,   sub: 'como acción'       },
                    { value: 'email',    label: <><Mail size={11} />Email</>,          sub: 'Formulario/email'  },
                    { value: 'quote',    label: <><Banknote size={11} />Solicitar</>,  sub: 'precio'            },
                  ]}
                />

                {/* Model selector */}
                <div>
                  <label className="form-label">
                    Modelo de IA
                  </label>
                  <div className="d-flex flex-column gap-1">
                    {AI_MODELS.map(({ id, label, cost, costNum, quality, Icon, color, provider }) => {
                      const isSelected = model === id
                      const isFree = costNum === 0
                      const qualityColor = quality >= 85 ? '#696cff' : quality >= 70 ? '#10b981' : '#f59e0b'
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setModel(id)}
                          className="text-start w-100"
                          style={{
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? '#696cff' : '#e7e7e8'}`,
                            background: isSelected ? 'rgba(105,108,255,0.06)' : 'transparent',
                            borderRadius: 8,
                            padding: '8px 10px',
                          }}
                        >
                          {/* Row 1: radio + icon + name + cost */}
                          <div className="d-flex align-items-center gap-2">
                            <div className="d-flex align-items-center justify-content-center flex-shrink-0 rounded-circle"
                              style={{ width: 13, height: 13, border: `2px solid ${isSelected ? '#696cff' : '#d9dee3'}`, background: isSelected ? '#696cff' : 'transparent', flexShrink: 0 }}>
                              {isSelected && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff' }} />}
                            </div>
                            <Icon size={12} style={{ color, flexShrink: 0 }} />
                            <span className="fw-semibold flex-fill" style={{ fontSize: 13, color: isSelected ? '#696cff' : '#384551' }}>{label}</span>
                            <span className="fw-bold flex-shrink-0"
                              style={{ fontSize: 12, color: isFree ? '#059669' : '#566a7f' }}>
                              {cost}
                            </span>
                          </div>
                          {/* Row 2: provider + quality bar */}
                          <div className="d-flex align-items-center gap-2 mt-1" style={{ paddingLeft: 25 }}>
                            <span style={{ fontSize: 10, color: '#adb5bd', minWidth: 52 }}>{provider}</span>
                            <div className="flex-fill" style={{ height: 3, background: '#e9ecef', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${quality}%`, background: qualityColor, borderRadius: 2, transition: 'width 0.3s' }} />
                            </div>
                            <span style={{ fontSize: 10, color: qualityColor, fontWeight: 600, minWidth: 28, textAlign: 'right' }}>{quality}%</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── URL helper ── */}
                <div className="pt-4 mt-2 border-top">
                  <p className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#8592a3', textTransform: 'uppercase' }}>
                    <i className="bx bx-map-pin" style={{ fontSize: 13 }} />
                    ¿Cómo obtener la URL?
                  </p>
                  <ol className="mb-0 ps-3" style={{ fontSize: 12, color: '#8592a3' }}>
                    <li className="mb-1">Busca el negocio en <strong style={{ color: '#566a7f' }}>Google Maps</strong></li>
                    <li className="mb-1">Haz clic en el negocio para abrir su ficha</li>
                    <li className="mb-1">Copia la URL del navegador</li>
                    <li>O usa Compartir → Copiar enlace</li>
                  </ol>
                </div>

              </div>
            </div>

          </div>

        </div>
      </form>

      {/* ── Confirmation modal ────────────────────────────────────────────── */}
      {showConfirm && (() => {
        const m = AI_MODELS.find(x => x.id === model) ?? AI_MODELS[0]
        const isFree = m.costNum === 0
        const THEME_LABELS   = { light: 'Claro', dark: 'Oscuro' }
        const STYLE_LABELS   = Object.fromEntries(STYLE_PRESET_KEYS.map(k => [k, STYLE_PRESETS[k].name])) as Record<StylePresetKey, string>
        const TONE_LABELS    = { friendly: 'Cercano', formal: 'Formal' }
        const DENSITY_LABELS = { full: 'Completo', minimal: 'Mínimo' }
        const LANG_LABELS    = { es: 'ES', en: 'EN', de: 'DE', fr: 'FR' }
        return (
          <>
            {/* Backdrop */}
            <div
              onClick={() => setShowConfirm(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1040, background: 'rgba(67,89,113,0.4)', backdropFilter: 'blur(2px)' }}
            />
            {/* Dialog */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
              <div className="card shadow-lg" style={{ width: '100%', maxWidth: 460 }}>

                {/* Header */}
                <div className="card-header d-flex align-items-center justify-content-between py-3">
                  <h5 className="mb-0 fw-bold" style={{ fontSize: 15, color: '#566a7f' }}>Confirmar generación</h5>
                  <button type="button" onClick={() => setShowConfirm(false)} className="btn btn-sm btn-outline-secondary" style={{ fontSize: 11 }}>✕</button>
                </div>

                <div className="card-body">

                  {/* Model + cost — hero area */}
                  <div className="rounded p-3 mb-3 d-flex align-items-center gap-3"
                    style={{ background: isFree ? '#f0fdf4' : '#eff0ff', border: `2px solid ${isFree ? '#a7f3d0' : '#c7c8ff'}` }}>
                    <div className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{ width: 44, height: 44, background: isFree ? '#d1fae5' : '#e0e7ff' }}>
                      <m.Icon size={20} style={{ color: m.color }} />
                    </div>
                    <div className="flex-fill">
                      <div className="fw-bold" style={{ fontSize: 16, color: '#566a7f' }}>{m.label}</div>
                      <div style={{ fontSize: 12, color: '#8592a3' }}>{m.provider}</div>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <div className="fw-black" style={{ fontSize: 24, color: isFree ? '#059669' : '#696cff', letterSpacing: '-0.5px' }}>
                        {isFree ? 'Gratis' : m.cost}
                      </div>
                      <div style={{ fontSize: 11, color: '#8592a3' }}>coste estimado</div>
                    </div>
                  </div>

                  {/* Params summary */}
                  <div className="rounded p-3 mb-3" style={{ background: '#f8f9fa' }}>
                    <div className="row g-2" style={{ fontSize: 12 }}>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Tema</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{THEME_LABELS[siteTheme]}</span>
                      </div>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Estilo</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{STYLE_LABELS[stylePreset]}</span>
                      </div>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Tono</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{TONE_LABELS[tone]}</span>
                      </div>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Densidad</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{DENSITY_LABELS[density]}</span>
                      </div>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Idioma</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{LANG_LABELS[language]}</span>
                      </div>
                      <div className="col-6 d-flex justify-content-between">
                        <span className="text-muted">Tipo</span>
                        <span className="fw-semibold" style={{ color: '#566a7f' }}>{isInternal ? 'Prueba interna' : 'Cliente'}</span>
                      </div>
                    </div>
                    {/* Extras row */}
                    <div className="d-flex flex-wrap gap-1 mt-2 pt-2 border-top">
                      {generateVariants && <span className="badge bg-label-warning" style={{ fontSize: 10 }}>Variantes A/B</span>}
                      {readWebsite      && <span className="badge bg-label-primary" style={{ fontSize: 10 }}>Lee web actual</span>}
                      {inspirationUrl   && <span className="badge bg-label-info"    style={{ fontSize: 10 }}>URL inspiración</span>}
                      {menuText         && <span className="badge bg-label-success" style={{ fontSize: 10 }}>Carta incluida</span>}
                      {selectedPalette  && <span className="badge bg-label-secondary" style={{ fontSize: 10 }}>Paleta: {selectedPalette.name}</span>}
                      {(instagram || facebook) && <span className="badge bg-label-info" style={{ fontSize: 10 }}>Redes sociales</span>}
                      {ctaType !== 'phone' && <span className="badge bg-label-warning" style={{ fontSize: 10 }}>CTA: {ctaType}</span>}
                      {servicesText.trim() && <span className="badge bg-label-success" style={{ fontSize: 10 }}>Servicios incluidos</span>}
                      {heroPhotoUrl && <span className="badge bg-label-primary" style={{ fontSize: 10 }}>Foto hero personalizada</span>}
                      {valueProp.trim() && <span className="badge bg-label-success" style={{ fontSize: 10 }}>Diferenciador</span>}
                      {bookingUrl.trim() && <span className="badge bg-label-info" style={{ fontSize: 10 }}>{bookingUrl.includes('calendly.com') ? 'Calendly widget' : 'Reservas online'}</span>}
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="card-footer d-flex gap-2 justify-content-end">
                  <button type="button" onClick={() => setShowConfirm(false)} className="btn btn-outline-secondary">
                    Cancelar
                  </button>
                  <button type="button" onClick={doGenerate} className="btn btn-primary d-flex align-items-center gap-2">
                    <Wand2 size={14} /> Confirmar y generar
                  </button>
                </div>

              </div>
            </div>
          </>
        )
      })()}
    </div>
  )
}
