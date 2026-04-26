import type { SiteData } from '@/types'

export function LocationSection({ data }: { data: SiteData }) {
  if (!data.location?.enabled) return null
  const primary = data.theme?.primary || '#2563eb'

  const embedUrl = data.location.lat && data.location.lng
    ? `https://maps.google.com/maps?q=${data.location.lat},${data.location.lng}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(data.location.address)}&z=16&output=embed`

  return (
    <section id="ubicacion" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.location.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: primary }}>
                  📍
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Dirección</h3>
                  <p className="text-gray-600">{data.location.address}</p>
                </div>
              </div>
              {data.contact?.phone && (
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{ backgroundColor: primary }}>
                    📞
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Teléfono</h3>
                    <a href={`tel:${data.contact.phone}`} className="text-gray-600 hover:underline">{data.contact.phone}</a>
                  </div>
                </div>
              )}
              <a
                href={data.location.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: primary }}
              >
                🗺️ Abrir en Google Maps
              </a>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden shadow-md h-80">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="border-0"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
