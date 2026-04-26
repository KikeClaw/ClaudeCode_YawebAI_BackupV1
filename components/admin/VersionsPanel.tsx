'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, RotateCcw } from 'lucide-react'

interface Version {
  id: string
  version: number
  is_active: boolean
  created_at: string
}

interface Props {
  clientId: string
  versions: Version[]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function VersionsPanel({ clientId, versions }: Props) {
  const router = useRouter()
  const [restoringId, setRestoringId] = useState<string | null>(null)

  async function handleRestore(versionId: string) {
    setRestoringId(versionId)
    try {
      await fetch(`/api/clients/${clientId}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version_id: versionId }),
      })
      router.refresh()
    } finally {
      setRestoringId(null)
    }
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-md p-5">
      <h3 className="text-[13px] font-extrabold text-gray-900 tracking-tight mb-4">Versiones</h3>

      {versions.length === 0 ? (
        <p className="text-[12px] text-gray-400 font-medium">Sin versiones aún.</p>
      ) : (
        <div className="space-y-2">
          {versions.map(v => (
            <div
              key={v.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md border-2 ${
                v.is_active ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-white'
              }`}
            >
              {/* Version label */}
              <span
                className={`text-[12px] font-black tabular-nums shrink-0 ${
                  v.is_active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                v{v.version}
              </span>

              {/* Timestamp */}
              <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium flex-1 min-w-0">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate">{timeAgo(v.created_at)}</span>
              </div>

              {/* Active badge or restore button */}
              {v.is_active ? (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-600 text-white shrink-0">
                  Activa
                </span>
              ) : (
                <button
                  onClick={() => handleRestore(v.id)}
                  disabled={restoringId === v.id}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 shrink-0"
                >
                  <RotateCcw className="w-3 h-3" />
                  {restoringId === v.id ? 'Restaurando…' : 'Restaurar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
