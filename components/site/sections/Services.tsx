import type { SiteData } from '@/types'

export function ServicesSection({ data }: { data: SiteData }) {
  if (!data.services?.items.length) return null
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section id="servicios" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.services.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.services.items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
              <div className="w-10 h-10 rounded-full mb-4 flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: primary }}>
                {i + 1}
              </div>
              <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.name}</h3>
              {item.description && <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>}
              {item.price && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="font-semibold text-sm" style={{ color: primary }}>{item.price}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
