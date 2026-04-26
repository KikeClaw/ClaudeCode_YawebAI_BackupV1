'use client'

import { useState, useEffect } from 'react'
import {
  Search, Star, MapPin, Loader2, CheckCircle2, XCircle,
  ExternalLink, Sparkles, Mail, Copy, X, ChevronDown,
  ChevronUp, SlidersHorizontal, Globe, GlobeLock, RefreshCw,
  BookmarkPlus, BookmarkCheck,
} from 'lucide-react'

const VERTICALS = ['restaurant','bar','salon','clinic','gym','lawyer','hotel','pharmacy','academy','shop','workshop']
const VERTICAL_LABELS: Record<string, string> = {
  restaurant: 'Restaurante', bar: 'Bar', salon: 'Salón', clinic: 'Clínica',
  gym: 'Gimnasio', lawyer: 'Abogado', hotel: 'Hotel', pharmacy: 'Farmacia',
  academy: 'Academia', shop: 'Tienda', workshop: 'Taller', generic: 'Negocio',
}

const PRICE_LABELS: Record<number, string> = { 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' }

interface Candidate {
  place_id:     string
  name:         string
  address:      string
  rating:       number | null
  review_count: number | null
  vertical:     string
  has_website:  boolean
  website:      string | null
  price_level:  number | null
}

interface JobInfo {
  jobId: string
  status: 'pending' | 'generating' | 'done' | 'error'
  demoUrl?: string
  error?: string
}

interface EmailModal {
  placeId:      string
  businessName: string
  demoUrl:      string
  email:        string
  loading:      boolean
}

// ── Advanced filter state ─────────────────────────────────────────────────────
interface Filters {
  noWebsite:      boolean
  excludeKnown:   boolean
  openNow:        boolean
  minRating:      string
  maxRating:      string
  minReviews:     string
  maxReviews:     string
  priceLevels:    Set<number>
  keyword:        string
  maxResults:     number
}

const DEFAULT_FILTERS: Filters = {
  noWebsite:    false,
  excludeKnown: false,
  openNow:      false,
  minRating:    '',
  maxRating:    '',
  minReviews:   '',
  maxReviews:   '',
  priceLevels:  new Set(),
  keyword:      '',
  maxResults:   20,
}

// ── Toggle pill ───────────────────────────────────────────────────────────────
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-bold border-2 transition-all select-none ${
        checked
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  )
}

// ── Price level toggle ────────────────────────────────────────────────────────
function PricePill({ level, active, onChange }: { level: number; active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3 py-1.5 rounded-md text-[12px] font-bold border-2 transition-all select-none ${
        active
          ? 'bg-amber-500 border-amber-500 text-white'
          : 'bg-white border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600'
      }`}
    >
      {PRICE_LABELS[level]}
    </button>
  )
}

export function BulkLeadSearch() {
  const [city, setCity]               = useState('')
  const [vertical, setVertical]       = useState('all')
  const [filters, setFilters]         = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [searching, setSearching]     = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [candidates, setCandidates]   = useState<Candidate[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [selected, setSelected]       = useState<Set<string>>(new Set())
  const [jobs, setJobs]               = useState<Map<string, JobInfo>>(new Map())
  const [activeJobIds, setActiveJobIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating]   = useState(false)
  const [emailModal, setEmailModal]   = useState<EmailModal | null>(null)
  const [copied, setCopied]           = useState(false)
  const [savedLeads, setSavedLeads]   = useState<Set<string>>(new Set())
  const [savingLead, setSavingLead]   = useState<string | null>(null)

  // Helper: count active filters
  const activeFilterCount = [
    filters.noWebsite,
    filters.excludeKnown,
    filters.openNow,
    !!filters.minRating,
    !!filters.maxRating,
    !!filters.minReviews,
    !!filters.maxReviews,
    filters.priceLevels.size > 0,
    !!filters.keyword,
    filters.maxResults !== 20,
  ].filter(Boolean).length

  // ── Poll active jobs every 3 s ────────────────────────────────────────────
  useEffect(() => {
    if (activeJobIds.size === 0) return
    const timer = setInterval(async () => {
      const updates = await Promise.all(
        [...activeJobIds].map(async jobId => {
          const r = await fetch(`/api/generate/${jobId}`)
          return { jobId, data: await r.json() }
        })
      )
      const finished = new Set<string>()
      setJobs(prev => {
        const next = new Map(prev)
        for (const [placeId, info] of next) {
          const u = updates.find(x => x.jobId === info.jobId)
          if (!u) continue
          if (u.data.status === 'done') {
            next.set(placeId, { ...info, status: 'done', demoUrl: u.data.demoUrl })
            finished.add(info.jobId)
          } else if (u.data.status === 'error') {
            next.set(placeId, { ...info, status: 'error', error: u.data.error })
            finished.add(info.jobId)
          } else {
            next.set(placeId, { ...info, status: 'generating' })
          }
        }
        return next
      })
      if (finished.size > 0) {
        setActiveJobIds(prev => {
          const next = new Set(prev)
          finished.forEach(id => next.delete(id))
          return next
        })
      }
    }, 3000)
    return () => clearInterval(timer)
  }, [activeJobIds])

  // ── Build search params ───────────────────────────────────────────────────
  function buildParams(pageToken?: string) {
    const p = new URLSearchParams({ city: city.trim() })
    if (vertical !== 'all') p.set('vertical', vertical)
    if (filters.noWebsite)      p.set('noWebsite', 'true')
    if (filters.excludeKnown)   p.set('excludeKnown', 'true')
    if (filters.openNow)        p.set('openNow', 'true')
    if (filters.minRating)      p.set('minRating', filters.minRating)
    if (filters.maxRating)      p.set('maxRating', filters.maxRating)
    if (filters.minReviews)     p.set('minReviews', filters.minReviews)
    if (filters.maxReviews)     p.set('maxReviews', filters.maxReviews)
    if (filters.keyword)        p.set('keyword', filters.keyword)
    if (filters.maxResults)     p.set('maxResults', String(filters.maxResults))
    if (filters.priceLevels.size > 0) p.set('priceLevels', [...filters.priceLevels].join(','))
    if (pageToken)              p.set('pageToken', pageToken)
    return p
  }

  // ── Search ────────────────────────────────────────────────────────────────
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!city.trim()) return
    setSearching(true)
    setCandidates([])
    setNextPageToken(null)
    setSelected(new Set())
    setJobs(new Map())
    setActiveJobIds(new Set())
    try {
      const r = await fetch(`/api/leads/search?${buildParams()}`)
      const data = await r.json()
      setCandidates(data.candidates || [])
      setNextPageToken(data.nextPageToken || null)
    } catch { /* ignore */ }
    setSearching(false)
  }

  // ── Load more (pagination) ────────────────────────────────────────────────
  async function handleLoadMore() {
    if (!nextPageToken || loadingMore) return
    setLoadingMore(true)
    try {
      const r = await fetch(`/api/leads/search?${buildParams(nextPageToken)}`)
      const data = await r.json()
      setCandidates(prev => [...prev, ...(data.candidates || [])])
      setNextPageToken(data.nextPageToken || null)
    } catch { /* ignore */ }
    setLoadingMore(false)
  }

  // ── Generate demos ────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (selected.size === 0 || generating) return
    setGenerating(true)
    const selectedCandidates = candidates.filter(c => selected.has(c.place_id))
    const newJobs = new Map(jobs)
    const newJobIds = new Set<string>()

    await Promise.all(selectedCandidates.map(async c => {
      try {
        const r = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ google_place_id: c.place_id, model: 'claude-sonnet-4-6' }),
        })
        const data = await r.json()
        if (data.job_id) {
          newJobs.set(c.place_id, { jobId: data.job_id, status: 'pending' })
          newJobIds.add(data.job_id)
        }
      } catch { /* skip failed */ }
    }))

    setJobs(newJobs)
    setActiveJobIds(prev => new Set([...prev, ...newJobIds]))
    setGenerating(false)
  }

  const toggle    = (id: string) => setSelected(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })
  const toggleAll = () => setSelected(
    selected.size === candidates.length ? new Set() : new Set(candidates.map(c => c.place_id))
  )

  // ── Email modal ───────────────────────────────────────────────────────────
  async function openEmailModal(c: Candidate, demoUrl: string) {
    setEmailModal({ placeId: c.place_id, businessName: c.name, demoUrl, email: '', loading: true })
    try {
      const r = await fetch('/api/outreach-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place_id: c.place_id, business_name: c.name, vertical: c.vertical, demo_url: demoUrl, rating: c.rating, address: c.address }),
      })
      const data = await r.json()
      setEmailModal(prev => prev ? { ...prev, email: data.email || '', loading: false } : null)
    } catch {
      setEmailModal(prev => prev ? { ...prev, email: 'Error generando el email.', loading: false } : null)
    }
  }

  function copyEmail() {
    if (!emailModal?.email) return
    navigator.clipboard.writeText(emailModal.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Save candidate as lead ────────────────────────────────────────────────
  async function handleSaveAsLead(c: Candidate, demoUrl: string) {
    setSavingLead(c.place_id)
    // Extract slug from demoUrl (e.g. https://yaweb.ai/demo/demo-abc-123)
    const slug = demoUrl.split('/demo/')[1] || ''
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: c.name,
          google_place_id: c.place_id,
          vertical: c.vertical,
          address: c.address,
          has_website: c.has_website,
          existing_website: c.website,
          demo_slug: slug,
        }),
      })
      setSavedLeads(prev => new Set(prev).add(c.place_id))
    } catch { /* ignore */ }
    setSavingLead(null)
  }

  const doneCount = [...jobs.values()].filter(j => j.status === 'done').length
  const totalJobs = jobs.size

  // ── Price level toggle helper ─────────────────────────────────────────────
  function togglePrice(level: number) {
    setFilters(prev => {
      const next = new Set(prev.priceLevels)
      next.has(level) ? next.delete(level) : next.add(level)
      return { ...prev, priceLevels: next }
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-black text-gray-900 tracking-tight mb-1">Prospección en masa</h1>
        <p className="text-[14px] text-gray-500">
          Busca negocios por ciudad y sector, selecciona los más prometedores y genera sus demos con Sonnet.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white border-2 border-gray-200 rounded-md p-6 mb-6">
        {/* Main row */}
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Ciudad</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Madrid, Barcelona, Valencia…"
                className="w-full pl-9 pr-3 py-2.5 text-[14px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="w-44">
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Sector</label>
            <select
              value={vertical}
              onChange={e => setVertical(e.target.value)}
              className="w-full px-3 py-2.5 text-[14px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
            >
              <option value="all">Todos los sectores</option>
              {VERTICALS.map(v => <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>)}
            </select>
          </div>

          {/* Filtros toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(f => !f)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold border-2 rounded-md transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-400 text-blue-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="submit"
            disabled={searching || !city.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[14px] font-bold rounded-md transition-colors"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {searching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {/* ── Advanced filters panel ──────────────────────────────────────── */}
        {showFilters && (
          <div className="border-t-2 border-gray-100 pt-4 mt-1 space-y-4">
            {/* Row 1 — toggles */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Condiciones
              </label>
              <div className="flex flex-wrap gap-2">
                <Toggle
                  label="Sin web"
                  checked={filters.noWebsite}
                  onChange={() => setFilters(f => ({ ...f, noWebsite: !f.noWebsite }))}
                />
                <Toggle
                  label="Excluir ya guardados"
                  checked={filters.excludeKnown}
                  onChange={() => setFilters(f => ({ ...f, excludeKnown: !f.excludeKnown }))}
                />
                <Toggle
                  label="Abiertos ahora"
                  checked={filters.openNow}
                  onChange={() => setFilters(f => ({ ...f, openNow: !f.openNow }))}
                />
              </div>
            </div>

            {/* Row 2 — rating + reviews */}
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Rating mín / máx
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1} max={5} step={0.1}
                    placeholder="1.0"
                    value={filters.minRating}
                    onChange={e => setFilters(f => ({ ...f, minRating: e.target.value }))}
                    className="w-20 px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-gray-400 text-[12px]">—</span>
                  <input
                    type="number"
                    min={1} max={5} step={0.1}
                    placeholder="5.0"
                    value={filters.maxRating}
                    onChange={e => setFilters(f => ({ ...f, maxRating: e.target.value }))}
                    className="w-20 px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Nº reseñas mín / máx
                  <span className="ml-1 text-gray-300 normal-case font-normal">(proxy: pocas = negocio nuevo)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={filters.minReviews}
                    onChange={e => setFilters(f => ({ ...f, minReviews: e.target.value }))}
                    className="w-20 px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                  <span className="text-gray-400 text-[12px]">—</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="∞"
                    value={filters.maxReviews}
                    onChange={e => setFilters(f => ({ ...f, maxReviews: e.target.value }))}
                    className="w-20 px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Row 3 — price levels + keyword + results count */}
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Precio
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map(level => (
                    <PricePill
                      key={level}
                      level={level}
                      active={filters.priceLevels.has(level)}
                      onChange={() => togglePrice(level)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Palabra clave
                </label>
                <input
                  type="text"
                  placeholder="pizza, yoga, bodas…"
                  value={filters.keyword}
                  onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Resultados
                </label>
                <select
                  value={filters.maxResults}
                  onChange={e => setFilters(f => ({ ...f, maxResults: Number(e.target.value) }))}
                  className="px-3 py-2 text-[13px] border-2 border-gray-200 rounded-md focus:outline-none focus:border-blue-600 bg-white cursor-pointer"
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={60}>60</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-bold text-gray-400 hover:text-red-500 border-2 border-transparent hover:border-red-200 rounded-md transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </form>

      {/* Results */}
      {candidates.length > 0 && (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.size === candidates.length && candidates.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-[13px] text-gray-500 font-semibold">
                {candidates.length} negocios · {selected.size} seleccionados
              </span>
              {filters.noWebsite && (
                <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 font-bold">
                  <GlobeLock className="w-3 h-3" /> sin web
                </span>
              )}
            </div>

            {selected.size > 0 && (
              <button
                onClick={handleGenerate}
                disabled={generating || activeJobIds.size > 0}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold rounded-md transition-colors"
              >
                {generating
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />}
                Generar {selected.size} demo{selected.size !== 1 ? 's' : ''}
              </button>
            )}
          </div>

          {/* Progress banner */}
          {totalJobs > 0 && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-md flex items-center justify-between">
              <span className="text-[13px] font-semibold text-blue-700">
                {activeJobIds.size > 0
                  ? `Generando… ${doneCount} de ${totalJobs} completadas`
                  : `✓ ${doneCount} de ${totalJobs} demos generadas`}
              </span>
              {activeJobIds.size > 0 && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>
          )}

          {/* Candidate list */}
          <div className="rounded-md overflow-hidden border-2 border-gray-200">
            {candidates.map((c, i) => {
              const job    = jobs.get(c.place_id)
              const isSel  = selected.has(c.place_id)
              const hasJob = !!job

              return (
                <div
                  key={c.place_id}
                  className={`bg-white px-4 py-3.5 flex items-center gap-3.5 transition-colors ${
                    i < candidates.length - 1 ? 'border-b-2 border-gray-100' : ''
                  } ${isSel && !hasJob ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <input
                    type="checkbox"
                    checked={isSel}
                    onChange={() => toggle(c.place_id)}
                    disabled={hasJob}
                    className="w-4 h-4 rounded accent-blue-600 cursor-pointer shrink-0 disabled:opacity-40"
                  />

                  <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-[14px] font-black text-white uppercase leading-none">{c.name[0]}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-bold text-gray-900 text-[14px] tracking-tight">{c.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-bold uppercase tracking-wider shrink-0">
                        {VERTICAL_LABELS[c.vertical] || c.vertical}
                      </span>
                      {/* Website badge */}
                      {c.has_website ? (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold">
                          <Globe className="w-2.5 h-2.5" /> con web
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-50 text-rose-500 font-bold">
                          <GlobeLock className="w-2.5 h-2.5" /> sin web
                        </span>
                      )}
                      {/* Price level */}
                      {c.price_level && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-bold">
                          {PRICE_LABELS[c.price_level]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-gray-400 flex-wrap">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-xs">{c.address}</span>
                      {c.rating != null && (
                        <>
                          <span className="text-gray-300">·</span>
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                          <span className="text-gray-600 font-semibold">{c.rating}</span>
                          {c.review_count != null && (
                            <span>({c.review_count} reseñas)</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Job status */}
                  <div className="shrink-0">
                    {job?.status === 'done' && job.demoUrl ? (
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <a
                          href={job.demoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
                        >
                          Ver demo <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => openEmailModal(c, job.demoUrl!)}
                          className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-white border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 text-gray-600 rounded-md transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email
                        </button>
                        {savedLeads.has(c.place_id) ? (
                          <span className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-emerald-600 border-2 border-emerald-300 bg-emerald-50 rounded-md">
                            <BookmarkCheck className="w-3.5 h-3.5" /> Guardado
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSaveAsLead(c, job.demoUrl!)}
                            disabled={savingLead === c.place_id}
                            className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold bg-white border-2 border-gray-200 hover:border-violet-500 hover:text-violet-600 text-gray-600 rounded-md transition-colors disabled:opacity-50"
                          >
                            {savingLead === c.place_id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <BookmarkPlus className="w-3.5 h-3.5" />}
                            Guardar lead
                          </button>
                        )}
                      </div>
                    ) : job?.status === 'error' ? (
                      <div className="flex items-center gap-1.5 text-[12px] text-red-500 font-semibold">
                        <XCircle className="w-4 h-4" />
                        Error
                      </div>
                    ) : job ? (
                      <div className="flex items-center gap-1.5 text-[12px] text-blue-500 font-semibold">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generando…
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load more */}
          {nextPageToken && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 text-gray-600 text-[13px] font-bold rounded-md transition-all disabled:opacity-50"
              >
                {loadingMore
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <RefreshCw className="w-4 h-4" />}
                {loadingMore ? 'Cargando…' : 'Cargar más resultados'}
              </button>
            </div>
          )}
        </>
      )}

      {!searching && candidates.length === 0 && city && (
        <div className="text-center py-16 text-gray-400 text-[14px] font-semibold border-2 border-gray-200 rounded-md bg-white">
          No se encontraron negocios. Prueba con otra ciudad o sector.
        </div>
      )}

      {/* Email modal */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white border-2 border-gray-200 rounded-md w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-gray-100">
              <div>
                <h3 className="text-[14px] font-black text-gray-900">Email de outreach</h3>
                <p className="text-[12px] text-gray-400">{emailModal.businessName}</p>
              </div>
              <button onClick={() => setEmailModal(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4">
              {emailModal.loading ? (
                <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-[13px] font-semibold">Generando con Haiku…</span>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={emailModal.email}
                  rows={12}
                  className="w-full text-[13px] text-gray-700 border-2 border-gray-200 rounded-md p-3 resize-none font-mono leading-relaxed focus:outline-none"
                />
              )}
            </div>
            {!emailModal.loading && (
              <div className="flex gap-3 px-5 pb-4">
                <button
                  onClick={copyEmail}
                  className="flex items-center gap-2 px-4 py-2 text-[13px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? '✓ Copiado' : 'Copiar'}
                </button>
                <button onClick={() => setEmailModal(null)} className="px-4 py-2 text-[13px] font-semibold text-gray-500 hover:text-gray-900">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
