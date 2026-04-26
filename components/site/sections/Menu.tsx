import type { SiteData } from '@/types'

export function MenuSection({ data }: { data: SiteData }) {
  if (!data.menu?.enabled || !data.menu.categories.length) return null
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section id="carta" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.menu.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="space-y-10">
          {data.menu.categories.map((cat, ci) => (
            <div key={ci}>
              <h3 className="text-xl font-bold mb-4 pb-2 border-b-2" style={{ borderColor: primary, color: primary }}>
                {cat.name}
              </h3>
              <div className="space-y-3">
                {cat.items.map((item, ii) => (
                  <div key={ii} className="flex items-start justify-between gap-4 py-2">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{item.name}</span>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      )}
                      {item.allergens?.length ? (
                        <p className="text-xs text-gray-400 mt-0.5">⚠️ {item.allergens.join(', ')}</p>
                      ) : null}
                    </div>
                    {item.price && (
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{item.price}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
