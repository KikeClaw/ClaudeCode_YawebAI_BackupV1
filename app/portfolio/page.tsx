import { getPortfolioClients } from '@/lib/db/clients'
import { PortfolioGrid } from './PortfolioGrid'

export const revalidate = 60 // revalidate every 60 seconds

export default async function PortfolioPage() {
  const clients = await getPortfolioClients()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''

  return (
    <div className="min-h-screen bg-[#0b1120]">
      {/* Header */}
      <header className="px-6 py-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-md bg-blue-500 flex items-center justify-center">
            <span className="text-white text-[11px] font-black leading-none">ya</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            yaweb<span className="text-blue-400">.ai</span>
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Webs generadas con{' '}
          <span className="text-blue-400">inteligencia artificial</span>
        </h1>
        <p className="mt-4 text-lg text-white/60 max-w-xl mx-auto">
          Cada web es única — generada en segundos a partir de una descripción del negocio. Sin plantillas. Sin código.
        </p>
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-white/40">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            {clients.length} webs generadas
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
            Generadas en &lt;3 minutos
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
            Claude AI
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 pb-20 max-w-7xl mx-auto">
        {clients.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🎨</div>
            <h2 className="text-xl font-bold text-white mb-2">Aún no hay demos generadas</h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              Ve al panel de administración para generar el portfolio.
            </p>
          </div>
        ) : (
          <PortfolioGrid clients={clients} appUrl={appUrl} />
        )}
      </main>

      {/* Footer CTA */}
      <footer className="border-t border-white/10 px-6 py-12 text-center">
        <p className="text-white/40 text-sm mb-4">
          ¿Quieres una web para tu negocio?
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          Crear mi web gratis
        </a>
      </footer>
    </div>
  )
}
