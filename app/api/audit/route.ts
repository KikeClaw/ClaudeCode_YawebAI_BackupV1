import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getPlaceFromUrl, detectVertical } from '@/lib/google-places'
import type { GooglePlaceData, Vertical } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Rate limit: 20 audits per IP per hour
const limits = new Map<string, { count: number; resetAt: number }>()

function isLimited(ip: string): boolean {
  const now = Date.now()
  const e = limits.get(ip)
  if (!e || e.resetAt < now) { limits.set(ip, { count: 1, resetAt: now + 3_600_000 }); return false }
  if (e.count >= 20) return true
  e.count++
  return false
}

export interface AuditCheck {
  id: string
  label: string
  status: 'pass' | 'warning' | 'fail'
  detail: string
  points: number
  earned: number
}

export interface AuditResult {
  businessName: string
  address: string
  rating: number | null
  totalReviews: number
  score: number
  checks: AuditCheck[]
  recommendations: string[]
  vertical: string
}

function buildChecks(place: GooglePlaceData): AuditCheck[] {
  const photos    = place.photos?.length ?? 0
  const reviews   = place.user_ratings_total ?? 0
  const rating    = place.rating ?? 0
  const hasHours  = (place.opening_hours?.weekday_text?.length ?? 0) >= 7
  const catCount  = (place.types ?? []).filter(
    t => !['point_of_interest', 'establishment', 'food', 'store'].includes(t)
  ).length

  return [
    {
      id: 'description',
      label: 'Descripción editorial',
      status: place.editorial_summary?.overview ? 'pass' : 'fail',
      detail: place.editorial_summary?.overview
        ? 'Descripción presente en el perfil'
        : 'Sin descripción — Google no puede posicionarte en búsquedas relevantes',
      points: 20,
      earned: place.editorial_summary?.overview ? 20 : 0,
    },
    {
      id: 'reviews',
      label: 'Reseñas y valoración',
      status: reviews >= 20 && rating >= 4.0 ? 'pass' : reviews >= 5 ? 'warning' : 'fail',
      detail: reviews > 0
        ? `${reviews} reseña${reviews === 1 ? '' : 's'} · ${rating.toFixed(1)}/5 ⭐`
        : 'Sin reseñas — los clientes no confían en negocios sin valoraciones',
      points: 20,
      earned: reviews >= 20 && rating >= 4.0 ? 20
            : reviews >= 5 && rating >= 3.5  ? 12
            : reviews >= 1                   ? 6
            : 0,
    },
    {
      id: 'photos',
      label: 'Fotos del negocio',
      status: photos >= 10 ? 'pass' : photos >= 3 ? 'warning' : 'fail',
      detail: photos >= 10
        ? `${photos} fotos — excelente`
        : photos >= 3
          ? `Solo ${photos} fotos — se recomiendan al menos 10`
          : photos === 0 ? 'Sin fotos — reduce tu conversión un 70%' : `${photos} foto — necesitas más`,
      points: 15,
      earned: photos >= 10 ? 15 : photos >= 3 ? 8 : photos >= 1 ? 3 : 0,
    },
    {
      id: 'hours',
      label: 'Horario de apertura',
      status: hasHours ? 'pass' : place.opening_hours ? 'warning' : 'fail',
      detail: hasHours
        ? 'Horario completo configurado para todos los días'
        : place.opening_hours
          ? 'Horario incompleto — falta configurar algunos días'
          : 'Sin horario — los clientes no saben cuándo puedes atenderles',
      points: 15,
      earned: hasHours ? 15 : place.opening_hours ? 8 : 0,
    },
    {
      id: 'phone',
      label: 'Teléfono de contacto',
      status: place.formatted_phone_number ? 'pass' : 'fail',
      detail: place.formatted_phone_number
        ? place.formatted_phone_number
        : 'Sin teléfono — pierdes llamadas directas desde Google',
      points: 10,
      earned: place.formatted_phone_number ? 10 : 0,
    },
    {
      id: 'website',
      label: 'Página web propia',
      status: place.website ? 'pass' : 'fail',
      detail: place.website
        ? `Enlazado: ${new URL(place.website).hostname}`
        : 'Sin web — el 68% de los negocios similares sí tienen',
      points: 10,
      earned: place.website ? 10 : 0,
    },
    {
      id: 'price',
      label: 'Rango de precios',
      status: place.price_level != null ? 'pass' : 'warning',
      detail: place.price_level != null
        ? '€'.repeat(place.price_level) + ' configurado'
        : 'No configurado — los clientes lo usan para filtrar resultados',
      points: 5,
      earned: place.price_level != null ? 5 : 0,
    },
    {
      id: 'categories',
      label: 'Categorías de negocio',
      status: catCount >= 2 ? 'pass' : catCount >= 1 ? 'warning' : 'fail',
      detail: catCount >= 2
        ? `${catCount} categorías definidas`
        : catCount === 1
          ? '1 categoría — añade categorías secundarias'
          : 'Sin categorías — Google no sabe qué tipo de negocio eres',
      points: 5,
      earned: catCount >= 2 ? 5 : catCount >= 1 ? 2 : 0,
    },
  ]
}

async function generateRecommendations(
  place: GooglePlaceData,
  checks: AuditCheck[],
  vertical: Vertical
): Promise<string[]> {
  const failing = checks.filter(c => c.status !== 'pass')
  if (failing.length === 0) {
    return ['Tu perfil está muy bien optimizado. Pide activamente reseñas a clientes satisfechos para seguir subiendo.']
  }

  const prompt = `Eres un consultor experto en Google Business Profile. Analiza este negocio y da exactamente 3 recomendaciones concretas y accionables en español.

Negocio: ${place.name} (${vertical})
Puntuación actual: ${checks.reduce((s, c) => s + c.earned, 0)}/100

Problemas detectados:
${failing.map(c => `- ${c.label}: ${c.detail}`).join('\n')}

Responde SOLO con un array JSON de exactamente 3 strings. Cada string es 1 recomendación específica (máximo 30 palabras). Sé concreto y directo. Enfócate en el impacto real en clientes y conversiones.`

  try {
    const res = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = res.content[0].type === 'text' ? res.content[0].text : '[]'
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const arr = JSON.parse(cleaned)
    if (Array.isArray(arr)) return arr.slice(0, 3).map(String)
    throw new Error('not array')
  } catch {
    // Fallback: take worst 3 fails and write generic tips
    return failing.slice(0, 3).map(c => {
      const tips: Record<string, string> = {
        description: 'Añade una descripción de 150-250 palabras con tus servicios principales y lo que te diferencia.',
        reviews:     'Pide activamente reseñas a cada cliente satisfecho — un mensaje de WhatsApp o SMS justo después de la visita funciona muy bien.',
        photos:      'Añade 10+ fotos del local, equipo y productos. Los negocios con más fotos reciben un 42% más de solicitudes de ruta.',
        hours:       'Configura el horario completo incluyendo festivos — el 60% de búsquedas "cerca de mí" filtran por horario actual.',
        phone:       'Añade tu teléfono de contacto para aparecer en llamadas directas desde Google Maps.',
        website:     'Enlaza una página web profesional — mejora tu posicionamiento y da contexto completo a los clientes.',
        price:       'Configura el rango de precios para aparecer en búsquedas filtradas por presupuesto.',
        categories:  'Añade categorías secundarias relevantes para aparecer en más búsquedas relacionadas.',
      }
      return tips[c.id] ?? `Completa el campo "${c.label}" en tu panel de Google Business.`
    })
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (isLimited(ip)) {
    return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta de nuevo en una hora.' }, { status: 429 })
  }

  try {
    const { google_url } = await req.json()
    if (!google_url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

    const place = await getPlaceFromUrl(google_url)
    if (!place) {
      return NextResponse.json(
        { error: 'No encontramos ese negocio en Google. ¿Es una URL de Google Maps?' },
        { status: 404 }
      )
    }

    const vertical = detectVertical(place.types || [])
    const checks = buildChecks(place)
    const score = checks.reduce((s, c) => s + c.earned, 0)
    const recommendations = await generateRecommendations(place, checks, vertical)

    const result: AuditResult = {
      businessName: place.name,
      address: place.formatted_address ?? '',
      rating: place.rating ?? null,
      totalReviews: place.user_ratings_total ?? 0,
      score,
      checks,
      recommendations,
      vertical,
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('audit error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
