import type { SiteData } from '@/types'

export function GallerySection({ data }: { data: SiteData }) {
  if (!data.gallery?.images.length) return null
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section id="galeria" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.gallery.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.gallery.images.map((img, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-200">
              <img
                src={img.url}
                alt={img.alt || `Foto ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
