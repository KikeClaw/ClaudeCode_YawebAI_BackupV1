'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'

const SECTIONS = [
  { key: 'hero',      label: 'Hero' },
  { key: 'nosotros',  label: 'Sobre nosotros' },
  { key: 'servicios', label: 'Servicios / Carta' },
  { key: 'reseñas',   label: 'Reseñas' },
  { key: 'contacto',  label: 'Contacto' },
]

export function SectionRegenPanel({ clientId, onUpdate }: { clientId: string; onUpdate: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult]   = useState<{ key: string; ok: boolean } | null>(null)

  async function regen(sectionKey: string) {
    setLoading(sectionKey)
    setResult(null)
    try {
      const r = await fetch(`/api/clients/${clientId}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: sectionKey }),
      })
      const data = await r.json()
      setResult({ key: sectionKey, ok: !!data.ok })
      if (data.ok) {
        setTimeout(() => { setResult(null); onUpdate() }, 1200)
      }
    } catch {
      setResult({ key: sectionKey, ok: false })
    }
    setLoading(null)
  }

  return (
    <div className="border-2 border-gray-200 rounded-md p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4 text-gray-400" />
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Regenerar sección</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {SECTIONS.map(s => {
          const isLoading = loading === s.key
          const isDone    = result?.key === s.key && result.ok
          const isError   = result?.key === s.key && !result.ok
          return (
            <button
              key={s.key}
              onClick={() => regen(s.key)}
              disabled={!!loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md border-2 transition-colors disabled:opacity-50 ${
                isDone  ? 'bg-emerald-50 border-emerald-400 text-emerald-700' :
                isError ? 'bg-red-50 border-red-300 text-red-600' :
                'bg-white border-gray-200 text-gray-600 hover:border-blue-600 hover:text-blue-600'
              }`}
            >
              {isLoading
                ? <RefreshCw className="w-3 h-3 animate-spin" />
                : <RefreshCw className="w-3 h-3" />}
              {isDone ? '✓ ' : isError ? '✗ ' : ''}{s.label}
            </button>
          )
        })}
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Regenera solo esa sección con Haiku. El resto de la web no cambia.
      </p>
    </div>
  )
}
