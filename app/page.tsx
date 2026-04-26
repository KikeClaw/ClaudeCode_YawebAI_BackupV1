'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  MapPin, Wand2, Smartphone, Zap, Phone, Search,
  ChevronLeft, ChevronRight, ArrowRight, Check,
  MessageCircle, ClipboardList, CalendarCheck, Clock, Maximize2, Star,
  Users2, FileText, Images, Share2, UtensilsCrossed,
} from 'lucide-react'
import type { AuditResult } from './api/audit/route'

// ─── Progress curve & stage labels ─────────────────────────────────────────
const CURVE: [number, number][] = [
  [0,0],[8,6e3],[18,14e3],[32,30e3],[50,60e3],
  [68,100e3],[80,140e3],[88,180e3],[94,240e3],[97,300e3],
]
const STAGES = [
  {at:0, l:'Buscando en Google Maps…'},
  {at:8, l:'Leyendo reseñas y fotos…'},
  {at:18,l:'Claude analizando el negocio…'},
  {at:32,l:'Diseñando layout y colores…'},
  {at:50,l:'Escribiendo el contenido…'},
  {at:68,l:'Generando secciones…'},
  {at:80,l:'Añadiendo animaciones…'},
  {at:88,l:'Optimizando…'},
  {at:94,l:'Preparando la demo…'},
]
function lerp(e: number) {
  for (let i = 1; i < CURVE.length; i++) {
    const [p0, t0] = CURVE[i - 1], [p1, t1] = CURVE[i]
    if (e <= t1) return p0 + (p1 - p0) * ((e - t0) / (t1 - t0))
  }
  return CURVE[CURVE.length - 1][0]
}
function stageLabel(p: number) {
  let l = STAGES[0].l
  for (const s of STAGES) if (p >= s.at) l = s.l
  return l
}

type Step = 'idle' | 'generating' | 'done'

const AI_MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Sonnet 4.6 (Recomendado)' },
  { value: 'claude-opus-4-7',   label: 'Opus 4.7 (Máxima calidad)' },
  { value: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5 (Más rápido)' },
  { value: 'gpt-4o',            label: 'GPT-4o' },
  { value: 'gemini-2.0-flash',  label: 'Gemini 2.0 Flash' },
]

// ─── Features with Lucide icons ─────────────────────────────────────────────
const FEATURES = [
  { Icon: MapPin,     title: 'Datos reales de Google',   body: 'Importamos nombre, fotos, horarios, reseñas y dirección automáticamente desde Google Business.' },
  { Icon: Wand2,      title: 'Diseño único por IA',       body: 'Cada web es completamente única. La IA adapta colores, tipografía y contenido al sector del negocio.' },
  { Icon: Smartphone, title: 'Responsive de serie',       body: 'Perfecta en móvil, tablet y escritorio. Sin esfuerzo adicional, desde el primer momento.' },
  { Icon: Zap,        title: 'Lista en 60 segundos',      body: 'Sin formularios largos, sin reuniones, sin esperas. El negocio tiene su web hoy mismo.' },
  { Icon: Phone,      title: 'Contacto directo',          body: 'WhatsApp flotante, teléfono directo y formulario de contacto. Todo conectado y listo.' },
  { Icon: Search,     title: 'SEO local incluido',        body: 'Schema.org, meta tags optimizados, horarios estructurados. Posicionamiento desde el día 1.' },
]

// ─── Portfolio preview cards for the carousel ────────────────────────────────
const PORTFOLIO_CARDS = [
  { name: 'La Taberna del Puerto', type: 'Restaurante', city: 'Málaga', gradient: 'linear-gradient(135deg, #8b4513 0%, #d4691e 100%)', accent: '#fdf3e7' },
  { name: 'Clínica Dental Pérez', type: 'Clínica dental', city: 'Barcelona', gradient: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)', accent: '#f0f9ff' },
  { name: 'Peluquería Lola Style', type: 'Peluquería', city: 'Madrid', gradient: 'linear-gradient(135deg, #be185d 0%, #f472b6 100%)', accent: '#fdf2f8' },
  { name: 'Taller Mecánico López', type: 'Taller', city: 'Valencia', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #334155 100%)', accent: '#f1f5f9' },
  { name: 'Gimnasio FitZone', type: 'Gimnasio', city: 'Sevilla', gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', accent: '#f0fdf4' },
  { name: 'Hotel Rural El Encinar', type: 'Hotel', city: 'Salamanca', gradient: 'linear-gradient(135deg, #78350f 0%, #d97706 100%)', accent: '#fffbeb' },
  { name: 'Asesoría García & Hijos', type: 'Asesoría', city: 'Bilbao', gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)', accent: '#eef2ff' },
  { name: 'Cafetería El Rincón', type: 'Cafetería', city: 'Zaragoza', gradient: 'linear-gradient(135deg, #451a03 0%, #92400e 100%)', accent: '#fef3c7' },
  { name: 'Farmacia Martínez', type: 'Farmacia', city: 'Alicante', gradient: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)', accent: '#f0fdfa' },
  { name: 'Centro Veterinario Luna', type: 'Veterinario', city: 'Murcia', gradient: 'linear-gradient(135deg, #4a044e 0%, #a21caf 100%)', accent: '#fdf4ff' },
]

// ─── Premium features included in every site ────────────────────────────────
const PREMIUM_FEATURES = [
  {
    Icon: MessageCircle,
    title: 'WhatsApp en 3 puntos de contacto',
    body: 'Botón flotante siempre visible, barra fija en móvil y formulario que envía directamente al WhatsApp del negocio.',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    Icon: ClipboardList,
    title: 'Formulario inteligente por sector',
    body: 'Un taller pide presupuesto con datos del vehículo. Una clínica pide cita con especialidad. Una academia solicita información por curso.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    Icon: CalendarCheck,
    title: 'Reservas online integradas',
    body: 'Widget de Calendly embebido directamente en la web, o botón de reserva para Booksy, Fresha o cualquier agenda online.',
    color: '#0369a1',
    bg: '#eff6ff',
  },
  {
    Icon: Clock,
    title: '«Abierto ahora» en tiempo real',
    body: 'Estado de apertura calculado al segundo desde los horarios reales de Google Business. Se actualiza solo, sin mantenimiento.',
    color: '#d97706',
    bg: '#fffbeb',
  },
  {
    Icon: Maximize2,
    title: 'Galería con lightbox',
    body: 'Las fotos reales del negocio importadas desde Google se abren a pantalla completa con un clic. Experiencia de galería profesional.',
    color: '#be185d',
    bg: '#fdf2f8',
  },
  {
    Icon: Star,
    title: 'Reseñas y fotos reales de Google',
    body: 'Importamos automáticamente fotos, valoración media y reseñas destacadas del perfil de Google Business. Sin subir nada manualmente.',
    color: '#ea580c',
    bg: '#fff7ed',
  },
]

// ─── Standard sections included in every site ────────────────────────────────
const SITE_SECTIONS = [
  { Icon: Users2,          title: 'Quiénes Somos',  body: 'Tu historia y compromiso' },
  { Icon: FileText,        title: 'Servicios',       body: 'Lo que ofreces' },
  { Icon: MapPin,          title: 'Dónde Estamos',   body: 'Ubicación y mapa' },
  { Icon: Clock,           title: 'Horarios',        body: 'Tu horario de atención' },
  { Icon: Images,          title: 'Galería',         body: 'Fotos de tu negocio' },
  { Icon: Phone,           title: 'Contacto',        body: 'Formulario y datos' },
  { Icon: Share2,          title: 'Redes Sociales',  body: 'Conecta con clientes' },
  { Icon: UtensilsCrossed, title: 'Carta (rest.)',   body: 'Menú y precios' },
]

const FAQ_ITEMS = [
  { q: '¿Necesito saber diseño o programación?', a: 'No. Solo necesitas pegar la URL de Google Business. Nosotros hacemos todo lo demás en menos de 60 segundos.' },
  { q: '¿Qué pasa si no tengo perfil de Google Business?', a: 'Puedes describir tu negocio en el campo de contexto adicional y la IA generará la web igualmente con la información que le proporciones.' },
  { q: '¿Cuánto cuesta renovar la web cada año?', a: 'El primer año son 99€ todo incluido (creación de la web + hosting + SSL + subdominio). A partir del segundo año la renovación anual es de solo 49€ para mantener la web activa.' },
  { q: '¿La web es realmente profesional?', a: 'Sí. Cada web es única, con diseño personalizado al sector, colores, tipografía, fotos reales y contenido adaptado. Comparable a webs de 1.000-3.000€.' },
  { q: '¿Puedo actualizar la web después?', a: 'Sí. Con el plan Básico tienes actualizaciones ilimitadas. Solo escríbenos y en minutos la actualizamos.' },
  { q: '¿Incluye hosting y dominio?', a: 'Sí. Incluye subdominio en yaweb.ai (negocio.yaweb.ai), hosting y SSL sin coste adicional. El plan Premium incluirá dominio propio (.com, .es…).' },
]

export default function HomePage() {
  const [step, setStep]           = useState<Step>('idle')
  const [url, setUrl]             = useState('')
  const [ctx, setCtx]             = useState('')
  const [error, setError]         = useState('')
  const [demoUrl, setDemoUrl]     = useState('')
  const [altDemoUrl, setAltDemoUrl] = useState('')
  const [progress, setProgress]   = useState(0)
  const [email, setEmail]         = useState('')
  const [whatsapp, setWhatsapp]   = useState('')
  const [siteTheme, setSiteTheme] = useState<'light' | 'dark'>('light')
  const [aiModel, setAiModel]     = useState('claude-sonnet-4-6')
  const [variants, setVariants]   = useState(false)
  const [menuText, setMenuText]   = useState('')
  const [stylePreset, setStylePreset] = useState<'modern' | 'classic'>('modern')
  const [tone, setTone]           = useState<'friendly' | 'formal'>('friendly')
  const [density, setDensity]     = useState<'full' | 'minimal'>('full')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [openFaq, setOpenFaq]     = useState<number | null>(null)

  const [auditState, setAuditState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [auditData, setAuditData]   = useState<AuditResult | null>(null)
  const [auditError, setAuditError] = useState('')
  const [auditEmail, setAuditEmail] = useState('')
  const [auditEmailSent, setAuditEmailSent] = useState(false)
  const auditTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const carouselRef = useRef<HTMLDivElement>(null)

  const t0  = useRef(0)
  const raf = useRef(0)

  const tick = useCallback(() => {
    const p = lerp(Date.now() - t0.current)
    setProgress(p)
    if (p < 97) raf.current = requestAnimationFrame(tick)
  }, [])

  const poll = useCallback((jobId: string) => {
    const run = async () => {
      try {
        const r = await fetch(`/api/generate/${jobId}`)
        if (r.status === 404) {
          cancelAnimationFrame(raf.current)
          localStorage.removeItem('yaweb_pub')
          setError('La generación fue interrumpida. Por favor inicia de nuevo.')
          setStep('idle')
          return
        }
        const j = await r.json()
        if (j.status === 'done') {
          cancelAnimationFrame(raf.current)
          localStorage.removeItem('yaweb_pub')
          setProgress(100)
          setDemoUrl(j.demoUrl)
          if (j.altDemoUrl) setAltDemoUrl(j.altDemoUrl)
          const saved = localStorage.getItem('yaweb_pub_email')
          if (saved) {
            try {
              await fetch('/api/send-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: saved, demoUrl: j.demoUrl, businessName: j.businessName }),
              })
            } catch { /* non-critical */ }
          }
          setTimeout(() => setStep('done'), 300)
        } else if (j.status === 'error') {
          cancelAnimationFrame(raf.current)
          localStorage.removeItem('yaweb_pub')
          setError(typeof j.error === 'string' ? j.error : j.error ? JSON.stringify(j.error) : 'Error generando la web')
          setStep('idle')
        } else {
          setTimeout(run, 3000)
        }
      } catch {
        setTimeout(run, 5000)
      }
    }
    run()
  }, [tick])

  useEffect(() => {
    const s = localStorage.getItem('yaweb_pub')
    if (!s) return
    try {
      const { jobId, startedAt } = JSON.parse(s)
      if (Date.now() - startedAt > 600_000) { localStorage.removeItem('yaweb_pub'); return }
      setStep('generating')
      t0.current = startedAt
      raf.current = requestAnimationFrame(tick)
      poll(jobId)
    } catch { localStorage.removeItem('yaweb_pub') }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (auditTimer.current) clearTimeout(auditTimer.current)
    if (!url.trim() || !url.startsWith('http')) {
      setAuditState('idle')
      setAuditData(null)
      setAuditError('')
      return
    }
    setAuditState('loading')
    auditTimer.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ google_url: url }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al analizar')
        setAuditData(data as AuditResult)
        setAuditState('done')
      } catch (err) {
        setAuditError(String(err).replace('Error: ', ''))
        setAuditState('error')
      }
    }, 900)
    return () => { if (auditTimer.current) clearTimeout(auditTimer.current) }
  }, [url]) // eslint-disable-line

  async function sendAuditEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!auditEmail.trim() || !auditData) return
    try {
      await fetch('/api/audit/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: auditEmail, auditData }),
      })
      setAuditEmailSent(true)
    } catch { /* non-critical */ }
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim() && !ctx.trim()) {
      setError('Pega una URL de Google Business o describe el negocio')
      return
    }
    setError('')
    setProgress(0)
    setStep('generating')
    t0.current = Date.now()
    raf.current = requestAnimationFrame(tick)
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          google_url:    url || undefined,
          extra_context: ctx.trim() || undefined,
          menu_text:     menuText.trim() || undefined,
          style_preset:  stylePreset,
          tone:          tone,
          density:       density,
          site_theme:    siteTheme,
          whatsapp:      whatsapp.trim() || undefined,
          email:         email.trim() || undefined,
          contact_email: email.trim() || undefined,
          model:         aiModel,
          variants:      variants,
          channel:       'landing',
        }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Error')
      localStorage.setItem('yaweb_pub', JSON.stringify({ jobId: d.job_id, startedAt: t0.current }))
      if (email.trim()) localStorage.setItem('yaweb_pub_email', email.trim())
      poll(d.job_id)
    } catch (err) {
      cancelAnimationFrame(raf.current)
      setError(String(err))
      setStep('idle')
    }
  }

  const pct  = Math.round(progress)
  const busy = step === 'generating'
  const done = step === 'done'

  function scrollCarousel(dir: 'left' | 'right') {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir === 'right' ? 340 : -340, behavior: 'smooth' })
  }

  return (
    <>
      {/* ── Global styles ──────────────────────────────────────────────────── */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        body {
          font-family: var(--font-dm-sans), 'DM Sans', system-ui, sans-serif;
          background: #ffffff;
          color: #111111;
        }
        .title  { font-family: var(--font-bricolage), 'Bricolage Grotesque', system-ui, sans-serif; }
        .decor  { font-family: var(--font-inconsolata), 'Inconsolata', monospace; }

        /* ─── Nav links — rukia underline animation ─── */
        .nav-link {
          position: relative; font-size: 15px; font-weight: 500; color: #1f2937;
          transition: color 0.2s;
        }
        .nav-link::before {
          content: ''; position: absolute; left: 0; bottom: -2px;
          height: 2px; width: 0; background: #1f2937;
          transition: width 0.3s ease;
        }
        .nav-link:hover::before { width: 100%; }

        /* ─── Buttons ─── */
        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          font-size: 15px; font-weight: 500; padding: 9px 20px;
          border-radius: 8px; border: 2px solid #111; background: transparent; color: #111;
          cursor: pointer; transition: background 0.18s, color 0.18s; white-space: nowrap;
        }
        .btn-outline:hover { background: #111; color: #fff; }

        .btn-cta {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          font-size: 15px; font-weight: 600; padding: 9px 20px;
          border-radius: 8px; border: 2px solid #2563EB; background: #2563EB; color: #fff;
          cursor: pointer; transition: background 0.18s, color 0.18s, border-color 0.18s; white-space: nowrap;
        }
        .btn-cta:hover { background: #fff; color: #2563EB; }
        .btn-cta:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ─── Form inputs ─── */
        .form-input {
          width: 100%; padding: 10px 14px;
          border: 1.5px solid #D1D5DB; background: #fff;
          font-size: 14px; color: #111; border-radius: 8px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .form-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .form-input:disabled { opacity: 0.5; cursor: not-allowed; background: #F9FAFB; }

        /* ─── Toggle opts ─── */
        .opt-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 7px 13px; font-size: 13px; font-weight: 600;
          border: 1.5px solid #D1D5DB; border-radius: 7px;
          background: #fff; color: #6B7280; cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .opt-btn.active { border-color: #2563EB; background: #EFF6FF; color: #2563EB; }
        .opt-btn:hover:not(.active) { border-color: #9CA3AF; color: #374151; }

        /* ─── Feature cards ─── */
        .feat-card {
          display: flex; flex-direction: column; gap: 14px;
          padding: 24px; border-radius: 14px;
          background: #f8f6f4;
          box-shadow: 0 1px 4px rgba(0,0,0,0.05);
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .feat-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.09); transform: translateY(-2px); }

        /* ─── Price card ─── */
        .price-card {
          background: #fff; border: 1.5px solid #E5E7EB;
          border-radius: 16px; padding: 36px 32px;
        }
        .price-card.featured { border-color: #2563EB; border-width: 2px; }

        /* ─── Portfolio carousel card ─── */
        .portfolio-card {
          flex-shrink: 0; width: 280px; border-radius: 16px;
          overflow: hidden; border: 1px solid #E5E7EB;
          background: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: box-shadow 0.2s, transform 0.2s;
          scroll-snap-align: start;
          cursor: pointer;
        }
        .portfolio-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.12); transform: translateY(-3px); }

        /* ─── Carousel container ─── */
        .carousel-track {
          display: flex; gap: 18px; overflow-x: auto; padding: 8px 4px 16px;
          scroll-snap-type: x mandatory; scroll-behavior: smooth;
          -ms-overflow-style: none; scrollbar-width: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }

        /* ─── Spin ─── */
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { display: inline-block; border-radius: 50%; animation: spin 0.65s linear infinite; }

        /* ─── Mobile ─── */
        @media (max-width: 767px) {
          .feat-grid     { grid-template-columns: 1fr 1fr !important; }
          .sections-grid { grid-template-columns: 1fr 1fr !important; }
          .pills-grid    { grid-template-columns: 1fr 1fr !important; }
          .showcase-grid { grid-template-columns: 1fr !important; }
          .showcase-grid .browser-frame { order: -1; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .steps-grid > div { border-right: none !important; border-bottom: 1px solid #E5E7EB; }
          .steps-grid > div:last-child { border-bottom: none; }
          .price-grid { grid-template-columns: 1fr !important; }
          .footer-cols { grid-template-columns: 1fr 1fr !important; }
          .footer-main { grid-template-columns: 1fr !important; }
          .nav-links { display: none !important; }
          .portfolio-card { width: 240px; }
        }
        @media (max-width: 480px) {
          .feat-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 700px) {
          .comparison-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .comparison-scroll > div { min-width: 580px; }
        }
      `}</style>

      {/* ══════════════════════════════════════════════════════════════════════
          1. NAV
      ══════════════════════════════════════════════════════════════════════ */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99,
        background: '#fff', borderBottom: '1px solid #F3F4F6',
        display: 'grid', gridTemplateColumns: '20% 1fr 20%',
        alignItems: 'center', padding: '10px 48px',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 32, height: 32, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, letterSpacing: '-0.04em' }}>ya</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.04em', color: '#111' }}>
            yaweb<span style={{ color: '#2563EB' }}>.ai</span>
          </span>
        </a>

        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          <a href="#como-funciona" className="nav-link">Cómo funciona</a>
          <a href="#ejemplos" className="nav-link">Ejemplos</a>
          <a href="#precios" className="nav-link">Precios</a>
          <Link href="/portfolio" className="nav-link">Portfolio</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={() => document.getElementById('generar')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-outline" style={{ fontSize: 14, padding: '8px 16px' }}>
            Demo gratis
          </button>
          <Link href="/admin" className="btn-cta" style={{ fontSize: 14, padding: '8px 16px' }}>
            Admin →
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          2. HERO + FORM VISIBLE ABOVE FOLD
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="generar" style={{ background: '#fff', paddingTop: 112, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20, paddingTop: 16 }}>
            <span className="decor" style={{ background: '#e6f1ed', color: '#2d6a4f', padding: '4px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
              webs para negocios locales con IA · <strong>Demo gratis</strong>
            </span>
          </div>

          {/* H1 */}
          <h1 className="title" style={{
            fontSize: 'clamp(2.1rem, 4.5vw, 3.2rem)',
            fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.08,
            color: '#111', marginBottom: 18, textAlign: 'center',
          }}>
            Tu negocio local merece<br />una web profesional
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.15rem)',
            fontWeight: 300, color: '#4B5563', lineHeight: 1.65,
            maxWidth: 500, margin: '0 auto 28px', textAlign: 'center',
          }}>
            Pega la URL de Google Business y en 60 segundos
            tienes una web profesional lista para compartir. <strong style={{ color: '#111' }}>Gratis, sin registro.</strong>
          </p>

          {/* ─── FORM CARD — always visible ─── */}
          <form onSubmit={generate} style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16,
            padding: '24px 24px', boxShadow: '0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.03)',
          }}>
            {/* URL label + 3-step hint */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', letterSpacing: '-0.01em' }}>
                URL de tu ficha de Google Business
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: '#6B7280', fontWeight: 500 }}>
                {['Google Maps', 'Compartir', 'Copiar enlace'].map((step, i) => (
                  <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {i > 0 && <span style={{ color: '#9CA3AF', fontSize: 12, userSelect: 'none', lineHeight: 1 }}>→</span>}
                    <span style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 5, padding: '2px 8px', lineHeight: 1.6 }}>{step}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* URL input — the hero CTA */}
            <div style={{ display: 'flex', gap: 10, marginBottom: auditState !== 'idle' ? 14 : 0 }}>
              <input
                type="url" className="form-input" value={url} onChange={e => setUrl(e.target.value)}
                disabled={busy || done} placeholder="https://maps.app.goo.gl/... ó describe el negocio"
                style={{ flex: 1, fontSize: 15, padding: '12px 16px' }}
              />
              {!busy && !done && (
                <button type="submit" className="btn-cta" style={{ fontSize: 15, padding: '12px 20px', flexShrink: 0, borderRadius: 10 }}>
                  <ArrowRight size={17} />
                  Generar gratis
                </button>
              )}
            </div>

            {/* GBP Audit card */}
            {auditState === 'loading' && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#F8FAFF', border: '1px solid #E5E7EB', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="spin" style={{ width: 13, height: 13, border: '2px solid #D1D5DB', borderTopColor: '#2563EB', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Analizando tu perfil de Google…</span>
              </div>
            )}
            {auditState === 'error' && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 8, fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                ⚠️ {auditError}
              </div>
            )}
            {auditState === 'done' && auditData && (() => {
              const sc = auditData.score
              const col = sc >= 75 ? '#16a34a' : sc >= 50 ? '#d97706' : '#dc2626'
              const lbl = sc >= 75 ? 'Perfil optimizado' : sc >= 50 ? 'Margen de mejora' : 'Perfil incompleto'
              const si = (s: 'pass' | 'warning' | 'fail') => s === 'pass' ? '✅' : s === 'warning' ? '⚠️' : '❌'
              return (
                <div style={{ marginTop: 14, border: '1px solid #E5E7EB', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFF', borderBottom: '1px solid #E5E7EB' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>🔍 {auditData.businessName}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Análisis Google Business Profile</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: col, lineHeight: 1 }}>{sc}</div>
                      <div style={{ fontSize: 9, color: '#9CA3AF', fontWeight: 600 }}>/100</div>
                    </div>
                  </div>
                  <div style={{ height: 4, background: '#F1F5F9' }}>
                    <div style={{ height: '100%', width: `${sc}%`, background: col, transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ padding: '6px 14px', borderBottom: '1px solid #F9FAFB' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: col, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{lbl}</span>
                  </div>
                  <div>
                    {auditData.checks.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 14px', borderBottom: '1px solid #F9FAFB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11 }}>{si(c.status)}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{c.label}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF', maxWidth: 200, textAlign: 'right' }}>{c.detail}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px 8px', borderTop: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>💡 Recomendaciones</div>
                    {auditData.recommendations.map((r, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 15, height: 15, minWidth: 15, borderRadius: '50%', background: '#2563EB', color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>{i + 1}</div>
                        <p style={{ margin: 0, fontSize: 12, color: '#4B5563', lineHeight: 1.5 }}>{r}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 14px', borderTop: '1px solid #E5E7EB', background: '#EFF6FF', borderRadius: '0 0 12px 12px' }}>
                    {auditEmailSent ? (
                      <p style={{ margin: 0, fontSize: 12, color: '#16a34a', fontWeight: 700 }}>✅ Informe enviado a {auditEmail}</p>
                    ) : (
                      <form onSubmit={sendAuditEmail} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="email" value={auditEmail} onChange={e => setAuditEmail(e.target.value)} placeholder="tu@email.com"
                          style={{ flex: 1, padding: '7px 10px', border: '1px solid #BFDBFE', borderRadius: 7, background: '#fff', fontSize: 12, outline: 'none' }} />
                        <button type="submit" style={{ padding: '7px 12px', background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          📧 Enviarme el informe
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Optional fields — shown below URL */}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input type="tel" className="form-input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
                disabled={busy || done} placeholder="WhatsApp (opcional)" />
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)}
                disabled={busy || done} placeholder="Email de contacto (opcional)" />
            </div>

            <div style={{ marginTop: 10 }}>
              <textarea className="form-input" value={ctx} onChange={e => setCtx(e.target.value.slice(0, 2000))}
                disabled={busy || done} rows={2} placeholder="Contexto adicional — describe el negocio si no tienes URL de Google…"
                style={{ resize: 'vertical', lineHeight: 1.5, fontSize: 13 }} />
            </div>

            {/* Advanced toggle */}
            <div style={{ marginTop: 10 }}>
              <button type="button" onClick={() => setShowAdvanced(v => !v)} disabled={busy || done}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span style={{ display: 'inline-block', transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: 10 }}>▶</span>
                {showAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas — modelo, tema, estilo, variantes'}
              </button>
            </div>

            {showAdvanced && (
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14, marginTop: 12 }}>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Carta / Menú (restaurantes)</label>
                  <textarea className="form-input" value={menuText} onChange={e => setMenuText(e.target.value.slice(0, 3000))}
                    disabled={busy || done} rows={3}
                    placeholder={"Entrantes\n— Pan con tomate 3€\n\nPrincipales\n— Paella 14€"}
                    style={{ resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: 12 }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Modelo de IA</label>
                  <select className="form-input" value={aiModel} onChange={e => setAiModel(e.target.value)} disabled={busy || done} style={{ cursor: 'pointer', fontSize: 13 }}>
                    {AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tema</label>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button type="button" className={`opt-btn${siteTheme === 'light' ? ' active' : ''}`} onClick={() => setSiteTheme('light')} disabled={busy || done}>☀️ Claro</button>
                      <button type="button" className={`opt-btn${siteTheme === 'dark' ? ' active' : ''}`} onClick={() => setSiteTheme('dark')} disabled={busy || done}>🌙 Oscuro</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estilo</label>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button type="button" className={`opt-btn${stylePreset === 'modern' ? ' active' : ''}`} onClick={() => setStylePreset('modern')} disabled={busy || done}>⚡ Moderno</button>
                      <button type="button" className={`opt-btn${stylePreset === 'classic' ? ' active' : ''}`} onClick={() => setStylePreset('classic')} disabled={busy || done}>✦ Clásico</button>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tono</label>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button type="button" className={`opt-btn${tone === 'friendly' ? ' active' : ''}`} onClick={() => setTone('friendly')} disabled={busy || done}>😊 Cercano</button>
                      <button type="button" className={`opt-btn${tone === 'formal' ? ' active' : ''}`} onClick={() => setTone('formal')} disabled={busy || done}>🎩 Formal</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Densidad</label>
                    <div style={{ display: 'flex', gap: 7 }}>
                      <button type="button" className={`opt-btn${density === 'full' ? ' active' : ''}`} onClick={() => setDensity('full')} disabled={busy || done}>📄 Completo</button>
                      <button type="button" className={`opt-btn${density === 'minimal' ? ' active' : ''}`} onClick={() => setDensity('minimal')} disabled={busy || done}>◻ Mínimo</button>
                    </div>
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151', opacity: busy || done ? 0.5 : 1 }}>
                  <input type="checkbox" checked={variants} onChange={e => setVariants(e.target.checked)} disabled={busy || done}
                    style={{ width: 14, height: 14, accentColor: '#2563EB' }} />
                  Generar 2 variantes de diseño (A/B)
                </label>
              </div>
            )}

            {/* Progress */}
            {busy && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>{stageLabel(progress)}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: '#E5E7EB', borderRadius: 9999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#2563EB', width: `${progress}%`, transition: 'width 0.3s ease', borderRadius: 9999 }} />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, color: '#DC2626', fontSize: 13, fontWeight: 600 }}>
                {error}
              </div>
            )}

            {/* Done */}
            {done && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, marginBottom: 10 }}>
                  <Check size={16} color="#15803D" />
                  <span style={{ fontWeight: 800, color: '#15803D', fontSize: 14 }}>¡Web generada con éxito!</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {demoUrl && (
                    <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="btn-cta" style={{ fontSize: 15, padding: '13px' }}>
                      Ver demo {variants ? '— Variante A' : ''} →
                    </a>
                  )}
                  {variants && altDemoUrl && (
                    <a href={altDemoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline" style={{ fontSize: 14, padding: '12px' }}>
                      Ver demo — Variante B →
                    </a>
                  )}
                </div>
              </div>
            )}

            {!done && !busy && (
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="btn-cta" style={{ width: '100%', fontSize: 15, padding: '14px' }}>
                  {auditData ? 'Generar la web que soluciona todo esto →' : 'Generar mi web gratis →'}
                </button>
                <p style={{ margin: '8px 0 0', textAlign: 'center', fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>
                  Gratis · Sin registro · Sin tarjeta · Lista en ~3 min
                </p>
              </div>
            )}

            {busy && (
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn-cta" disabled style={{ width: '100%', fontSize: 15, padding: '14px' }}>
                  <span className="spin" style={{ width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff' }} />
                  Generando tu web…
                </button>
              </div>
            )}
          </form>

          {/* Social proof */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            {[
              { label: 'Sin tarjeta de crédito', green: false },
              { label: 'Lista en 60 segundos', green: false },
              { label: '99€ el 1er año', green: true },
              { label: '49€/año a partir del 2º', green: true },
            ].map(({ label, green }) => (
              <span key={label} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 600,
                color: green ? '#15803D' : '#6B7280',
                background: green ? '#F0FDF4' : '#F9FAFB',
                border: `1px solid ${green ? '#BBF7D0' : '#E5E7EB'}`,
                padding: '4px 10px', borderRadius: 9999,
              }}>
                <Check size={11} color={green ? '#16a34a' : '#9CA3AF'} strokeWidth={2.5} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          3. AI MODELS STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '18px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            impulsado por los mejores modelos de IA
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
            {[
              { name: 'Claude Opus', sub: 'Anthropic', color: '#7C3AED' },
              { name: 'Claude Sonnet', sub: 'Anthropic', color: '#7C3AED' },
              { name: 'Claude Haiku', sub: 'Anthropic', color: '#7C3AED' },
              { name: 'GPT-4o', sub: 'OpenAI', color: '#10A37F' },
              { name: 'Gemini', sub: 'Google', color: '#4285F4' },
            ].map(m => (
              <div key={m.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{m.name}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{m.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. HOW IT WORKS   id="como-funciona"
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="como-funciona" style={{ background: '#f8f6f4', padding: '88px 24px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h3 style={{ fontWeight: 600, fontSize: 13, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Solución todo en uno</h3>
            <h2 className="title" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, marginBottom: 12 }}>
              yaweb entiende tu negocio
            </h2>
            <p style={{ fontSize: 17, fontWeight: 300, color: '#6B7280', maxWidth: 420, margin: '0 auto' }}>
              En 60 segundos, sin diseñadores ni código.
            </p>
          </div>

          {/* 3-step grid */}
          <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', background: '#fff', marginBottom: 44, boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
            {[
              { num: '01', title: 'Pega la URL', body: 'Copia el enlace de Google Business. Es lo único que necesitas para empezar.' },
              { num: '02', title: 'La IA trabaja', body: 'Claude analiza el negocio, importa fotos reales y diseña la web completa.' },
              { num: '03', title: 'Tienes tu web', body: 'Responsive, con SEO y contacto directo. Lista para compartir ahora mismo.' },
            ].map(({ num, title, body }, i) => (
              <div key={num} style={{ padding: '36px 28px', borderRight: i < 2 ? '1px solid #E5E7EB' : 'none' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#2563EB', letterSpacing: '0.16em', marginBottom: 12, textTransform: 'uppercase' }}>{num}</div>
                <h3 className="title" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#111', marginBottom: 9 }}>{title}</h3>
                <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.65, fontWeight: 400 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Feature cards — Lucide icons + beige bg */}
          <div className="feat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {FEATURES.map(({ Icon, title, body }) => (
              <div key={title} className="feat-card">
                <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E5E7EB' }}>
                  <Icon size={18} color="#2563EB" strokeWidth={1.75} />
                </div>
                <h3 className="title" style={{ fontSize: 16, fontWeight: 700, color: '#111', lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13, fontWeight: 400, color: '#4B5563', lineHeight: 1.65 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          4b. SHOWCASE — alternating text + browser mockup
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '88px 24px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>

          {/* Row 1: text left, browser right */}
          <div className="showcase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', marginBottom: 80 }}>
            <div>
              <span className="decor" style={{ background: '#e6f1ed', color: '#2d6a4f', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 20 }}>
                Datos reales de Google
              </span>
              <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, marginBottom: 16 }}>
                La IA lee tu ficha de Google<br />y construye la web
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                Sin formularios. Solo pega el enlace y Claude importa todo automáticamente — como si hubiera visitado el negocio.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Nombre, categoría y descripción', 'Extraídos en tiempo real'],
                  ['Fotos reales del lugar', 'Las mejores imágenes seleccionadas por IA'],
                  ['Horarios y dirección exacta', 'Incluido Google Maps embed'],
                  ['Reseñas y puntuación media', 'Mostradas con schema.org para SEO'],
                  ['Servicios y atributos del negocio', 'Adaptados al sector automáticamente'],
                ].map(([title, sub]) => (
                  <li key={title} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 18, height: 18, minWidth: 18, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <Check size={10} color="#2563EB" strokeWidth={3} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Browser mockup — La Taberna del Puerto */}
            <div className="browser-frame" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 24px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)' }}>
              {/* Chrome bar */}
              <div style={{ background: '#F3F4F6', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#FC5C65','#FFD43B','#51CF66'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#9CA3AF', border: '1px solid #E5E7EB', fontFamily: 'monospace' }}>
                  taberna-del-puerto.yaweb.ai
                </div>
              </div>
              {/* Site nav */}
              <div style={{ background: '#7a3b10', padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>La Taberna del Puerto</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  {['Carta', 'Galería', 'Contacto'].map(l => <span key={l} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 500 }}>{l}</span>)}
                </div>
              </div>
              {/* Hero */}
              <div style={{ background: 'linear-gradient(150deg, #7a3b10 0%, #c4571a 60%, #e07b3a 100%)', padding: '28px 20px 24px' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Restaurante · Málaga · ★ 4.8</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1.25, marginBottom: 14, letterSpacing: '-0.03em' }}>Cocina marinera<br />de toda la vida</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: '#fff', color: '#7a3b10', fontSize: 11, fontWeight: 700, padding: '7px 16px', borderRadius: 6 }}>Ver carta</div>
                  <div style={{ border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 6 }}>Reservar mesa</div>
                </div>
              </div>
              {/* Photo grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 3, padding: 3, background: '#F9FAFB' }}>
                <div style={{ height: 68, background: 'linear-gradient(135deg, #a0522d, #cd853f)', borderRadius: 4 }} />
                <div style={{ height: 68, background: 'linear-gradient(135deg, #8b4513, #b8601a)', borderRadius: 4 }} />
                <div style={{ height: 68, background: 'linear-gradient(135deg, #c47a3d, #daa06d)', borderRadius: 4 }} />
              </div>
              {/* Services */}
              <div style={{ padding: '14px 18px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#111', marginBottom: 8, letterSpacing: '-0.01em' }}>Nuestros servicios</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {['🦞 Mariscos frescos','☀️ Terraza exterior','🍽️ Menú del día 14€','🎉 Eventos privados'].map(s => (
                    <div key={s} style={{ fontSize: 10, color: '#374151', padding: '6px 9px', background: '#F9FAFB', borderRadius: 5, fontWeight: 500 }}>{s}</div>
                  ))}
                </div>
              </div>
              {/* Reviews strip */}
              <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #F3F4F6', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#F59E0B', letterSpacing: '-1px' }}>★★★★★</span>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>4.8 · 342 reseñas en Google</span>
                <div style={{ marginLeft: 'auto', background: '#25D366', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 9999 }}>WhatsApp</div>
              </div>
            </div>
          </div>

          {/* Row 2: browser left, text right */}
          <div className="showcase-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            {/* Browser mockup — Clínica Dental */}
            <div className="browser-frame" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 24px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ background: '#F3F4F6', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#FC5C65','#FFD43B','#51CF66'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, background: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, color: '#9CA3AF', border: '1px solid #E5E7EB', fontFamily: 'monospace' }}>
                  clinica-dental-perez.yaweb.ai
                </div>
              </div>
              <div style={{ background: '#0c4a7a', padding: '11px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: '-0.02em' }}>Clínica Dental Pérez</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  {['Servicios','Equipo','Contacto'].map(l => <span key={l} style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 500 }}>{l}</span>)}
                </div>
              </div>
              <div style={{ background: 'linear-gradient(150deg, #0c4a7a 0%, #1565a8 60%, #2196c4 100%)', padding: '28px 20px 24px' }}>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Clínica dental · Barcelona · ★ 4.9</div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, lineHeight: 1.25, marginBottom: 14, letterSpacing: '-0.03em' }}>Tu sonrisa,<br />nuestra prioridad</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: '#fff', color: '#0c4a7a', fontSize: 11, fontWeight: 700, padding: '7px 16px', borderRadius: 6 }}>Pedir cita</div>
                  <div style={{ border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 6 }}>Ver servicios</div>
                </div>
              </div>
              <div style={{ padding: '14px 18px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#111', marginBottom: 8 }}>Tratamientos</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {['🦷 Ortodoncia','✨ Blanqueamiento','🔬 Implantes','👶 Odontopediatría'].map(s => (
                    <div key={s} style={{ fontSize: 10, color: '#374151', padding: '6px 9px', background: '#F0F9FF', borderRadius: 5, fontWeight: 500 }}>{s}</div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 18px 14px', borderTop: '1px solid #F3F4F6', background: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#F59E0B', letterSpacing: '-1px' }}>★★★★★</span>
                <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 500 }}>4.9 · 218 reseñas en Google</span>
                <div style={{ marginLeft: 'auto', background: '#2563EB', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 9px', borderRadius: 9999 }}>Pedir cita</div>
              </div>
            </div>

            <div>
              <span className="decor" style={{ background: '#e6f1ed', color: '#2d6a4f', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 20 }}>
                Diseño único por IA
              </span>
              <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, marginBottom: 16 }}>
                Cada web es única.<br />Nunca dos iguales.
              </h2>
              <p style={{ fontSize: 16, fontWeight: 300, color: '#6B7280', lineHeight: 1.7, marginBottom: 28 }}>
                Claude adapta colores, tipografía, tono y estructura al sector y personalidad de cada negocio. Un restaurante y una clínica nunca tienen el mismo diseño.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Paleta de colores por sector', 'Cálida para restaurantes, clínica para médicos…'],
                  ['Tipografía adaptada al tono', 'Formal, cercana, premium, juvenil'],
                  ['Copy redactado por IA', 'En el idioma y voz del negocio'],
                  ['Estructura optimizada', 'Las secciones más relevantes para el sector'],
                ].map(([title, sub]) => (
                  <li key={title} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 18, height: 18, minWidth: 18, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                      <Check size={10} color="#2563EB" strokeWidth={3} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{title}</div>
                      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          5. SECTIONS INCLUDED IN EVERY SITE
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '88px 24px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 9999, padding: '5px 14px', marginBottom: 18 }}>
              <Star size={12} color="#2563EB" strokeWidth={2.5} fill="#2563EB" />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Plan Basic</span>
            </div>
            <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, marginBottom: 14 }}>
              Funcionalidades Premium<br />en tu plan Basic
            </h2>
            <p style={{ fontSize: 16, fontWeight: 300, color: '#6B7280', maxWidth: 520, margin: '0 auto' }}>
              Todo esto viene activado automáticamente en cada web, sin configuración adicional.
            </p>
          </div>

          {/* Feature cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="sections-grid">
            {PREMIUM_FEATURES.map(({ Icon, title, body, color, bg }) => (
              <div key={title} style={{
                padding: '28px 24px', borderRadius: 16, background: '#fff',
                border: '1.5px solid #E5E7EB',
                transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.boxShadow = `0 4px 24px ${color}18`; el.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E5E7EB'; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 8, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: 13, fontWeight: 400, color: '#6B7280', lineHeight: 1.6, margin: 0 }}>{body}</p>
              </div>
            ))}
          </div>

          {/* Standard sections grid */}
          <div style={{ marginTop: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
              Secciones incluidas en cada web
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }} className="sections-grid">
              {SITE_SECTIONS.map(({ Icon, title, body }) => (
                <div key={title} style={{
                  padding: '20px 18px', borderRadius: 14, background: '#fff',
                  border: '1.5px solid #E5E7EB',
                  transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#2563EB'; el.style.boxShadow = '0 4px 20px rgba(37,99,235,0.08)'; el.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#E5E7EB'; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: 38, height: 38, background: '#EFF6FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon size={16} color="#2563EB" strokeWidth={1.75} />
                  </div>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 3, lineHeight: 1.3 }}>{title}</h3>
                  <p style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', lineHeight: 1.5, margin: 0 }}>{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Technical pills */}
          <div style={{ marginTop: 32, padding: '22px 28px', background: '#F8FAFF', border: '1px solid #E5E7EB', borderRadius: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14 }}>
              Y además, en cada web
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }} className="pills-grid">
              {[
                'SSL + Hosting incluido',
                'Dominio yaweb.ai',
                'Responsive garantizado',
                'SEO local optimizado',
                'Schema.org / JSON-LD',
                'Google Maps embed',
                'Cookie banner GDPR',
                'Aviso legal automático',
                'Carta y menú para restaurantes',
              ].map(feat => (
                <div key={feat} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, fontWeight: 500, color: '#374151',
                  background: '#fff', border: '1px solid #E5E7EB',
                  padding: '9px 14px', borderRadius: 10,
                }}>
                  <Check size={13} color="#16a34a" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                  {feat}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          6. PORTFOLIO CAROUSEL   id="ejemplos"
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="ejemplos" style={{ background: '#fff', padding: '88px 0', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 13, color: '#6B7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ejemplos reales</h3>
              <h2 className="title" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1 }}>
                Webs generadas por yaweb
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => scrollCarousel('left')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = '#fff' }}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={() => scrollCarousel('right')} style={{ width: 40, height: 40, borderRadius: '50%', border: '1.5px solid #E5E7EB', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#111'; (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = '#fff' }}>
                <ChevronRight size={18} />
              </button>
              <Link href="/portfolio" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 500, color: '#374151', borderBottom: '2px solid #D1D5DB', paddingBottom: 2, paddingRight: 2, transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#111'; (e.currentTarget as HTMLElement).style.color = '#111' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderBottomColor = '#D1D5DB'; (e.currentTarget as HTMLElement).style.color = '#374151' }}>
                Ver todos los ejemplos <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Carousel */}
          <div ref={carouselRef} className="carousel-track">
            {PORTFOLIO_CARDS.map((card, i) => (
              <Link key={i} href="/portfolio" className="portfolio-card" style={{ textDecoration: 'none', color: 'inherit' }}>
                {/* Fake website preview — gradient header */}
                <div style={{ height: 160, background: card.gradient, position: 'relative', overflow: 'hidden' }}>
                  {/* Fake browser chrome */}
                  <div style={{ position: 'absolute', top: 10, left: 12, right: 12, height: 22, background: 'rgba(255,255,255,0.15)', borderRadius: 5, display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)' }} />
                    <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.2)', borderRadius: 3, marginLeft: 6 }} />
                  </div>
                  {/* Fake website content skeleton */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 14px 14px' }}>
                    <div style={{ height: 18, background: 'rgba(255,255,255,0.9)', borderRadius: 3, marginBottom: 7, width: '70%' }} />
                    <div style={{ height: 11, background: 'rgba(255,255,255,0.5)', borderRadius: 2, marginBottom: 5, width: '50%' }} />
                    <div style={{ height: 26, background: 'rgba(255,255,255,0.85)', borderRadius: 5, width: 80, marginTop: 10 }} />
                  </div>
                </div>
                {/* Card info */}
                <div style={{ padding: '16px 16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <h4 style={{ fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1.3, flex: 1 }}>{card.name}</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: card.accent, color: '#374151', padding: '2px 8px', borderRadius: 4 }}>{card.type}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{card.city}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          7. COMPARATIVA HONESTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: '88px 24px', borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span className="decor" style={{ display: 'inline-block', background: '#e6f1ed', color: '#166534', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 999, marginBottom: 14 }}>
              Comparativa honesta
            </span>
            <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1, marginBottom: 16 }}>
              ¿Qué cuesta tener una web<br />profesional hoy?
            </h2>
            <p style={{ fontSize: 15, color: '#6B7280', fontWeight: 400, maxWidth: 480, margin: '0 auto' }}>
              Sin letra pequeña. Esto es lo que pagan los negocios como el tuyo.
            </p>
          </div>

          {/* Table */}
          <div className="comparison-scroll">
          <div style={{ border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 160px 200px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', padding: '12px 28px', gap: 8 }}>
              {['Opción', 'Año 1', 'Año 2+', '¿Lo hace alguien por ti?'].map((h, i) => (
                <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', textAlign: i === 0 ? 'left' : 'center' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {[
              { name: 'yaweb.ai',               y1: '99€',          y2: '49€/año',      y2win: true,  done: '✓ Listo en 60 s',   highlight: true  },
              { name: 'Wix / Squarespace',       y1: '156–192€/año', y2: '156–192€/año', y2win: false, done: '✗ Tú te lo montas', highlight: false },
              { name: 'Jimdo AI / GoDaddy AI',   y1: '144–180€/año', y2: '144–180€/año', y2win: false, done: '~ Parcialmente',    highlight: false },
              { name: 'Freelancer (web básica)', y1: '400–800€',     y2: '~100–200€',    y2win: false, done: '✓ Sí',             highlight: false },
              { name: 'Agencia pequeña',         y1: '800–2.500€',   y2: '200–600€',     y2win: false, done: '✓ Sí',             highlight: false },
            ].map((row, i, arr) => (
              <div key={row.name} style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 160px 200px',
                padding: row.highlight ? '18px 28px' : '15px 28px', gap: 8,
                background: row.highlight ? '#f0fdf4' : '#fff',
                borderBottom: i < arr.length - 1 ? '1px solid #F3F4F6' : 'none',
                borderLeft: row.highlight ? '4px solid #16a34a' : '4px solid transparent',
                alignItems: 'center',
              }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  {row.highlight && (
                    <span style={{ fontSize: 10, fontWeight: 700, background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: 4, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>Tú</span>
                  )}
                  <span style={{ fontSize: row.highlight ? 16 : 14, fontWeight: row.highlight ? 700 : 500, color: row.highlight ? '#111' : '#374151' }}>{row.name}</span>
                </div>
                {/* Año 1 */}
                <div style={{ textAlign: 'center' }}>
                  {row.highlight
                    ? <span className="title" style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1 }}>{row.y1}</span>
                    : <span style={{ fontSize: 14, fontWeight: 500, color: '#6B7280' }}>{row.y1}</span>
                  }
                </div>
                {/* Año 2+ */}
                <div style={{ textAlign: 'center' }}>
                  {row.y2win
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '5px 12px' }}>
                        <Check size={13} color="#16a34a" strokeWidth={2.5} />
                        <span className="title" style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.03em', color: '#15803d', lineHeight: 1 }}>{row.y2}</span>
                      </span>
                    : <span style={{ fontSize: 14, fontWeight: 500, color: '#6B7280' }}>{row.y2}</span>
                  }
                </div>
                {/* Done */}
                <span style={{
                  fontSize: 13, fontWeight: 600, textAlign: 'center',
                  color: row.done.startsWith('✓') ? '#16a34a' : row.done.startsWith('~') ? '#B45309' : '#DC2626',
                }}>
                  {row.done}
                </span>
              </div>
            ))}
          </div>
          </div>{/* /comparison-scroll */}

          {/* Callout below table */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#f0fdf4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '12px 16px', marginTop: 16 }}>
            <Check size={14} color="#16a34a" strokeWidth={2.5} style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#166534', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
              A partir del segundo año, yaweb.ai es <strong>más barato que cualquier herramienta DIY</strong> — y sin que el negocio tenga que hacer nada.
            </p>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
            Precios orientativos basados en tarifas públicas de cada plataforma · {new Date().getFullYear()}
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          8. PRICING   id="precios"
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="precios" style={{ background: '#f8f6f4', padding: '88px 24px', borderTop: '1px solid #ede8e3' }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h3 style={{ fontWeight: 600, fontSize: 13, color: '#6B7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Precios</h3>
            <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1 }}>
              Simple y transparente.
            </h2>
          </div>

          <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
            {/* Basic */}
            <div className="price-card featured">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563EB' }}>Básico</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 9999, border: '1px solid #BFDBFE' }}>Más popular</span>
              </div>

              {/* Precio principal */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span className="title" style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-0.05em', color: '#111', lineHeight: 1 }}>99€</span>
                <span style={{ fontSize: 15, color: '#6B7280', fontWeight: 500 }}>el primer año</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>
                Todo incluido — creación, hosting y SSL
              </p>

              {/* Renovación */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '6px 12px', marginBottom: 22 }}>
                <Check size={12} color="#16a34a" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>Luego solo <strong>49€/año</strong> para renovar</span>
              </div>

              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
                {[
                  'Web profesional generada con IA',
                  'Subdominio en yaweb.ai incluido',
                  'SSL y hosting incluidos',
                  'Actualizaciones ilimitadas',
                  'WhatsApp y formulario de contacto',
                  'Carta / Menú para restaurantes',
                  'SEO local y schema.org',
                  'Soporte en español',
                ].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: '#374151', fontWeight: 500 }}>
                    <Check size={14} color="#2563EB" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className="btn-cta" onClick={() => document.getElementById('generar')?.scrollIntoView({ behavior: 'smooth' })} style={{ width: '100%', fontSize: 14, padding: '12px' }}>Solicitar acceso →</button>
              <p style={{ textAlign: 'center', marginTop: 9, color: '#9CA3AF', fontSize: 11, fontWeight: 500 }}>Demo gratuita sin compromiso</p>
            </div>

            {/* Premium */}
            <div className="price-card" style={{ opacity: 0.7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9CA3AF' }}>Premium</span>
                <span style={{ fontSize: 10, fontWeight: 700, border: '1px solid #E5E7EB', color: '#9CA3AF', padding: '3px 10px', borderRadius: 9999 }}>Próximamente</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span className="title" style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-0.05em', color: '#CBD5E1', lineHeight: 1 }}>—</span>
              </div>
              <p style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 500, marginBottom: 22 }}>Para negocios que quieren más control</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                {['Todo lo del plan Básico', 'Dominio propio (.com, .es…)', 'Portal de cliente con login', 'Carta / Menú dinámica editable', 'Múltiples páginas', 'Analítica de visitas', 'Follow-up automático de leads'].map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 14, color: '#9CA3AF', fontWeight: 500 }}>
                    <Check size={14} color="#D1D5DB" strokeWidth={2.5} style={{ flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
              <button disabled style={{ width: '100%', fontSize: 14, padding: '12px', background: '#F3F4F6', color: '#9CA3AF', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Próximamente
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          9. FAQ — beige bg
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#f8f6f4', padding: '88px 24px', borderTop: '1px solid #ede8e3' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="title" style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#111', lineHeight: 1.1 }}>
              Preguntas frecuentes.
            </h2>
          </div>
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #D6D0C8' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '20px 0', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', gap: 16 }}>
                <span className="title" style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', fontWeight: 600, color: '#111' }}>{item.q}</span>
                <span style={{ flexShrink: 0, fontSize: 20, color: '#6B7280', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.25s' }}>↓</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 18 }}>
                  <p style={{ fontSize: 15, color: '#4B5563', lineHeight: 1.7, fontWeight: 400 }}>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          10. FINAL CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #2563EB 100%)', padding: '120px 24px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <span className="decor" style={{ display: 'inline-block', background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 14px', borderRadius: 999, marginBottom: 28, border: '1px solid rgba(255,255,255,0.18)' }}>
            Empieza hoy
          </span>
          <h2 className="title" style={{ fontSize: 'clamp(1.8rem, 3.2vw, 2.8rem)', fontWeight: 900, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1.1, marginBottom: 20 }}>
            Cambia la manera de conseguir clientes,<br />para siempre.
          </h2>
          <p style={{ fontSize: 17, fontWeight: 300, color: 'rgba(255,255,255,0.55)', marginBottom: 40, lineHeight: 1.6 }}>
            Tu negocio merece una web profesional. En 60 segundos, la tiene.
          </p>
          <button onClick={() => document.getElementById('generar')?.scrollIntoView({ behavior: 'smooth' })} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#fff', color: '#1e1b4b',
            fontSize: 16, fontWeight: 700, padding: '14px 36px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            boxShadow: '0 0 0 1px rgba(255,255,255,0.1)',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <ArrowRight size={17} />
            Generar demo gratis
          </button>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 16, fontWeight: 500 }}>
            Sin tarjeta de crédito · Lista en 60 segundos · 99€ el primer año
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          11. FOOTER — light, rukia style
      ══════════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div className="footer-main" style={{ display: 'grid', gridTemplateColumns: '38% 1fr', gap: 40, marginBottom: 40 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, background: '#2563EB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 13, letterSpacing: '-0.04em' }}>ya</span>
                </div>
                <span style={{ fontWeight: 900, fontSize: 16, letterSpacing: '-0.04em', color: '#111' }}>
                  yaweb<span style={{ color: '#2563EB' }}>.ai</span>
                </span>
              </a>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, maxWidth: 240 }}>
                Webs profesionales para negocios locales, generadas con IA en 60 segundos.
              </p>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>
                <p>yaweb.ai © 2026 · Hecho con ❤️ en España</p>
              </div>
            </div>

            <div className="footer-cols" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {[
                { heading: 'Producto', links: [{ label: 'Cómo funciona', href: '#como-funciona' }, { label: 'Ejemplos', href: '#ejemplos' }, { label: 'Precios', href: '#precios' }, { label: 'Portfolio', href: '/portfolio' }] },
                { heading: 'Empresa',  links: [{ label: 'Sobre nosotros', href: '#' }, { label: 'Blog', href: '#' }, { label: 'Contacto', href: 'mailto:hola@yaweb.ai' }] },
                { heading: 'Legal',    links: [{ label: 'Aviso Legal', href: '/aviso-legal' }, { label: 'Privacidad', href: '/privacidad' }, { label: 'RGPD', href: '#' }] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <h3 className="title" style={{ fontSize: 15, fontWeight: 900, letterSpacing: '-0.02em', color: '#111', marginBottom: 14 }}>{heading}</h3>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {links.map(({ label, href }) => (
                      <li key={label}>
                        <a href={href} style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', transition: 'color 0.15s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#111'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#6B7280'}
                        >{label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
