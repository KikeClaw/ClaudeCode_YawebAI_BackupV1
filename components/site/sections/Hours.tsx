import type { SiteData } from '@/types'

export function HoursSection({ data }: { data: SiteData }) {
  if (!data.hours?.schedule.length) return null
  const primary = data.theme?.primary || '#2563eb'

  const today = new Date().getDay()
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const todayName = dayNames[today]

  return (
    <section id="horarios" className="py-20 bg-gray-50">
      <div className="max-w-lg mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.hours.title}</h2>
          <div className="h-1 w-16 mx-auto rounded-full" style={{ backgroundColor: primary }} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {data.hours.schedule.map((item, i) => {
            const isToday = item.day === todayName
            return (
              <div
                key={i}
                className={`flex items-center justify-between px-6 py-4 ${i > 0 ? 'border-t border-gray-50' : ''} ${isToday ? 'font-semibold' : ''}`}
                style={isToday ? { backgroundColor: `${primary}10` } : {}}
              >
                <span className="text-gray-700 flex items-center gap-2">
                  {isToday && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />}
                  {item.day}
                </span>
                <span className={item.closed ? 'text-red-500' : 'text-gray-900'}>
                  {item.closed ? 'Cerrado' : `${item.open} – ${item.close}`}
                </span>
              </div>
            )
          })}
        </div>
        {data.hours.note && (
          <p className="text-center text-sm text-gray-500 mt-4">{data.hours.note}</p>
        )}
      </div>
    </section>
  )
}
