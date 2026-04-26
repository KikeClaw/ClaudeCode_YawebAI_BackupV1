'use client'

import type { SiteData } from '@/types'
import { HeroSection } from './sections/Hero'
import { AboutSection } from './sections/About'
import { ServicesSection } from './sections/Services'
import { MenuSection } from './sections/Menu'
import { HoursSection } from './sections/Hours'
import { LocationSection } from './sections/Location'
import { GallerySection } from './sections/Gallery'
import { ReviewsSection } from './sections/Reviews'
import { ContactSection } from './sections/Contact'
import { FooterSection } from './sections/Footer'

interface Props {
  data: SiteData
  isDemo?: boolean
}

export function SiteRenderer({ data, isDemo }: Props) {
  const primaryColor = data.theme?.primary || '#2563eb'

  return (
    <div className="min-h-screen bg-white font-sans" style={{ '--primary': primaryColor } as React.CSSProperties}>
      {isDemo && <DemoBanner businessName={data.business_name} />}

      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg" style={{ color: primaryColor }}>{data.business_name}</span>
          <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            {data.about?.enabled && <a href="#nosotros" className="hover:text-gray-900 transition-colors">Nosotros</a>}
            {data.services?.enabled && <a href="#servicios" className="hover:text-gray-900 transition-colors">Servicios</a>}
            {data.menu?.enabled && <a href="#carta" className="hover:text-gray-900 transition-colors">Carta</a>}
            {data.hours?.enabled && <a href="#horarios" className="hover:text-gray-900 transition-colors">Horarios</a>}
            {data.gallery?.enabled && data.gallery.images.length > 0 && (
              <a href="#galeria" className="hover:text-gray-900 transition-colors">Galería</a>
            )}
            {data.contact?.enabled && (
              <a href="#contacto" className="hover:text-gray-900 transition-colors">Contacto</a>
            )}
          </div>
          {data.contact?.phone && (
            <a
              href={`tel:${data.contact.phone}`}
              className="text-sm font-medium px-4 py-2 rounded-full text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {data.contact.phone}
            </a>
          )}
        </div>
      </nav>

      <HeroSection data={data} />
      {data.about?.enabled && <AboutSection data={data} />}
      {data.services?.enabled && <ServicesSection data={data} />}
      {data.menu?.enabled && <MenuSection data={data} />}
      {data.hours?.enabled && <HoursSection data={data} />}
      {data.location?.enabled && <LocationSection data={data} />}
      {data.gallery?.enabled && data.gallery.images.length > 0 && <GallerySection data={data} />}
      {data.reviews?.enabled && data.reviews.items.length > 0 && <ReviewsSection data={data} />}
      {data.contact?.enabled && <ContactSection data={data} />}
      <FooterSection data={data} />
    </div>
  )
}

function DemoBanner({ businessName }: { businessName: string }) {
  return (
    <div className="bg-amber-400 text-amber-900 text-center py-2 px-4 text-sm font-medium sticky top-0 z-50">
      🌐 Esta es una <strong>demo gratuita</strong> para <strong>{businessName}</strong> —
      ¿Te gusta? <a href="tel:+34000000000" className="underline font-bold">Llámanos</a> o escríbenos a{' '}
      <a href="mailto:hola@yaweb.ai" className="underline font-bold">hola@yaweb.ai</a> para activarla por 99€/año
    </div>
  )
}
