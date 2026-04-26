import type { SiteData } from '@/types'

export function FooterSection({ data }: { data: SiteData }) {
  const primary = data.theme?.primary || '#2563eb'
  const year = new Date().getFullYear()

  return (
    <footer className="py-8 text-center text-sm text-gray-500" style={{ backgroundColor: '#1a1a1a' }}>
      <div className="max-w-4xl mx-auto px-6">
        <p className="text-white/80 mb-2 font-medium">{data.business_name}</p>
        {data.location?.address && (
          <p className="text-white/50 text-xs mb-4">{data.location.address}</p>
        )}
        <p className="text-white/30 text-xs">
          © {year} {data.business_name} · Web creada con{' '}
          <a href="https://yaweb.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/60 transition-colors">
            yaweb.ai
          </a>
        </p>
      </div>
    </footer>
  )
}
