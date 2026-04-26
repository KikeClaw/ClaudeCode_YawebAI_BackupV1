'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'

export function ColorEditor({ clientId, onUpdate }: { clientId: string; onUpdate: () => void }) {
  const [color, setSaving_color] = useState('#2563eb')
  const [saving, setSaving]     = useState(false)
  const [done, setDone]         = useState(false)

  async function apply() {
    setSaving(true)
    setDone(false)
    await fetch(`/api/clients/${clientId}/color`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    })
    setSaving(false)
    setDone(true)
    setTimeout(() => setDone(false), 2000)
    onUpdate()
  }

  return (
    <div className="border-2 border-gray-200 rounded-md p-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-gray-400" />
        <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Color principal</span>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={color}
          onChange={e => setSaving_color(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border-2 border-gray-200 p-0.5 shrink-0"
        />
        <span className="font-mono text-[13px] text-gray-600">{color}</span>
        <button
          onClick={apply}
          disabled={saving}
          className="ml-auto px-3 py-1.5 text-[12px] font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md transition-colors"
        >
          {saving ? 'Aplicando…' : done ? '✓ Aplicado' : 'Aplicar'}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-gray-400">
        Sobreescribe el color de acento sin regenerar la web.
      </p>
    </div>
  )
}
