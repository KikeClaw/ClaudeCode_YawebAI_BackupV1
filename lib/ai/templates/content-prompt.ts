/**
 * Generates the prompt that asks the AI for TemplateContent JSON.
 * Focused on copywriting only — no design, no HTML, no CSS decisions.
 * Much shorter than buildHtmlGenerationPrompt → cheaper + faster.
 */

import type { GooglePlaceData, Vertical } from '@/types'
import { parseOpeningHours } from '../../google-places'

const VERTICAL_SERVICES: Record<string, string> = {
  restaurant: 'Platos principales, menú del día, bebidas, postres, eventos privados',
  bar:        'Cervezas de barril, cócteles, tapas, raciones, fútbol en pantalla',
  salon:      'Corte de pelo, coloración, mechas, tratamientos, manicura/pedicura',
  lawyer:     'Consulta inicial, derecho laboral, divorcios, herencias, accidentes',
  clinic:     'Primera consulta, diagnóstico, tratamientos, seguimiento, urgencias',
  gym:        'Musculación, clases dirigidas, entrenamiento personal, nutrición, spinning',
  hotel:      'Habitaciones, desayuno, spa, piscina, traslados, eventos',
  pharmacy:   'Medicamentos, parafarmacia, ortopedia, asesoramiento, servicio urgente',
  academy:    'Clases individuales, grupos reducidos, online, materiales, exámenes',
  shop:       'Catálogo principal, pedidos especiales, envío, devoluciones, asesoramiento',
  workshop:   'Diagnóstico, reparación, revisión, presupuesto, recogida/entrega',
  generic:    'Servicio principal, consulta, asesoramiento, presupuesto, atención personalizada',
}

const VERTICAL_FAQ: Record<string, string> = {
  restaurant: 'reservas, alergenos, grupos, aparcamiento, carta de temporada',
  bar:        'horarios de partidos, reserva de espacio, terraza, música, cumpleaños',
  salon:      'cita previa, duración del servicio, aparcamiento, productos, garantía',
  lawyer:     'primera consulta, honorarios, plazos, confidencialidad, documentación',
  clinic:     'cita sin esperas, seguro médico, aparcamiento, segunda opinión, urgencias',
  gym:        'cuota, clases incluidas, contrato de permanencia, horarios, aparcamiento',
  hotel:      'check-in/out, cancelación, mascotas, traslados, desayuno incluido',
  pharmacy:   'receta médica, precio, entrega a domicilio, horario 24h, medicamento específico',
  academy:    'nivel inicial, precio por hora, grupos o individual, certificados, horarios',
  shop:       'envíos, devoluciones, garantía, pago aplazado, disponibilidad de stock',
  workshop:   'presupuesto previo, garantía, tiempo de reparación, recogida, urgencias',
  generic:    'precio, disponibilidad, garantía, plazos, proceso de trabajo',
}

export function buildTemplateContentPrompt(
  place: GooglePlaceData,
  vertical: Vertical,
  opts: {
    extraContext?: string
    menuText?: string
    enrichedData?: string
    websiteContent?: string
    tone?: 'friendly' | 'formal'
    density?: 'full' | 'minimal'
    language?: 'es' | 'en' | 'de' | 'fr'
    valueProp?: string
    servicesText?: string
  } = {}
): string {
  const {
    tone = 'friendly',
    density = 'full',
    language = 'es',
    extraContext,
    menuText,
    enrichedData,
    websiteContent,
    valueProp,
    servicesText,
  } = opts

  const langName = { es: 'Spanish', en: 'English', de: 'German', fr: 'French' }[language] ?? 'Spanish'

  const hours = parseOpeningHours(place)
  const hoursText = hours.length
    ? hours.map(h => `${h.day}: ${h.closed ? 'Cerrado' : `${h.open}–${h.close}`}`).join(', ')
    : ''

  const reviews = place.reviews?.slice(0, 5)
    .map(r => `- ${r.author_name} (${r.rating}★): "${r.text.slice(0, 120)}"`)
    .join('\n') ?? ''

  const placeAny = place as unknown as Record<string, unknown>
  const description = place.editorial_summary?.overview
    || placeAny.generative_summary as string
    || placeAny.review_summary as string
    || ''

  const servicesHint = servicesText
    || VERTICAL_SERVICES[vertical]
    || VERTICAL_SERVICES.generic

  const faqHint = VERTICAL_FAQ[vertical] || VERTICAL_FAQ.generic

  const toneDesc = tone === 'friendly'
    ? 'friendly and close (tuteo in Spanish, conversational, warm)'
    : 'professional and formal (usted in Spanish, serious, trustworthy)'

  const itemCount = density === 'full' ? '5–6' : '3–4'
  const faqCount  = density === 'full' ? '5'   : '4'

  return `You are a professional marketing copywriter for local businesses.
Generate website content for the business below. Return ONLY valid JSON — no markdown, no explanation.

BUSINESS DATA:
- Name: ${place.name}
- Type: ${vertical}${place.primary_type_display_name ? ` (${place.primary_type_display_name})` : ''}
- Address: ${place.formatted_address || ''}
- Phone: ${place.formatted_phone_number || ''}
- Rating: ${place.rating ? `${place.rating}/5 (${place.user_ratings_total || 0} reviews)` : 'N/A'}
- Price level: ${place.price_level ? '€'.repeat(place.price_level) : 'N/A'}
${description ? `- Description: ${description}` : ''}
${hoursText ? `- Hours: ${hoursText}` : ''}
${place.website ? `- Website: ${place.website}` : ''}

TYPICAL SERVICES FOR THIS BUSINESS TYPE: ${servicesHint}
${valueProp ? `\nKEY VALUE PROPOSITION (operator-provided): ${valueProp}` : ''}
${servicesText ? `\nSERVICES LIST (operator-provided): ${servicesText}` : ''}

REAL CUSTOMER REVIEWS:
${reviews || 'No reviews available'}

${extraContext ? `EXTRA CONTEXT (high priority — operator-provided):\n${extraContext}\n` : ''}
${menuText ? `MENU / SERVICES TEXT:\n${menuText}\n` : ''}
${enrichedData ? `ENRICHED DATA (AI-extracted from their website and Google):\n${enrichedData}\n` : ''}
${websiteContent ? `WEBSITE CONTENT (scraped):\n${websiteContent.slice(0, 3000)}\n` : ''}

WRITING RULES:
- Language: ${langName}
- Tone: ${toneDesc}
- Write specific copy about THIS business using real data from reviews and description
- Avoid generic clichés: "calidad inmejorable", "los mejores profesionales", "servicio de excelencia"
- Headlines: 6-10 words, benefit-focused, no buzzwords
- About: 2-3 engaging paragraphs separated by \\n\\n
- Services: infer ${itemCount} specific offerings (use typical services + reviews + description)
- DO NOT fabricate prices — use "" if unsure, or "Consultar" if typical for the vertical
- Features: ${itemCount} trust statements mixing data (rating, years, number) with quality claims
- FAQ: generate ${faqCount} questions real customers ask about ${faqHint}
- Lucide icon names for icons (use simple names: "scissors", "heart", "star", "check", "phone", "clock", "map-pin", "shield", "award", "users", "calendar", "truck", "home", "tool", "book", "coffee", "utensils", "activity")

RETURN EXACTLY THIS JSON STRUCTURE (no extra keys):
{
  "meta": {
    "title": "Business Name | Short benefit tagline (≤60 chars)",
    "description": "Meta description 150-160 chars, include location and main service",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "hero": {
    "headline": "6-10 word compelling headline",
    "subheadline": "1-2 sentence elevator pitch",
    "cta_text": "Single action text e.g. Reservar cita / Pedir presupuesto / Contactar"
  },
  "about": {
    "title": "Section heading in ${langName}",
    "content": "2-3 paragraphs separated by \\n\\n — specific story, team, history, values",
    "highlight": "Optional: 1 short key differentiator sentence or leave empty string"
  },
  "services": {
    "title": "Section heading in ${langName}",
    "items": [
      { "name": "Service name", "description": "1-2 sentence description", "price": "", "icon": "lucide-icon-name" }
    ]
  },
  "features": {
    "title": "Section heading e.g. Por qué elegirnos",
    "items": [
      { "icon": "lucide-icon-name", "title": "Short feature", "text": "1-2 sentence explanation" }
    ]
  },
  "faq": {
    "title": "Preguntas frecuentes",
    "items": [
      { "question": "Specific customer question?", "answer": "Clear 2-3 sentence answer specific to this business." }
    ]
  },
  "cta_section": {
    "headline": "Action-oriented 6-8 word headline",
    "subtext": "1 sentence supporting motivation",
    "button_text": "CTA button text"
  },
  "footer_tagline": "Short brand statement one line"
}`
}
