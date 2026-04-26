'use client'

import type { SiteData } from '@/types'

export function HeroSection({ data }: { data: SiteData }) {
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section
      className="relative min-h-[70vh] flex items-center justify-center text-white"
      style={{ background: `linear-gradient(135deg, ${primary}ee, ${primary}99)` }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
          {data.hero.headline}
        </h1>
        <p className="text-lg md:text-xl mb-10 text-white/90 max-w-2xl mx-auto leading-relaxed">
          {data.hero.subheadline}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {data.hero.cta_phone && (
            <a
              href={`tel:${data.hero.cta_phone}`}
              className="px-8 py-4 rounded-full bg-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ color: primary }}
            >
              📞 {data.hero.cta_text || 'Llámanos'}
            </a>
          )}
          {data.contact?.whatsapp && (
            <a
              href={`https://wa.me/${data.contact.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-green-500 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" className="w-full fill-white">
          <path d="M0,60 C360,0 1080,0 1440,60 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}
