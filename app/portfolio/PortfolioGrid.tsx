'use client'

import { useState } from 'react'
import { MapPin } from 'lucide-react'
import type { Client } from '@/types'

// ── Vertical display ──────────────────────────────────────────────────────────

const VERTICAL_META: Record<string, { emoji: string; label: string; color: string }> = {
  restaurant: { emoji: '🍽️', label: 'Restaurante', color: 'bg-orange-100 text-orange-700' },
  bar:        { emoji: '🍸', label: 'Bar / Café',   color: 'bg-purple-100 text-purple-700' },
  salon:      { emoji: '✂️', label: 'Peluquería',   color: 'bg-pink-100 text-pink-700' },
  lawyer:     { emoji: '⚖️', label: 'Abogado',      color: 'bg-slate-100 text-slate-700' },
  clinic:     { emoji: '🏥', label: 'Clínica',      color: 'bg-cyan-100 text-cyan-700' },
  gym:        { emoji: '💪', label: 'Gimnasio',     color: 'bg-red-100 text-red-700' },
  hotel:      { emoji: '🏨', label: 'Hotel',        color: 'bg-amber-100 text-amber-700' },
  pharmacy:   { emoji: '💊', label: 'Farmacia',     color: 'bg-green-100 text-green-700' },
  academy:    { emoji: '🎓', label: 'Academia',     color: 'bg-blue-100 text-blue-700' },
  shop:       { emoji: '🛍️', label: 'Tienda',       color: 'bg-fuchsia-100 text-fuchsia-700' },
  workshop:   { emoji: '🔧', label: 'Taller',       color: 'bg-stone-100 text-stone-700' },
  generic:    { emoji: '🏢', label: 'Otro',         color: 'bg-gray-100 text-gray-700' },
}

const FILTER_ITEMS = [
  { key: 'all',        label: 'Todos' },
  { key: 'restaurant', label: 'Restaurante' },
  { key: 'bar',        label: 'Bar / Café' },
  { key: 'salon',      label: 'Peluquería' },
  { key: 'lawyer',     label: 'Abogado' },
  { key: 'clinic',     label: 'Clínica' },
  { key: 'gym',        label: 'Gimnasio' },
  { key: 'hotel',      label: 'Hotel' },
  { key: 'pharmacy',   label: 'Farmacia' },
  { key: 'academy',    label: 'Academia' },
  { key: 'shop',       label: 'Tienda' },
  { key: 'workshop',   label: 'Taller' },
  { key: 'generic',    label: 'Otro' },
]

// ── Card ──────────────────────────────────────────────────────────────────────

function PortfolioCard({ client, demoUrl }: { client: Client; demoUrl: string }) {
  const vertical = VERTICAL_META[client.vertical] ?? VERTICAL_META.generic

  return (
    <a
      href={demoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
    >
      {/* Iframe thumbnail */}
      <div
        className="relative overflow-hidden bg-gray-100"
        style={{ aspectRatio: '4/3' }}
      >
        <iframe
          src={demoUrl}
          loading="lazy"
          title={client.name}
          style={{
            width: '1280px',
            height: '960px',
            border: 'none',
            transformOrigin: '0 0',
            transform: 'scale(0.25)',
            pointerEvents: 'none',
          }}
          sandbox="allow-scripts allow-same-origin"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm leading-tight truncate group-hover:text-blue-600 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 truncate">
                {/* Extract city from context if available, else show generic */}
                España
              </span>
            </div>
          </div>
          <span className={`shrink-0 text-[10px] font-semibold rounded-full px-2 py-0.5 ${vertical.color}`}>
            {vertical.emoji} {vertical.label}
          </span>
        </div>
      </div>
    </a>
  )
}

// ── Grid with filter ──────────────────────────────────────────────────────────

export function PortfolioGrid({ clients, appUrl }: { clients: Client[]; appUrl: string }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const filtered = activeFilter === 'all'
    ? clients
    : clients.filter(c => c.vertical === activeFilter)

  // Only show filters that have at least one result
  const usedVerticals = new Set<string>(clients.map(c => c.vertical))
  const visibleFilters = FILTER_ITEMS.filter(f => f.key === 'all' || usedVerticals.has(f.key))

  return (
    <>
      {/* Filter bar */}
      {visibleFilters.length > 2 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {visibleFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeFilter === f.key
                  ? 'bg-white text-blue-600 border-blue-200 shadow-sm'
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20 hover:text-white'
              }`}
            >
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 opacity-60 text-xs">
                  {clients.filter(c => c.vertical === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      {activeFilter !== 'all' && (
        <p className="text-sm text-white/60 mb-6">
          {filtered.length} {filtered.length === 1 ? 'web' : 'webs'} en esta categoría
        </p>
      )}

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(client => (
            <PortfolioCard
              key={client.id}
              client={client}
              demoUrl={`${appUrl}/demo/${client.slug}`}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-white/50">
          No hay webs en esta categoría todavía.
        </div>
      )}
    </>
  )
}
