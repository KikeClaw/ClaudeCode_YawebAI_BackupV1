import type { SiteData } from '@/types'

export function AboutSection({ data }: { data: SiteData }) {
  if (!data.about) return null
  const primary = data.theme?.primary || '#2563eb'

  return (
    <section id="nosotros" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.about.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="prose prose-lg mx-auto text-gray-600 text-center leading-relaxed">
          {data.about.text.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
