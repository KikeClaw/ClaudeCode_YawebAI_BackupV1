import type { SiteData } from '@/types'

export function ReviewsSection({ data }: { data: SiteData }) {
  if (!data.reviews?.items.length) return null
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section id="reseñas" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{data.reviews.title}</h2>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-3xl font-bold" style={{ color: primary }}>{data.reviews.rating}</span>
            <div className="flex">
              {[1, 2, 3, 4, 5].map(s => (
                <span key={s} className={s <= Math.round(data.reviews!.rating) ? 'text-yellow-400' : 'text-gray-200'}>★</span>
              ))}
            </div>
            <span className="text-gray-500 text-sm">({data.reviews.total} reseñas)</span>
          </div>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {data.reviews.items.map((review, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: primary }}>
                  {review.author[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{review.author}</div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(s => (
                      <span key={s} className={`text-xs ${s <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                {review.date && <span className="ml-auto text-xs text-gray-400">{review.date}</span>}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
