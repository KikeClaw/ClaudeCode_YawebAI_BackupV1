'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Wand2, ChevronUp, ChevronDown, Loader2, Paperclip, X as XIcon } from 'lucide-react'

interface Props {
  html: string
  isDemo: boolean
  businessName: string
  clientId?: string
}

const BANNER_HEIGHT = 44

const DEMO_BANNER = `<div id="yaweb-demo-banner" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#f59e0b;color:#451a03;padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;font-family:system-ui,sans-serif;font-size:13px;font-weight:500;box-shadow:0 2px 8px rgba(0,0,0,.15)">
<span>🌐 Esta es una <strong>demo gratuita</strong> para <strong>BUSINESS_NAME</strong> — ¿Te gusta?</span>
<a href="mailto:hola@yaweb.ai" style="background:#451a03;color:#fef3c7;padding:5px 14px;border-radius:20px;text-decoration:none;font-weight:700;font-size:12px;white-space:nowrap">Activar por 99€/año →</a>
</div>
<style>
/* Push body content and the site's own fixed nav below the demo banner */
body{padding-top:${BANNER_HEIGHT}px!important}
.nav,.nav-fixed,.site-nav,nav[class]{top:${BANNER_HEIGHT}px!important}
</style>`

function injectBanner(html: string, businessName: string): string {
  const banner = DEMO_BANNER.replace('BUSINESS_NAME', businessName.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `$1\n${banner}`)
  }
  return banner + html
}

// ── Admin Edit Panel ────────────────────────────────────────────────────────

interface AttachedImg { preview: string; data: string; mediaType: string }

function fileToImg(file: File): Promise<AttachedImg> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => {
      const uri = r.result as string
      const [hdr, data] = uri.split(',')
      res({ preview: uri, data, mediaType: hdr.match(/data:([^;]+)/)?.[1] ?? 'image/jpeg' })
    }
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function AdminEditPanel({
  clientId,
  onSuccess,
}: {
  clientId: string
  onSuccess: (newHtml: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [images, setImages] = useState<AttachedImg[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (expanded) setTimeout(() => inputRef.current?.focus(), 120)
  }, [expanded])

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - images.length)
    const imgs = await Promise.all(files.map(fileToImg))
    setImages(prev => [...prev, ...imgs].slice(0, 3))
    e.target.value = ''
  }

  const handleEdit = useCallback(async () => {
    if (!instruction.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          instruction,
          images: images.map(({ data, mediaType }) => ({ data, mediaType })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ ok: false, msg: data.error || 'Error desconocido' })
        return
      }
      if (data.newHtml) onSuccess(data.newHtml)
      const cost = data.costEur ? ` · ~${(data.costEur * 100).toFixed(1)}¢` : ''
      setResult({ ok: true, msg: `✓ Aplicado con ${data.model ?? 'IA'}${cost}` })
      setInstruction('')
      setImages([])
    } catch (e) {
      setResult({ ok: false, msg: String(e) })
    } finally {
      setLoading(false)
    }
  }, [clientId, instruction, images, loading, onSuccess])

  const PANEL_BG  = '#16181e'
  const PANEL_ACC = '#696cff'
  const HANDLE_H  = 42

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99998,
        background: PANEL_BG,
        color: '#e2e8f0',
        borderTop: `2px solid ${PANEL_ACC}`,
        fontFamily: 'system-ui,-apple-system,sans-serif',
        transform: expanded ? 'translateY(0)' : `translateY(calc(100% - ${HANDLE_H}px))`,
        transition: 'transform .25s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 -4px 32px rgba(0,0,0,.35)',
      }}
    >
      {/* Toggle handle */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          width: '100%',
          height: HANDLE_H,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 20px',
          background: 'none',
          border: 'none',
          color: '#e2e8f0',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'left',
        }}
      >
        <Wand2 size={14} style={{ color: PANEL_ACC, flexShrink: 0 }} />
        <span style={{ color: PANEL_ACC }}>Admin</span>
        <span style={{ opacity: 0.55 }}>— Editar con IA</span>
        {result && (
          <span style={{
            marginLeft: 'auto',
            marginRight: 8,
            fontSize: 11,
            color: result.ok ? '#4ade80' : '#f87171',
            fontWeight: 500,
          }}>
            {result.msg}
          </span>
        )}
        <span style={{ marginLeft: result ? 0 : 'auto', opacity: 0.45 }}>
          {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Edit form */}
      <div style={{ padding: '10px 20px 16px' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEdit()}
            placeholder='Ej: "Cambia el color del botón a verde" · "El menú no se ve, cámbialo a oscuro"'
            disabled={loading}
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 9,
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.13)',
              color: '#e2e8f0',
              fontSize: 13,
              outline: 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />

          {/* Attach image */}
          <label
            title={images.length >= 3 ? 'Máximo 3 imágenes' : 'Adjuntar screenshot'}
            style={{
              padding: '9px 12px',
              borderRadius: 9,
              border: `1px solid ${images.length > 0 ? PANEL_ACC : 'rgba(255,255,255,0.13)'}`,
              background: images.length > 0 ? `${PANEL_ACC}22` : 'rgba(255,255,255,0.07)',
              color: images.length > 0 ? PANEL_ACC : 'rgba(255,255,255,0.5)',
              cursor: images.length >= 3 || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              whiteSpace: 'nowrap',
              flexShrink: 0,
              opacity: loading ? 0.5 : 1,
            }}
          >
            <Paperclip size={13} />
            {images.length > 0 && <span style={{ fontWeight: 700 }}>{images.length}</span>}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handleFiles}
              disabled={images.length >= 3 || loading}
            />
          </label>

          <button
            onClick={handleEdit}
            disabled={loading || !instruction.trim()}
            style={{
              padding: '9px 18px',
              borderRadius: 9,
              border: 'none',
              background: loading || !instruction.trim() ? 'rgba(105,108,255,.4)' : PANEL_ACC,
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading || !instruction.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 110,
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {loading
              ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Editando...</>
              : <><Wand2 size={13} /> Aplicar</>}
          </button>
        </div>

        {/* Thumbnail strip */}
        {images.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            {images.map((img, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={img.preview}
                  alt=""
                  style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: `1.5px solid ${PANEL_ACC}`, display: 'block' }}
                />
                <button
                  onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#374151', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}
                >
                  <XIcon size={9} style={{ color: '#fff' }} />
                </button>
              </div>
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              La IA verá {images.length} screenshot{images.length > 1 ? 's' : ''} · {images.length}/3
            </span>
          </div>
        )}
      </div>

      {/* Inline spin keyframe */}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function HtmlSiteFrame({ html, isDemo, businessName, clientId }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [currentHtml, setCurrentHtml] = useState(html)
  const [isAdmin, setIsAdmin] = useState(false)

  // Check admin status once on mount (only when clientId is present)
  useEffect(() => {
    if (!clientId) return
    fetch('/api/me')
      .then(r => r.json())
      .then(d => { if (d?.user) setIsAdmin(true) })
      .catch(() => {})
  }, [clientId])

  const finalHtml = isDemo ? injectBanner(currentHtml, businessName) : currentHtml

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    iframe.srcdoc = finalHtml
  }, [finalHtml])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
        title={businessName}
      />
      {isAdmin && clientId && (
        <AdminEditPanel
          clientId={clientId}
          onSuccess={newHtml => setCurrentHtml(newHtml)}
        />
      )}
    </div>
  )
}
