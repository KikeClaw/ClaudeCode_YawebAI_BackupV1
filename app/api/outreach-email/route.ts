import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getPlaceById } from '@/lib/google-places'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { place_id, business_name, vertical, demo_url, rating, address } = await req.json()

  if (!demo_url || !business_name) {
    return NextResponse.json({ error: 'demo_url and business_name required' }, { status: 400 })
  }

  let placeContext = `Negocio: ${business_name}\nSector: ${vertical || 'local'}\nDirección: ${address || ''}\nValoración: ${rating ? `${rating}/5` : 'N/A'}`

  if (place_id) {
    try {
      const place = await getPlaceById(place_id)
      if (place) {
        placeContext = `Negocio: ${place.name}
Sector: ${vertical || 'local'}
Dirección: ${place.formatted_address}
Valoración: ${place.rating ?? 'N/A'}/5 (${place.user_ratings_total ?? 0} reseñas en Google)
Descripción: ${place.editorial_summary?.overview ?? ''}`
      }
    } catch { /* use basic context */ }
  }

  const prompt = `Eres un experto en ventas B2B para una agencia de webs española llamada yaweb.ai que crea webs profesionales para negocios locales en 60 segundos con IA, por 99€/año.

Escribe un email de prospección frío para el siguiente negocio. Hemos generado una demo personalizada para ellos — el objetivo es que la vean.

DATOS DEL NEGOCIO:
${placeContext}

DEMO GENERADA: ${demo_url}

REGLAS:
- Total máximo: 120 palabras en el cuerpo
- Asunto: específico, menciona el nombre del negocio, no genérico
- Menciona algo concreto (nombre, zona, valoración si es buena)
- Nunca uses: "gratis", "oferta", "garantizado", "increíble", "revolucionario"
- Tono: profesional pero cercano — como un colega, no un vendedor
- CTA único y claro: ver la demo
- Sin asteriscos, sin markdown, sin listas — texto plano
- Formato exacto: primera línea "ASUNTO: ..." seguida de línea en blanco, luego el cuerpo`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 450,
    messages: [{ role: 'user', content: prompt }],
  })

  const email = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ email })
}
