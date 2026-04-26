'use client'

import { useState } from 'react'
import type { SiteData } from '@/types'

export function ContactSection({ data }: { data: SiteData }) {
  if (!data.contact?.enabled) return null
  const primary = data.theme?.primary || '#2563eb'
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setSent(true)
    setLoading(false)
  }

  return (
    <section id="contacto" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.contact.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div className="space-y-5">
            {data.contact.phone && (
              <a href={`tel:${data.contact.phone}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: primary }}>📞</div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</div>
                  <div className="font-semibold text-gray-900">{data.contact.phone}</div>
                </div>
              </a>
            )}
            {data.contact.whatsapp && (
              <a href={`https://wa.me/${data.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-500 text-white text-xl">💬</div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">WhatsApp</div>
                  <div className="font-semibold text-gray-900">Escríbenos</div>
                </div>
              </a>
            )}
            {data.contact.email && (
              <a href={`mailto:${data.contact.email}`} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl" style={{ backgroundColor: primary }}>✉️</div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
                  <div className="font-semibold text-gray-900">{data.contact.email}</div>
                </div>
              </a>
            )}
            {data.social?.enabled && (
              <div className="flex gap-3 mt-4">
                {data.social.instagram && <SocialLink href={`https://instagram.com/${data.social.instagram}`} label="Instagram" emoji="📸" />}
                {data.social.facebook && <SocialLink href={data.social.facebook} label="Facebook" emoji="👥" />}
                {data.social.tiktok && <SocialLink href={`https://tiktok.com/@${data.social.tiktok}`} label="TikTok" emoji="🎵" />}
              </div>
            )}
          </div>

          {data.contact.form_enabled && (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              {sent ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="font-semibold text-gray-900 mb-1">¡Mensaje enviado!</h3>
                  <p className="text-gray-500 text-sm">Nos pondremos en contacto pronto.</p>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm"
                    style={{ '--tw-ring-color': primary } as React.CSSProperties}
                  />
                  <input
                    type="email"
                    placeholder="Tu email"
                    required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm"
                  />
                  <textarea
                    placeholder="Tu mensaje..."
                    rows={4}
                    required
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 text-sm resize-none"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: primary }}
                  >
                    {loading ? 'Enviando...' : 'Enviar mensaje'}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function SocialLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={label}
      className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
      {emoji}
    </a>
  )
}
