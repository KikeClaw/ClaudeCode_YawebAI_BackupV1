import type { GooglePlaceData, Vertical } from '@/types'
import { parseOpeningHours, getPhotoUrl } from '../google-places'
import type { StylePresetKey } from '../style-presets'
import { STYLE_PRESETS } from '../style-presets'

const UNSPLASH_FALLBACKS: Record<string, string[]> = {
  restaurant: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=1200&q=80',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80',
    'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&q=80',
  ],
  bar: [
    'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&q=80',
    'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=1200&q=80',
    'https://images.unsplash.com/photo-1470338745628-171cf53de3a8?w=1200&q=80',
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200&q=80',
    'https://images.unsplash.com/photo-1527761939622-933423085ae3?w=1200&q=80',
  ],
  salon: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&q=80',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&q=80',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=80',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1200&q=80',
  ],
  clinic: [
    'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200&q=80',
    'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&q=80',
    'https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&q=80',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=80',
  ],
  gym: [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&q=80',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&q=80',
    'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1200&q=80',
    'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1200&q=80',
  ],
  lawyer: [
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80',
    'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80',
    'https://images.unsplash.com/photo-1521791055366-0d553872952f?w=1200&q=80',
    'https://images.unsplash.com/photo-1575505586569-646b2ca898fc?w=1200&q=80',
    'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=1200&q=80',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
  ],
  pharmacy: [
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&q=80',
    'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=1200&q=80',
    'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1200&q=80',
    'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1200&q=80',
    'https://images.unsplash.com/photo-1563213126-a4273aed2016?w=1200&q=80',
  ],
  academy: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&q=80',
    'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&q=80',
    'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80',
    'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
  ],
  shop: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&q=80',
    'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1200&q=80',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&q=80',
    'https://images.unsplash.com/photo-1567958451986-2de427a4a0be?w=1200&q=80',
  ],
  workshop: [
    'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=1200&q=80',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1200&q=80',
    'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200&q=80',
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80',
  ],
  generic: [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
  ],
}

export function buildGenerationPrompt(place: GooglePlaceData, vertical: Vertical): string {
  const hours = parseOpeningHours(place)
  const reviews = place.reviews?.slice(0, 5).map(r =>
    `- ${r.author_name} (${r.rating}★): "${r.text.slice(0, 150)}"`
  ).join('\n') || 'No hay reseñas disponibles'

  const hoursText = hours.length
    ? hours.map(h => `${h.day}: ${h.closed ? 'Cerrado' : `${h.open} - ${h.close}`}`).join(', ')
    : 'No disponible'

  return `Eres un experto en marketing digital y copywriting para negocios locales.

Genera el contenido completo para el sitio web de este negocio en JSON. Responde ÚNICAMENTE con el JSON válido, sin explicaciones ni markdown.

DATOS DEL NEGOCIO:
- Nombre: ${place.name}
- Dirección: ${place.formatted_address}
- Teléfono: ${place.formatted_phone_number || 'No disponible'}
- Valoración: ${place.rating || 'N/A'} (${place.user_ratings_total || 0} reseñas)
- Descripción: ${place.editorial_summary?.overview || 'No disponible'}
- Horarios: ${hoursText}
- Tipo de negocio: ${vertical}
- Precio: ${place.price_level ? '€'.repeat(place.price_level) : 'No disponible'}

RESEÑAS REALES:
${reviews}

INSTRUCCIONES:
- Escribe en español, tono cercano y profesional
- El hero debe ser atractivo y llamativo, máximo 10 palabras en headline
- Genera contenido real y específico para este negocio, no genérico
- Para restaurantes/bares, incluye sección menu con categorías y platos típicos coherentes con el negocio
- Las reseñas del sitio deben ser las reales proporcionadas arriba
- El tema visual debe ser coherente con el tipo de negocio
- slug debe ser el nombre en minúsculas sin acentos ni espacios (usa guiones)

Genera el siguiente JSON completo:
{
  "meta": {
    "title": "Nombre del negocio | Descripción corta",
    "description": "Meta descripción SEO de 150 caracteres máx",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "lang": "es"
  },
  "hero": {
    "headline": "Frase de impacto del negocio",
    "subheadline": "Descripción atractiva en 1-2 frases",
    "cta_text": "Texto del botón principal",
    "cta_phone": "${place.formatted_phone_number || ''}"
  },
  "about": {
    "enabled": true,
    "title": "Quiénes somos",
    "text": "Descripción del negocio en 2-3 párrafos atractivos"
  },
  "services": {
    "enabled": true,
    "title": "Nuestros servicios",
    "items": [
      {"name": "Servicio 1", "description": "Descripción", "price": "Desde X€"},
      {"name": "Servicio 2", "description": "Descripción"}
    ]
  },
  ${vertical === 'restaurant' || vertical === 'bar' ? `"menu": {
    "enabled": true,
    "title": "Nuestra carta",
    "categories": [
      {
        "name": "Entrantes",
        "items": [{"name": "Plato típico", "description": "Descripción", "price": "X€"}]
      },
      {
        "name": "Platos principales",
        "items": [{"name": "Plato estrella", "description": "Descripción", "price": "X€"}]
      },
      {
        "name": "Postres",
        "items": [{"name": "Postre", "description": "Descripción", "price": "X€"}]
      }
    ]
  },` : '"menu": {"enabled": false, "title": "", "categories": []},'}
  "hours": {
    "enabled": ${hours.length > 0},
    "title": "Horarios",
    "schedule": ${JSON.stringify(hours.length ? hours : [])},
    "note": ""
  },
  "location": {
    "enabled": true,
    "title": "Dónde estamos",
    "address": "${place.formatted_address}",
    "city": "${place.formatted_address.split(',').slice(-2, -1)[0]?.trim() || ''}",
    "maps_url": "https://maps.google.com/?q=${encodeURIComponent(place.formatted_address)}",
    "lat": ${place.geometry?.location.lat || 0},
    "lng": ${place.geometry?.location.lng || 0}
  },
  "gallery": {
    "enabled": ${(place.photos?.length || 0) > 0},
    "title": "Galería",
    "images": []
  },
  "reviews": {
    "enabled": ${(place.reviews?.length || 0) > 0},
    "title": "Lo que dicen nuestros clientes",
    "rating": ${place.rating || 0},
    "total": ${place.user_ratings_total || 0},
    "items": ${JSON.stringify(place.reviews?.slice(0, 4).map(r => ({
      author: r.author_name,
      text: r.text.slice(0, 200),
      rating: r.rating,
      date: r.relative_time_description
    })) || [])}
  },
  "contact": {
    "enabled": true,
    "title": "Contacto",
    "phone": "${place.formatted_phone_number || ''}",
    "email": "",
    "whatsapp": "${place.formatted_phone_number?.replace(/\s/g, '') || ''}",
    "form_enabled": true
  },
  "social": {
    "enabled": false,
    "instagram": "",
    "facebook": "",
    "tiktok": ""
  },
  "theme": {
    "primary": "${getVerticalColor(vertical)}",
    "secondary": "#1a1a1a",
    "font": "Inter",
    "style": "${getVerticalStyle(vertical)}"
  },
  "vertical": "${vertical}",
  "business_name": "${place.name}"
}`
}

function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // Strip international dialing prefix (0044... → 44..., 0034... → 34...)
  const stripped = digits.startsWith('00') ? digits.slice(2) : digits
  if (stripped.length <= 9) return `34${stripped}` // Spanish local → prepend +34
  return stripped
}

function smartTruncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const cut = text.slice(0, maxLen)
  const lastEnd = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf('!'), cut.lastIndexOf('?'))
  if (lastEnd > maxLen * 0.65) return cut.slice(0, lastEnd + 1)
  return cut.trimEnd() + '…'
}

/**
 * Builds a structured attributes block from all the rich Places API (New) data.
 * Only includes attributes that are explicitly true — no nulls or false values.
 * The AI uses this to:
 *  - Add a "¿Qué ofrecemos?" / info section with real icons
 *  - Inform the FAQ (parking, payment, accessibility questions)
 *  - Set correct Schema.org properties (servesCuisine, hasMenu, etc.)
 */
function buildAttributesBlock(place: GooglePlaceData): string {
  const lines: string[] = []

  // Service options
  const serviceOpts = [
    place.dine_in         && 'Comer en el local',
    place.outdoor_seating && 'Terraza exterior',
    place.takeout         && 'Para llevar',
    place.delivery        && 'Servicio a domicilio',
    place.curbside_pickup && 'Recogida en puerta',
    place.reservable      && 'Acepta reservas',
    place.live_music      && 'Música en directo',
  ].filter(Boolean) as string[]
  if (serviceOpts.length) lines.push(`- Service options: ${serviceOpts.join(' · ')}`)

  // What's served
  const served = [
    place.serves_breakfast       && 'Desayunos',
    place.serves_brunch          && 'Brunch',
    place.serves_lunch           && 'Comidas',
    place.serves_dinner          && 'Cenas',
    place.serves_coffee          && 'Café de especialidad',
    place.serves_beer            && 'Cerveza',
    place.serves_wine            && 'Vinos',
    place.serves_cocktails       && 'Cócteles',
    place.serves_dessert         && 'Postres',
    place.serves_vegetarian_food && 'Opciones vegetarianas',
  ].filter(Boolean) as string[]
  if (served.length) lines.push(`- Serves: ${served.join(' · ')}`)

  // Amenities
  const amenities = [
    place.good_for_children       && 'Apto para niños',
    place.menu_for_children       && 'Menú infantil',
    place.good_for_groups         && 'Para grupos',
    place.good_for_watching_sports && 'Retransmisión deportes',
    place.allows_dogs             && 'Se admiten perros',
    place.restroom                && 'Aseos disponibles',
  ].filter(Boolean) as string[]
  if (amenities.length) lines.push(`- Amenities: ${amenities.join(' · ')}`)

  // Accessibility
  const access = [
    place.wheelchair_accessible_entrance && 'Entrada accesible en silla de ruedas',
    place.wheelchair_accessible_seating  && 'Asientos adaptados silla de ruedas',
    place.wheelchair_accessible_restroom && 'Aseos accesibles',
    place.wheelchair_accessible_parking  && 'Aparcamiento accesible',
  ].filter(Boolean) as string[]
  if (access.length) lines.push(`- Accessibility: ${access.join(' · ')}`)

  // Payment
  const payment = [
    place.accepts_credit_cards && 'Tarjetas de crédito',
    place.accepts_debit_cards  && 'Tarjetas de débito',
    place.accepts_nfc          && 'Pagos NFC / móvil',
    place.accepts_cash_only    && 'Solo efectivo',
  ].filter(Boolean) as string[]
  if (payment.length) lines.push(`- Payment: ${payment.join(' · ')}`)

  // Parking
  const parking = [
    place.free_parking_lot    && 'Aparcamiento gratuito',
    place.free_street_parking && 'Aparcamiento en calle gratuito',
    place.paid_parking_lot    && 'Aparcamiento de pago',
    place.valet_parking       && 'Servicio de valet',
    place.free_garage_parking && 'Garaje gratuito',
    place.paid_garage_parking && 'Garaje de pago',
  ].filter(Boolean) as string[]
  if (parking.length) lines.push(`- Parking: ${parking.join(' · ')}`)

  if (!lines.length) return ''

  // Build grouped chips for the visual "Características" section
  // Uses Lucide icon names — the platform auto-injects the Lucide CDN script.
  // Render each chip as: <span class="chip"><i data-lucide="ICON" style="width:14px;height:14px;flex-shrink:0"></i> LABEL</span>
  type Chip = { icon: string; label: string }
  const chipGroups: { heading: string; icon: string; chips: Chip[] }[] = []

  const svcChips = [
    place.dine_in         && { icon: 'utensils',  label: 'Comer en local' },
    place.outdoor_seating && { icon: 'sun',        label: 'Terraza' },
    place.takeout         && { icon: 'package',    label: 'Para llevar' },
    place.delivery        && { icon: 'truck',       label: 'A domicilio' },
    place.curbside_pickup && { icon: 'car',         label: 'Recogida en puerta' },
    place.reservable      && { icon: 'calendar',    label: 'Acepta reservas' },
    place.live_music      && { icon: 'music',       label: 'Música en directo' },
  ].filter(Boolean) as Chip[]
  if (svcChips.length) chipGroups.push({ heading: 'Servicio', icon: 'store', chips: svcChips })

  const servedChips = [
    place.serves_breakfast       && { icon: 'sunrise',      label: 'Desayunos' },
    place.serves_brunch          && { icon: 'coffee',       label: 'Brunch' },
    place.serves_lunch           && { icon: 'utensils',     label: 'Comidas' },
    place.serves_dinner          && { icon: 'moon',         label: 'Cenas' },
    place.serves_coffee          && { icon: 'coffee',       label: 'Café' },
    place.serves_beer            && { icon: 'beer',         label: 'Cerveza' },
    place.serves_wine            && { icon: 'wine',         label: 'Vinos' },
    place.serves_cocktails       && { icon: 'glass-water',  label: 'Cócteles' },
    place.serves_dessert         && { icon: 'cake-slice',   label: 'Postres' },
    place.serves_vegetarian_food && { icon: 'leaf',         label: 'Vegetariano' },
  ].filter(Boolean) as Chip[]
  if (servedChips.length) chipGroups.push({ heading: 'Qué ofrecemos', icon: 'utensils', chips: servedChips })

  const amenityChips = [
    place.good_for_children        && { icon: 'baby',          label: 'Apto para familias' },
    place.menu_for_children        && { icon: 'baby',          label: 'Menú infantil' },
    place.good_for_groups          && { icon: 'users',         label: 'Para grupos' },
    place.allows_dogs              && { icon: 'dog',           label: 'Se admiten perros' },
    place.restroom                 && { icon: 'door-open',     label: 'Aseos disponibles' },
    place.good_for_watching_sports && { icon: 'tv',            label: 'Retransmisión deportes' },
  ].filter(Boolean) as Chip[]
  if (amenityChips.length) chipGroups.push({ heading: 'Ambiente', icon: 'sparkles', chips: amenityChips })

  const accessChips = [
    place.wheelchair_accessible_entrance && { icon: 'accessibility', label: 'Entrada accesible' },
    place.wheelchair_accessible_seating  && { icon: 'armchair',      label: 'Asientos adaptados' },
    place.wheelchair_accessible_restroom && { icon: 'accessibility', label: 'Aseos accesibles' },
    place.wheelchair_accessible_parking  && { icon: 'square-parking',label: 'Parking accesible' },
  ].filter(Boolean) as Chip[]
  if (accessChips.length) chipGroups.push({ heading: 'Accesibilidad', icon: 'accessibility', chips: accessChips })

  const payChips = [
    place.accepts_credit_cards && { icon: 'credit-card', label: 'Tarjeta de crédito' },
    place.accepts_debit_cards  && { icon: 'credit-card', label: 'Tarjeta de débito' },
    place.accepts_nfc          && { icon: 'smartphone',  label: 'Pago con móvil / NFC' },
    place.accepts_cash_only    && { icon: 'banknote',    label: 'Solo efectivo' },
  ].filter(Boolean) as Chip[]
  if (payChips.length) chipGroups.push({ heading: 'Formas de pago', icon: 'credit-card', chips: payChips })

  const parkChips = [
    place.free_parking_lot    && { icon: 'square-parking', label: 'Aparcamiento gratuito' },
    place.free_street_parking && { icon: 'map-pin',         label: 'Calle gratuita' },
    place.paid_parking_lot    && { icon: 'square-parking', label: 'Aparcamiento de pago' },
    place.valet_parking       && { icon: 'car',             label: 'Servicio valet' },
    place.free_garage_parking && { icon: 'warehouse',       label: 'Garaje gratuito' },
    place.paid_garage_parking && { icon: 'warehouse',       label: 'Garaje de pago' },
  ].filter(Boolean) as Chip[]
  if (parkChips.length) chipGroups.push({ heading: 'Aparcamiento', icon: 'square-parking', chips: parkChips })

  const chipsInstruction = chipGroups.length
    ? `
CARACTERÍSTICAS SECTION — id="caracteristicas" — render as a clean, premium grid section:
Layout: light/contrast-bg section, heading "¿Qué encontrarás aquí?" (or vertical-appropriate variant), then ${chipGroups.length} category cards in a CSS grid — repeat(${Math.min(3, chipGroups.length)},1fr) on desktop (≥900px), repeat(2,1fr) on tablet (≥600px), 1fr on mobile — with justify-content:center so any partial last row is centered. Each card: white bg, border-radius:14px, padding:20px 22px, box-shadow:0 2px 14px rgba(0,0,0,.06), border:1px solid rgba(0,0,0,.06).
ICONS: The platform provides Lucide icon library. Use <i data-lucide="ICON_NAME" style="width:14px;height:14px;flex-shrink:0;display:inline-block;vertical-align:middle"></i> — do NOT use emojis.
Each category card: row of [<i data-lucide="CAT_ICON"> + ALL-CAPS label (11px, letter-spacing:.08em, opacity:.5)] as header, then chips below with margin-top:12px.
Chip style: inline-flex, align-items:center, gap:6px, border:1px solid currentColor at 15% opacity, border-radius:20px, padding:5px 12px, font-size:13px. Subtle hover bg-accent at 8%.
Groups, their Lucide category icon, and chips (icon | label):
${chipGroups.map(g => `  [${g.icon}] ${g.heading}: ${g.chips.map(c => `${c.icon}·${c.label}`).join(' | ')}`).join('\n')}
Place this section after "About" and before Services/Menu. Do NOT use a table — CSS grid chips only.`
    : ''

  return `
GOOGLE PLACES ATTRIBUTES:
${lines.join('\n')}
${chipsInstruction}
→ FAQ: use parking ("¿Dónde aparco?"), payment ("¿Qué formas de pago aceptáis?"), accessibility ("¿Es accesible para silla de ruedas?") as real FAQ questions with specific answers from the data above.
→ Schema.org: add amenityFeature, paymentAccepted, currenciesAccepted where applicable.
`
}

/** Best available description: generative AI > editorial > synthesised */
function buildBusinessDescription(place: GooglePlaceData, vertical: Vertical): string {
  // Google's AI-generated description is the richest — use it first
  if (place.generative_summary) return place.generative_summary
  if (place.editorial_summary?.overview) return place.editorial_summary.overview
  const parts: string[] = []
  if (place.rating && place.user_ratings_total && place.user_ratings_total > 10) {
    parts.push(`Valorado con ${place.rating}/5 por ${place.user_ratings_total} clientes en Google.`)
  }
  const zone = place.formatted_address.split(',').slice(-3, -1).join(',').trim()
  if (zone) parts.push(`Ubicado en ${zone}.`)
  if (place.price_level) {
    const lvl = ['económico', 'precio moderado', 'precio elevado', 'muy exclusivo'][place.price_level - 1]
    if (lvl) parts.push(`Establecimiento de ${lvl}.`)
  }
  return parts.join(' ') || `${place.name} — ${vertical} local.`
}

/** Per-vertical content instructions injected into the generation prompt */
function getVerticalContentGuidance(vertical: Vertical): string {
  const guidance: Partial<Record<Vertical, string>> = {
    lawyer: `- Replace "Servicios" heading with "Áreas de Práctica". List real practice areas (Derecho Penal, Civil, Laboral, Familia/Divorcios, Herencias, Inmobiliario, Mercantil, etc.) — infer from business name and context. Each card = one practice area + one sentence on case types handled. CTA throughout: "Primera consulta gratuita" or "Consulta sin compromiso". Include team credibility (years of experience, bar association colegiado number).`,
    clinic: `- Replace "Servicios" heading with "Especialidades" or "Tratamientos". Infer from name: dentista→Implantes/Ortodoncia/Blanqueamiento/Endodoncia; fisio→Fisioterapia/Pilates/Rehabilitación; estética→Bótox/Rellenos/Peeling/Láser. Each card = treatment + key benefit. Trust signals: "X años de experiencia", "Equipo colegiado", specific certifications. CTA: "Pedir cita" (resolved via phone/WhatsApp — no booking system).`,
    pharmacy: `- Services section = categories: Medicamentos con receta, Parafarmacia, Dermofarmacia, Nutrición y complementos, Ortopedia, Medición tensión/glucosa, Vacunas viaje. Opening hours MUST be very prominent — add a dedicated hours section with a clear visual layout. Seasonal health tip or promotion callout works well. Trust: "Farmacéutico titulado y colegiado", "X años al servicio del barrio".`,
    gym: `- Services section = training modalities (infer from context): Musculación, Clases dirigidas, Cycling, Yoga/Pilates, Crossfit, Funcional, Boxeo. Class schedule or timetable section if hours are available. Membership pricing tiers (mensual/trimestral/anual). Transformation testimonials are critical social proof — make them prominent.`,
    hotel: `- Services section = room types (Estándar, Superior, Suite, etc.) with brief features. Amenities grid: WiFi, Parking, Desayuno, Piscina, Spa, etc. Location lifestyle section (nearby attractions, transport links). Pricing "desde X€/noche" if inferable. CTA: "Consultar disponibilidad" via phone/email.`,
    restaurant: `- If no menu provided: Services section = cuisine highlights or signature dishes (infer from vertical and name). Featured "Plato estrella" or "Menú del día" callout is high-converting. About section: story, chef's philosophy, local/seasonal sourcing. Reservation CTA via phone only: "Llama para reservar mesa".`,
    bar: `- Highlight cocktails, beer selection, or wine list as key differentiators. Tapas/snacks section if applicable. "After-work" or nightlife positioning. Live music or events callout if context suggests it. Hours section especially important — highlight weekend/late-night schedule.`,
    salon: `- Services section = treatment categories: Corte y peinado, Coloración y mechas (balayage/highlights/ombré), Tratamientos capilares (queratina/keratina/botox capilar), Manicura/Pedicura, Depilación, Maquillaje/Micropigmentación. Show prices per category. Portfolio language in gallery: "Nuestros trabajos" with before/after framing. Trust: "X años de experiencia", specific techniques mastered, brand partners (Wella/L'Oréal/Schwarzkopf if inferable). CTA: "Reservar cita" via WhatsApp — most salons take appointments this way. Emphasize exclusivity: "Solo con cita previa".`,
    shop: `- Services section = main product categories (infer from business name/context). 2-3 featured or bestselling products/lines as hero items with a brief description and price range. Badge callouts work well: "NOVEDAD", "MÁS VENDIDO", "EDICIÓN LIMITADA". Policy trust signals: "Devolución fácil", "Envío mismo día", "Pago seguro". About section: local roots, artisanal or curated sourcing if applicable, "desde YYYY en el barrio". CTA: "Visítanos en tienda" or "Escríbenos para disponibilidad" — no online checkout.`,
    academy: `- Services section = course/program catalog: 4-6 courses with duration, format (presencial/online/mixto), and a one-line outcome ("Al completar podrás..."). Certifications section: oficial, homologado, Fundae/SEPE bonificable if applicable. Social proof: alumni success stories or placement rates. Urgency callouts: "Próxima convocatoria: [mes]", "Plazas limitadas". CTA: "Solicitar información" or "Reservar plaza" via phone/WhatsApp. Methodology blurb in About: small groups, hands-on, experienced instructors.`,
    workshop: `- Services section = service types (infer from name/context): Diagnóstico, Reparación, Mantenimiento, Revisión ITV, Sustitución de piezas, Presupuesto sin compromiso. Add a 3-step process callout: "1. Llámanos → 2. Presupuesto gratis → 3. Trabajo garantizado". Trust signals: certifications (Bosch Car Service, brand official, colegio oficial if relevant), warranty statement ("Garantía X meses en mano de obra"), years operating, Google reviews praising reliability. If automotive/plumbing/electrical/locksmith: prominent "Urgencias 24h" callout with large phone number. Price transparency message: "Sin letra pequeña — presupuesto antes de empezar".`,
    generic: `- Adapt section names to match the business type inferred from name and context. Lead with the most compelling trust signals available (Google rating, years, certifications). Keep CTAs simple: phone or WhatsApp. About section: local roots, community connection, team expertise. Services section: list 4-6 core offerings with short descriptions. If nothing specific is known, default to professional, approachable, locally trusted positioning.`,
  }
  const faqHints: Partial<Record<Vertical, string[]>> = {
    workshop:  ['¿Dais presupuesto sin compromiso?', '¿Cuánto tarda una reparación?', '¿Trabajáis con todas las marcas de vehículos?', '¿Ofrecéis garantía en las reparaciones?', '¿Puedo traer el coche sin cita previa?'],
    lawyer:    ['¿La primera consulta es gratuita?', '¿Cómo son vuestros honorarios?', '¿Cuánto dura un proceso judicial?', '¿Trabajáis en toda España?', '¿Lleváis casos de urgencia?'],
    clinic:    ['¿Necesito cita previa?', '¿Aceptáis seguro médico?', '¿Cuánto tiempo dura la primera visita?', '¿Qué especialidades ofrecéis?', '¿Tenéis lista de espera?'],
    salon:     ['¿Necesito reservar cita?', '¿Cuánto dura el servicio de coloración?', '¿Qué marcas utilizáis?', '¿Tenéis lista de precios?', '¿Hacéis tratamientos capilares?'],
    gym:       ['¿Puedo probar antes de apuntarme?', '¿Tenéis clases dirigidas incluidas?', '¿Cuál es el horario de apertura?', '¿Ofrecéis entrenamiento personal?', '¿Se puede contratar por meses?'],
    academy:   ['¿Los cursos son presenciales u online?', '¿Las titulaciones son oficiales?', '¿Podéis bonificar el curso por la empresa?', '¿Cuándo empieza la próxima convocatoria?', '¿Qué nivel se requiere para acceder?'],
    restaurant:['¿Necesito reserva para cenar?', '¿Tenéis menú del día?', '¿Hacéis eventos privados o celebraciones?', '¿Tenéis opciones vegetarianas o sin gluten?', '¿Tenéis terraza o zona exterior?'],
    bar:       ['¿A qué hora abrís?', '¿Ponéis música en directo?', '¿Tenéis terraza?', '¿Hacéis reservas de grupo?', '¿Tenéis carta de cócteles?'],
    hotel:     ['¿A qué hora es el check-in y check-out?', '¿El desayuno está incluido?', '¿Tenéis parking?', '¿Admitís mascotas?', '¿Hay piscina o spa disponible?'],
    pharmacy:  ['¿Necesito receta para todos los medicamentos?', '¿Tenéis servicio de urgencias o guardia?', '¿Hacéis medición de tensión o glucosa?', '¿Vendéis productos de parafarmacia?', '¿Tenéis asesoramiento nutricional?'],
    shop:      ['¿Tenéis servicio de envío a domicilio?', '¿Cuál es la política de devoluciones?', '¿Aceptáis pago con tarjeta?', '¿Tenéis catálogo online?', '¿Hacéis pedidos especiales o encargos?'],
  }
  const hints = faqHints[vertical as Vertical]
  const faqGuidance = hints
    ? `\nFAQ QUESTIONS — use these specific questions (adapted to this business, not verbatim):\n${hints.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}\n`
    : ''
  const text = guidance[vertical]
  return text ? `\nCONTENT GUIDANCE for ${vertical} — follow these rules when writing copy and structuring sections:\n${text}${faqGuidance}` : faqGuidance
}

// ─── Design DNA System ───────────────────────────────────────────────────────
// 12 independent dimensions × their option counts:
// 20 fonts × 5 heroes × palettes × 5 cards × 3 headings × 4 about layouts
// × 4 bg temps × 3 spatial densities × 5 inversions × 4 nav × 4 buttons
// × 3 rhythms × 4 footers = ~100,000,000+ combos.
// Date.now() XOR'd into seed → every "Generate" click is genuinely unique.

function seededRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = Math.imul(s ^ (s >>> 15), 0x2c62f485) >>> 0
    s = Math.imul(s ^ (s >>> 13), 0x1a850bc1) >>> 0
    s ^= s >>> 16
    return (s >>> 0) / 0x100000000
  }
}

// Each entry: font faces + precise typographic metrics so the AI uses them correctly
const DNA_FONT_PAIRS = [
  { faces: 'Playfair Display (700,800) + Source Sans 3 (400,600)', h1: 'clamp(2.8rem,5vw,5.5rem)', h2: 'clamp(1.9rem,3vw,2.8rem)', hLH: '1.08', hLS: '-0.01em', bSize: '16px', bLH: '1.72', note: 'Use italic weight for taglines and accent words.' },
  { faces: 'DM Serif Display (400, italic available) + DM Sans (300,400)', h1: 'clamp(4rem,7vw,9rem)', h2: 'clamp(2.4rem,4vw,4rem)', hLH: '0.93', hLS: '-0.03em', bSize: '15px', bLH: '1.90', note: 'Enormous whitespace. Italic variant on taglines.' },
  { faces: 'Fraunces (800,900) + Nunito (400,500)', h1: 'clamp(2.8rem,5vw,5.5rem)', h2: 'clamp(2rem,3.2vw,3rem)', hLH: '1.05', hLS: '0em', bSize: '16px', bLH: '1.75', note: 'Organic curved warmth. Bold weight creates visual richness.' },
  { faces: 'Cormorant Garamond (600,700) + Inter (400)', h1: 'clamp(3.5rem,6vw,7rem)', h2: 'clamp(2.2rem,3.5vw,3.5rem)', hLH: '1.02', hLS: '-0.01em', bSize: '15px', bLH: '1.68', note: 'Ultra elegant. Pair with very thin accent lines.' },
  { faces: 'Outfit (800,900) + Plus Jakarta Sans (400,500)', h1: 'clamp(3rem,5.5vw,6.5rem)', h2: 'clamp(2rem,3.2vw,3rem)', hLH: '1.0', hLS: '-0.02em', bSize: '16px', bLH: '1.65', note: 'Geometric precision. Sharp corners suit this font.' },
  { faces: 'Lora (600,700) + Open Sans (400)', h1: 'clamp(2.6rem,4.5vw,5rem)', h2: 'clamp(1.8rem,3vw,2.6rem)', hLH: '1.12', hLS: '0em', bSize: '16px', bLH: '1.78', note: 'Warm classic serif. Use italic on key phrases for elegance.' },
  { faces: 'Bricolage Grotesque (600,700) + Manrope (400,500)', h1: 'clamp(3rem,5.5vw,6rem)', h2: 'clamp(2rem,3.2vw,3rem)', hLH: '1.03', hLS: '-0.02em', bSize: '16px', bLH: '1.70', note: 'Contemporary editorial. Variable font energy.' },
  { faces: 'Josefin Sans (600,700) + Raleway (300,400)', h1: 'clamp(3rem,5vw,6rem)', h2: 'clamp(1.9rem,3vw,2.8rem)', hLH: '1.05', hLS: '0.06em', bSize: '15px', bLH: '1.85', note: 'Art deco elegance. Wide tracking on headlines. All-caps H2 allowed.' },
  { faces: 'Syne (700,800) + Space Grotesk (400,500)', h1: 'clamp(3.2rem,6vw,7rem)', h2: 'clamp(2rem,3.5vw,3.2rem)', hLH: '0.98', hLS: '-0.025em', bSize: '16px', bLH: '1.68', note: 'Creative agency energy. Tight tracking, strong personality.' },
  { faces: 'Libre Baskerville (700) + Lato (300,400)', h1: 'clamp(2.5rem,4.5vw,5rem)', h2: 'clamp(1.8rem,3vw,2.6rem)', hLH: '1.15', hLS: '0em', bSize: '16px', bLH: '1.78', note: 'Trustworthy tradition. Strong serif gravitas.' },
  // ── 10 additional pairs for maximum variety ──────────────────────────────
  { faces: 'Cinzel (700,900) + Alegreya Sans (300,400)', h1: 'clamp(2.4rem,4.5vw,5rem)', h2: 'clamp(1.7rem,2.8vw,2.4rem)', hLH: '1.18', hLS: '0.04em', bSize: '16px', bLH: '1.80', note: 'Classical Roman gravitas. All-caps headlines feel monumental. Perfect for law firms, luxury, and heritage brands.' },
  { faces: 'Bebas Neue (400) + Mulish (300,400)', h1: 'clamp(4rem,8vw,10rem)', h2: 'clamp(2.2rem,4vw,4rem)', hLH: '0.90', hLS: '0.05em', bSize: '15px', bLH: '1.88', note: 'Condensed all-caps display. Massive scale contrast with delicate body text. Gym, workshop, bold retail.' },
  { faces: 'Abril Fatface (400) + Source Serif 4 (300,400)', h1: 'clamp(3.2rem,6vw,7.5rem)', h2: 'clamp(2rem,3.2vw,3rem)', hLH: '1.04', hLS: '-0.015em', bSize: '16px', bLH: '1.75', note: 'Editorial magazine drama. Extremely heavy display + refined serif body. High fashion, premium restaurant.' },
  { faces: 'Barlow Condensed (700,800) + Barlow (400,500)', h1: 'clamp(3.5rem,7vw,8.5rem)', h2: 'clamp(2rem,3.8vw,3.5rem)', hLH: '0.92', hLS: '0.01em', bSize: '16px', bLH: '1.65', note: 'Industrial condensed energy. Matching family gives visual unity. Gym, workshop, modern retail.' },
  { faces: 'Big Shoulders Display (800,900) + Work Sans (300,400)', h1: 'clamp(3.8rem,7.5vw,9.5rem)', h2: 'clamp(2.2rem,4vw,4rem)', hLH: '0.88', hLS: '0.02em', bSize: '15px', bLH: '1.82', note: 'Ultra-condensed industrial display. Powerful scale contrast. Bold, avant-garde personality.' },
  { faces: 'Spectral (700,800) + Nunito Sans (300,400)', h1: 'clamp(2.7rem,5vw,5.5rem)', h2: 'clamp(1.9rem,3vw,2.7rem)', hLH: '1.10', hLS: '-0.01em', bSize: '16px', bLH: '1.78', note: 'Refined editorial serif + humanist sans. Sophisticated literary feel. Lawyer, clinic, academy.' },
  { faces: 'Tenor Sans (400) + Source Sans 3 (300,400)', h1: 'clamp(3rem,5.5vw,6.5rem)', h2: 'clamp(1.9rem,3vw,2.8rem)', hLH: '1.08', hLS: '0.02em', bSize: '15px', bLH: '1.90', note: 'Geometric restrained elegance. Modernist Swiss feel. Salon, boutique hotel, pharmacy.' },
  { faces: 'Anton (400) + DM Sans (400,500)', h1: 'clamp(4.5rem,9vw,12rem)', h2: 'clamp(2.4rem,4vw,4rem)', hLH: '0.88', hLS: '0.01em', bSize: '16px', bLH: '1.65', note: 'Impact-level bold display. Maximum headline weight contrast. Add uppercase tracking 0.03em to H1.' },
  { faces: 'Zilla Slab (600,700) + Rubik (300,400)', h1: 'clamp(2.6rem,4.8vw,5.5rem)', h2: 'clamp(1.8rem,2.8vw,2.6rem)', hLH: '1.12', hLS: '-0.01em', bSize: '16px', bLH: '1.75', note: 'Approachable slab serif + geometric rounded body. Friendly and modern. Shop, academy, pharmacy.' },
  { faces: 'Playfair Display SC (400,700) + Spectral (300,400)', h1: 'clamp(2.8rem,5vw,5.5rem)', h2: 'clamp(1.9rem,3vw,2.8rem)', hLH: '1.06', hLS: '0.03em', bSize: '15px', bLH: '1.82', note: 'Small-caps serif display + refined serif body. Ultra-refined prestige. Lawyer, hotel, high-end restaurant.' },
] as const

const DNA_HERO_LAYOUTS = [
  'FULL-BLEED PHOTO: hero image as CSS background-image, full viewport height. Gradient overlay: linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.18) 60%). Headline centered white. Two CTAs (solid accent + white outline).',
  'SPLIT 60/40: left 60% = brand accent bg, white headline left-aligned, tagline, two CTAs (solid white + white outline). Right 40% = hero photo object-fit:cover full-height, no overlay. Hero wrapper: display:flex;min-height:100vh. Left column: display:flex;flex-direction:column;justify-content:center;padding:80px 72px. Mobile: flex-direction:column-reverse, photo 45vh height stacked above text, padding:48px 24px.',
  'MINIMAL CENTERED: white/off-white bg, NO hero photo (or tiny 180px circular image right-floated). Headline ENORMOUS line-height:0.92 letter-spacing:-0.03em. CTA = text link with "→", no filled button. Top padding: 130px.',
  'EDITORIAL LEFT: white bg. Headline hard left-aligned line-height:1.0. Hero photo fills right 42% full viewport height (no overlay, no gap). Below headline: thin 2px accent rule, tagline, CTA. Magazine-cover feel.',
  'DARK CINEMATIC: bg #0d0d0d. Hero photo at opacity:0.16 as bg-image. Centered headline warm-white. Accent color on 1 key headline word. ALL site sections dark (#0d0d0d / #111 / #161616 alternating). Zero light sections anywhere.',
] as const

const DNA_ACCENT_COLORS: Record<string, readonly string[]> = {
  restaurant: ['#c0392b','#d4631c','#7B3F00','#b5623c','#6B2737','#8B6914'],
  bar:        ['#8e44ad','#a84232','#d4af37','#1a1a2e','#6c2b6c','#c0392b'],
  salon:      ['#c471ed','#e91e8c','#9b59b6','#c19a6b','#a0522d','#d4a5a5'],
  clinic:     ['#2980b9','#16a085','#0d6efd','#2471a3','#1a7a6e','#5d6d7e'],
  gym:        ['#84cc16','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#22c55e'],
  lawyer:     ['#1e3a5f','#4a235a','#b8860b','#2c3e50','#5d4037','#1a252f'],
  hotel:      ['#b8860b','#8B4513','#2e4057','#1a535c','#8d6e63','#5d4e37'],
  pharmacy:   ['#0d9e6e','#16a085','#2980b9','#059669','#0d7a5f','#1e8449'],
  academy:    ['#27ae60','#f39c12','#2980b9','#e74c3c','#8e44ad','#d4ac0d'],
  shop:       ['#f39c12','#e74c3c','#27ae60','#2980b9','#9b59b6','#e67e22'],
  workshop:   ['#c0392b','#e67e22','#d35400','#2c3e50','#6e2a00','#7f8c8d'],
  generic:    ['#2563eb','#7c3aed','#059669','#dc2626','#d97706','#0891b2'],
}

const DNA_CARD_STYLES = [
  'ROUNDED: border-radius:20px, box-shadow:0 4px 28px rgba(0,0,0,0.07), white bg, no border.',
  'SHARP EDITORIAL: border-radius:0, 1px top border in var(--accent), very light bg tint (accent at 3%).',
  'LEFT-ACCENTED: border-radius:12px, 4px solid var(--accent) left border, accent bg at 5% opacity.',
  'NO CARDS — EDITORIAL LIST: items separated by 1px border-bottom, generous padding, pure typographic hierarchy. No boxes.',
  'BOLD OUTLINE: border:2px solid var(--accent), sharp corners, white bg, accent number/icon large and prominent.',
] as const

const DNA_HEADING_STYLES = [
  'OVERLINE: small uppercase label above H2 (11px, letter-spacing:0.18em, var(--accent) color), then main H2.',
  'UNDERRULE: large left-aligned H2, below it a short thick accent line (3px solid var(--accent), width:52px).',
  'CENTERED CLASSIC: centered H2, italic muted subtitle below, generous space above and below. Symmetrical rhythm.',
] as const

// NEW: How the "About / Nosotros" section is laid out structurally
const DNA_ABOUT_LAYOUTS = [
  'ABOUT — TWO-COLUMN: left 52% = heading + 2 paragraphs + 3 bullet USPs (accent checkmark ✓); right 48% = real business photo — use the SECOND available photo URL as <img src="URL" style="width:100%;height:440px;object-fit:cover;border-radius:12px;display:block"> OR as CSS background-image with background-size:cover;border-radius:12px;height:440px. NEVER leave this column as an empty colored div — it MUST show a real photo. Mobile: photo stacked above text.',
  'ABOUT — STATS STRIP: row of 3 bold key stats ("15+ Años" / "4.8★ Google" / "500+ Clientes") in large accent numbers above a centered paragraph (max-width:700px). Punchy and data-driven.',
  'ABOUT — EDITORIAL CENTERED: text centered max-width:700px. Large drop-cap first letter (font-size:3.5em, float:left, var(--accent), line-height:0.85). 2-3 paragraphs. Mid-section pull-quote (border-left:4px solid var(--accent), padding-left:20px, font-size:1.2em, italic).',
  'ABOUT — BRAND STATEMENT: full-width dark or accent-colored band, centered white headline (large), 1-2 sentences, CTA. Feels like a manifesto. Real photo in a 2-col row directly below this band.',
] as const

// NEW: Page background temperature — changes the entire site's mood
const DNA_BG_TEMPERATURES = [
  'PAGE BG: pure white #ffffff. Maximum contrast, clinical precision.',
  'PAGE BG: warm cream #fdf8f2. Organic warmth, welcoming. Card surfaces: #fff.',
  'PAGE BG: cool light grey #f3f5f7. Modern, neutral, professional. Cards: #ffffff.',
  'PAGE BG: very light accent tint — mix var(--accent) at 4% opacity with white. Subtle brand omnipresence throughout.',
] as const

// NEW: Spatial density — padding rhythm changes perceived personality
const DNA_SPATIAL_DENSITY = [
  'SPATIAL RHYTHM — AIRY: section padding 120px–140px top/bottom. Max-width 1060px centered. Every section breathes. Luxury feel.',
  'SPATIAL RHYTHM — BALANCED: section padding 80px–96px top/bottom. Max-width 1200px. Comfortable, standard.',
  'SPATIAL RHYTHM — VIBRANT: section padding 56px–72px top/bottom. Max-width 1320px. More content visible, energetic and packed.',
] as const

const DNA_INVERSION_OPTIONS = [
  'about',
  'servicios',
  'reseñas',
  'none',
  'none', // weighted 2× so majority of sites have no inverted section
] as const

// ─── NEW: Nav style — structural variety in the header ───────────────────────
const DNA_NAV_STYLES = [
  'NAV STYLE — TRANSPARENT HERO: nav starts transparent over hero (background:transparent, links white or semi-white), transitions to solid (var(--bg), box-shadow:0 2px 20px rgba(0,0,0,.08)) on scroll. JS: nav.addEventListener("scroll"…) or window scroll listener adds class "scrolled". This style REQUIRES the hero to be a full-bleed photo or dark bg.',
  'NAV STYLE — SOLID OPAQUE: nav always solid with background:var(--bg). Single 1px border-bottom:var(--border) OR subtle box-shadow. No transparency. Maximally readable at all times.',
  'NAV STYLE — MINIMAL BORDER: nav has no background fill (transparent always). Just a 1.5px bottom border in var(--border). Nav links use var(--text). Ultra-minimalist — works best on pure white/cream page bg.',
  'NAV STYLE — FROSTED GLASS: nav background:rgba(255,255,255,0.78) with backdrop-filter:blur(20px) saturate(150%) (-webkit-backdrop-filter too). Border-bottom:1px solid rgba(255,255,255,0.3). Premium macOS/iOS aesthetic.',
] as const

// ─── NEW: Button shape — instant personality differentiation ─────────────────
const DNA_BUTTON_SHAPES = [
  'BUTTON SHAPE — SQUARE: All primary CTA buttons: border-radius:3px. Secondary buttons: border-radius:3px. Editorial, high-fashion, luxury feel. Pair with wide letter-spacing on button text.',
  'BUTTON SHAPE — SLIGHT: All primary CTA buttons: border-radius:8px. Professional, versatile, SaaS-like. The neutral choice that works across all verticals.',
  'BUTTON SHAPE — ROUNDED: All primary CTA buttons: border-radius:14px. Friendly, modern, approachable. Good for consumer verticals (salon, gym, shop, restaurant).',
  'BUTTON SHAPE — PILL: All primary CTA buttons: border-radius:9999px. Add a 2px extra horizontal padding so text doesn\'t crowd the round edge. Energetic, playful, consumer brand feel. Works beautifully with bold font weights.',
] as const

// ─── NEW: Section rhythm — how visual separation between sections is handled ──
const DNA_SECTION_RHYTHMS = [
  'SECTION RHYTHM — ALTERNATING: Odd sections (1,3,5…) use var(--bg). Even sections (2,4,6…) use var(--surface) [slightly different shade]. Creates natural reading rhythm. NO extra separators — bg shift is enough.',
  'SECTION RHYTHM — ALL CLEAN: Every section uses var(--bg). Visual separation only via generous padding and section headings. ONE section (the CTA band or Reservar/Cita section) may use var(--accent) as background with white text — this is the single bold accent in an otherwise minimal layout.',
  'SECTION RHYTHM — DEEP CONTRAST: Two mid-page sections use a very dark background (#0f0f0f or deep brand-dark color) with white/light text and white icon fills. All other sections use var(--bg). Creates dramatic visual anchors that break the flow intentionally.',
] as const

// ─── NEW: Footer style — structural variety in the closing section ───────────
const DNA_FOOTER_STYLES = [
  'FOOTER STYLE — MINIMAL 2-COL: Dark background (#111 or var(--accent) darkened 60%). Left col: logo + tagline + social icon row. Right col: two inline nav link groups. Slim bottom bar: copyright + Aviso Legal link only. Maximum padding 40px 0.',
  'FOOTER STYLE — RICH 4-COL: Dark bg (#0f172a or similar). Col1: logo + tagline + 2-sentence brand blurb. Col2: "Páginas" — main nav links. Col3: "Servicios" or "Horarios" links. Col4: contact block (address, phone, email as 2-col CSS grid). Bottom bar: copyright · Aviso Legal · Privacidad · Cookies.',
  'FOOTER STYLE — CENTERED EDITORIAL: Dark or very deep accent bg. ALL content centered: large logo, tagline, 5 inline nav links (gap:32px), then social icons. Bottom: copyright + yaweb.ai credit. Wide breathing room. Boutique/minimalist feel.',
  'FOOTER STYLE — GRADIENT STATEMENT: Footer background: linear-gradient(135deg, #06060a 0%, [var(--accent) darkened 40%] 100%). White text. Brand logo large (40px). Below logo: 3-col layout (nav, contact info, social). Top accent strip: 3px solid var(--accent). Bottom: thin muted copyright line.',
] as const

// ─── NEW: Full color palettes — complete brand-appropriate color stories ──────
// Each palette sets: accent, bg, surface, text, muted, border + dark variants
// The AI receives exact hex values → no placeholder interpretation needed.

interface DnaPalette {
  name: string
  accent: string
  accentFg: string
  bg: string
  surface: string
  text: string
  muted: string
  border: string
  darkBg: string
  darkSurface: string
  darkAccent: string
}

const DNA_FULL_PALETTES: Record<string, DnaPalette[]> = {
  restaurant: [
    { name: 'Terracotta Warm', accent: '#c55a30', accentFg: '#fff', bg: '#fdfaf5', surface: '#ffffff', text: '#1c1007', muted: '#7a6550', border: '#edddc7', darkBg: '#130d07', darkSurface: '#1e1408', darkAccent: '#e07a50' },
    { name: 'Mediterranean Teal', accent: '#0d7a72', accentFg: '#fff', bg: '#f5faf9', surface: '#ffffff', text: '#07201e', muted: '#4a6e6b', border: '#c2dbd9', darkBg: '#071513', darkSurface: '#0e1f1e', darkAccent: '#2aada3' },
    { name: 'Burgundy Classic', accent: '#8b1a38', accentFg: '#fff', bg: '#fef9f7', surface: '#ffffff', text: '#1a0a0e', muted: '#7a5060', border: '#f0d0d8', darkBg: '#0e0507', darkSurface: '#1a0910', darkAccent: '#c44065' },
    { name: 'Forest Bistro', accent: '#3a6b3a', accentFg: '#fff', bg: '#f7fbf5', surface: '#ffffff', text: '#0e1a0e', muted: '#4d6b4d', border: '#c5dcc5', darkBg: '#060e06', darkSurface: '#0e190e', darkAccent: '#5a9b5a' },
    { name: 'Slate Brasserie', accent: '#3b4fd4', accentFg: '#fff', bg: '#f9faff', surface: '#ffffff', text: '#0f111f', muted: '#5a6080', border: '#d0d4f0', darkBg: '#06070f', darkSurface: '#0d0e1c', darkAccent: '#6e7ef0' },
    { name: 'Saffron Market', accent: '#c07a10', accentFg: '#fff', bg: '#fdf8ef', surface: '#ffffff', text: '#1a1004', muted: '#7a6020', border: '#f0d8a8', darkBg: '#0c0803', darkSurface: '#1a1205', darkAccent: '#e8a030' },
  ],
  bar: [
    { name: 'Dark Amber', accent: '#d4870c', accentFg: '#fff', bg: '#0c0806', surface: '#1a1208', text: '#f5ead5', muted: '#9c8060', border: '#2e1e08', darkBg: '#080503', darkSurface: '#110e05', darkAccent: '#e8a030' },
    { name: 'Neon Violet', accent: '#9b3dfc', accentFg: '#fff', bg: '#08060f', surface: '#14101e', text: '#f0ecfc', muted: '#7060a0', border: '#2a1e40', darkBg: '#04030a', darkSurface: '#0c0918', darkAccent: '#b870fc' },
    { name: 'Copper Speakeasy', accent: '#b5622a', accentFg: '#fff', bg: '#faf4ee', surface: '#ffffff', text: '#1c0e06', muted: '#7a5030', border: '#e8ccb0', darkBg: '#0c0603', darkSurface: '#180e06', darkAccent: '#d4804c' },
    { name: 'Deep Navy', accent: '#2040b8', accentFg: '#fff', bg: '#f2f4fb', surface: '#ffffff', text: '#0a0f2a', muted: '#4058a0', border: '#c0caf0', darkBg: '#04060f', darkSurface: '#080d1e', darkAccent: '#4868e0' },
    { name: 'Crimson Club', accent: '#c01835', accentFg: '#fff', bg: '#fdf8f9', surface: '#ffffff', text: '#1a0408', muted: '#804050', border: '#f0ccd4', darkBg: '#0a0203', darkSurface: '#160508', darkAccent: '#e04060' },
    { name: 'Absinthe Green', accent: '#4a7c3f', accentFg: '#fff', bg: '#f4f9f3', surface: '#ffffff', text: '#0e1a0c', muted: '#4a6840', border: '#c0d8bc', darkBg: '#050c04', darkSurface: '#0a150a', darkAccent: '#6aac5e' },
  ],
  salon: [
    { name: 'Rose Champagne', accent: '#c44a8a', accentFg: '#fff', bg: '#fdf8fb', surface: '#ffffff', text: '#1c0814', muted: '#8a5070', border: '#f0cce0', darkBg: '#0c040a', darkSurface: '#180910', darkAccent: '#e070b0' },
    { name: 'Sand & Gold', accent: '#b8872a', accentFg: '#fff', bg: '#fdf8ef', surface: '#ffffff', text: '#1a1004', muted: '#7a6028', border: '#eddcb0', darkBg: '#0c0803', darkSurface: '#1a1005', darkAccent: '#d4aa50' },
    { name: 'Mauve Soft', accent: '#7a4a9b', accentFg: '#fff', bg: '#faf7fc', surface: '#ffffff', text: '#14061e', muted: '#705a88', border: '#dcc8f0', darkBg: '#080410', darkSurface: '#100818', darkAccent: '#a870cc' },
    { name: 'Minimal Ivory', accent: '#5a5a5a', accentFg: '#fff', bg: '#fdfcfa', surface: '#ffffff', text: '#1a1a1a', muted: '#8a8a8a', border: '#e8e4dc', darkBg: '#0c0c0a', darkSurface: '#1a1a18', darkAccent: '#9a9a9a' },
    { name: 'Coral Glow', accent: '#e04a40', accentFg: '#fff', bg: '#fff9f8', surface: '#ffffff', text: '#1a0806', muted: '#8a5048', border: '#f0ccc8', darkBg: '#0a0403', darkSurface: '#180807', darkAccent: '#f07068' },
    { name: 'Blush Nude', accent: '#c49a80', accentFg: '#fff', bg: '#fef9f6', surface: '#ffffff', text: '#1a120c', muted: '#8a7060', border: '#f0ddd0', darkBg: '#0c0904', darkSurface: '#1a1208', darkAccent: '#d8b898' },
  ],
  clinic: [
    { name: 'Medical Blue', accent: '#0d6efd', accentFg: '#fff', bg: '#f0f6ff', surface: '#ffffff', text: '#04142a', muted: '#4a6a9a', border: '#c4daf8', darkBg: '#030810', darkSurface: '#060f1c', darkAccent: '#4090ff' },
    { name: 'Health Teal', accent: '#0d9488', accentFg: '#fff', bg: '#f0fdf9', surface: '#ffffff', text: '#04201e', muted: '#3a7070', border: '#b0e8e0', darkBg: '#030c0b', darkSurface: '#06161a', darkAccent: '#2dbab0' },
    { name: 'Dental White', accent: '#2560e0', accentFg: '#fff', bg: '#f8fbff', surface: '#ffffff', text: '#0a1020', muted: '#4a60a0', border: '#d0e0fa', darkBg: '#040608', darkSurface: '#080e18', darkAccent: '#5080f0' },
    { name: 'Soft Green', accent: '#1e8b5e', accentFg: '#fff', bg: '#f4fbf7', surface: '#ffffff', text: '#061410', muted: '#3a6a50', border: '#b8e8d0', darkBg: '#030a06', darkSurface: '#06130c', darkAccent: '#30b080' },
    { name: 'Calm Lavender', accent: '#5a4adc', accentFg: '#fff', bg: '#f7f5ff', surface: '#ffffff', text: '#0e0a20', muted: '#5a5090', border: '#d4ccf8', darkBg: '#060410', darkSurface: '#0c0a1a', darkAccent: '#8070f0' },
    { name: 'Trust Indigo', accent: '#3730a3', accentFg: '#fff', bg: '#f5f5ff', surface: '#ffffff', text: '#0a0820', muted: '#4a4880', border: '#d0d0f8', darkBg: '#04040f', darkSurface: '#08081a', darkAccent: '#6060d0' },
  ],
  gym: [
    { name: 'Power Orange', accent: '#e85a04', accentFg: '#fff', bg: '#fff8f5', surface: '#ffffff', text: '#200800', muted: '#8a4020', border: '#f8d0bc', darkBg: '#0c0400', darkSurface: '#1a0800', darkAccent: '#ff7830' },
    { name: 'Electric Lime', accent: '#84cc16', accentFg: '#111', bg: '#f8fef0', surface: '#ffffff', text: '#0e1a04', muted: '#507020', border: '#d4f0a0', darkBg: '#050c02', darkSurface: '#0a1504', darkAccent: '#a8e840' },
    { name: 'Neon Cyan', accent: '#06b6d4', accentFg: '#fff', bg: '#f0fcff', surface: '#ffffff', text: '#040e14', muted: '#306880', border: '#a8e8f8', darkBg: '#02060a', darkSurface: '#04100e', darkAccent: '#30d8f0' },
    { name: 'Aggressive Red', accent: '#dc2626', accentFg: '#fff', bg: '#fff5f5', surface: '#ffffff', text: '#1a0404', muted: '#804040', border: '#fcc8c8', darkBg: '#0a0202', darkSurface: '#180404', darkAccent: '#f05050' },
    { name: 'Dark Steel', accent: '#6b7280', accentFg: '#fff', bg: '#f3f4f6', surface: '#ffffff', text: '#111827', muted: '#6b7280', border: '#e5e7eb', darkBg: '#030408', darkSurface: '#0d1117', darkAccent: '#9ca3af' },
    { name: 'Violet Power', accent: '#7c3aed', accentFg: '#fff', bg: '#f8f5ff', surface: '#ffffff', text: '#0e0820', muted: '#5a4090', border: '#d8c8f8', darkBg: '#060410', darkSurface: '#0e0818', darkAccent: '#a868ff' },
  ],
  lawyer: [
    { name: 'Navy Authority', accent: '#1e3a5f', accentFg: '#fff', bg: '#f4f7fb', surface: '#ffffff', text: '#080e1a', muted: '#4a6080', border: '#c8d8ec', darkBg: '#030610', darkSurface: '#060b18', darkAccent: '#3a6098' },
    { name: 'Dark Gold', accent: '#b8860b', accentFg: '#fff', bg: '#fdfaf4', surface: '#ffffff', text: '#1a1404', muted: '#7a6020', border: '#edd8a0', darkBg: '#0a0803', darkSurface: '#161005', darkAccent: '#d4a830' },
    { name: 'Charcoal Pro', accent: '#374151', accentFg: '#fff', bg: '#f9fafb', surface: '#ffffff', text: '#111827', muted: '#6b7280', border: '#e5e7eb', darkBg: '#030406', darkSurface: '#0c0d12', darkAccent: '#6b7280' },
    { name: 'Midnight Plum', accent: '#4a235a', accentFg: '#fff', bg: '#faf5fc', surface: '#ffffff', text: '#180a1e', muted: '#6a4078', border: '#dcc0e8', darkBg: '#0c050e', darkSurface: '#180a1e', darkAccent: '#8040a0' },
    { name: 'Forest Law', accent: '#2d5a27', accentFg: '#fff', bg: '#f5faf4', surface: '#ffffff', text: '#0a1408', muted: '#3a5a35', border: '#c0dab8', darkBg: '#040a03', darkSurface: '#080e06', darkAccent: '#4a8a42' },
    { name: 'Deep Burgundy', accent: '#7b1d2e', accentFg: '#fff', bg: '#fdf8f9', surface: '#ffffff', text: '#1a0408', muted: '#6a3040', border: '#f0c8d0', darkBg: '#0a0204', darkSurface: '#160508', darkAccent: '#b03050' },
  ],
  hotel: [
    { name: 'Warm Gold', accent: '#b8972c', accentFg: '#fff', bg: '#fdfaf4', surface: '#ffffff', text: '#1a1408', muted: '#7a7030', border: '#eddcac', darkBg: '#0a0804', darkSurface: '#161106', darkAccent: '#d4b848' },
    { name: 'Ocean Resort', accent: '#0d6b8b', accentFg: '#fff', bg: '#f0f9fc', surface: '#ffffff', text: '#040e14', muted: '#3a6478', border: '#b8dce8', darkBg: '#03070a', darkSurface: '#060e14', darkAccent: '#2090b8' },
    { name: 'Slate Boutique', accent: '#5d4e6d', accentFg: '#fff', bg: '#faf8fb', surface: '#ffffff', text: '#140e1a', muted: '#6a5878', border: '#dcd0e8', darkBg: '#09060c', darkSurface: '#120d18', darkAccent: '#8a78a8' },
    { name: 'Ivory Luxury', accent: '#8b6914', accentFg: '#fff', bg: '#fefcf5', surface: '#ffffff', text: '#1a1604', muted: '#7a6828', border: '#f0e0bc', darkBg: '#0c0a03', darkSurface: '#1a1507', darkAccent: '#c09030' },
    { name: 'Alpine Slate', accent: '#374b5f', accentFg: '#fff', bg: '#f4f7fa', surface: '#ffffff', text: '#0a1018', muted: '#4a6070', border: '#c8d4e0', darkBg: '#04060a', darkSurface: '#090e14', darkAccent: '#5a7898' },
    { name: 'Rose Terrace', accent: '#9b4a5a', accentFg: '#fff', bg: '#fdf8f9', surface: '#ffffff', text: '#1a0a0e', muted: '#7a5060', border: '#f0d0d8', darkBg: '#0e0507', darkSurface: '#1a0910', darkAccent: '#c47080' },
  ],
  pharmacy: [
    { name: 'Pharmacy Green', accent: '#0d9e6e', accentFg: '#fff', bg: '#f0fdf9', surface: '#ffffff', text: '#041810', muted: '#3a7058', border: '#a8e8d0', darkBg: '#030c07', darkSurface: '#06160d', darkAccent: '#2abf90' },
    { name: 'Medical Teal', accent: '#0d7eb5', accentFg: '#fff', bg: '#f0f8fc', surface: '#ffffff', text: '#041018', muted: '#3a7090', border: '#b0daf0', darkBg: '#02070c', darkSurface: '#040d16', darkAccent: '#28a0d8' },
    { name: 'Health Mint', accent: '#059669', accentFg: '#fff', bg: '#f4fdf8', surface: '#ffffff', text: '#04100e', muted: '#306855', border: '#b0ead4', darkBg: '#020806', darkSurface: '#04100d', darkAccent: '#20b880' },
    { name: 'Trust Blue', accent: '#2563eb', accentFg: '#fff', bg: '#f0f4ff', surface: '#ffffff', text: '#04081a', muted: '#3a5a9a', border: '#c4d4f8', darkBg: '#02040c', darkSurface: '#04081a', darkAccent: '#4878f8' },
    { name: 'Sage Natural', accent: '#4d7c5a', accentFg: '#fff', bg: '#f4f9f5', surface: '#ffffff', text: '#0a140c', muted: '#4a6a50', border: '#c0d8c4', darkBg: '#040806', darkSurface: '#08100a', darkAccent: '#6da070' },
    { name: 'Clean Cobalt', accent: '#1d4ed8', accentFg: '#fff', bg: '#eff6ff', surface: '#ffffff', text: '#03091c', muted: '#3060a0', border: '#bdd0f8', darkBg: '#020408', darkSurface: '#030a18', darkAccent: '#4070f0' },
  ],
  academy: [
    { name: 'Academic Blue', accent: '#2563eb', accentFg: '#fff', bg: '#f0f4ff', surface: '#ffffff', text: '#04081a', muted: '#3a5a9a', border: '#c4d4f8', darkBg: '#02040c', darkSurface: '#04081a', darkAccent: '#4878f8' },
    { name: 'Vibrant Teal', accent: '#0d9488', accentFg: '#fff', bg: '#f0fdf9', surface: '#ffffff', text: '#04201e', muted: '#3a7070', border: '#b0e8e0', darkBg: '#030c0b', darkSurface: '#06161a', darkAccent: '#2dbab0' },
    { name: 'Campus Red', accent: '#dc2626', accentFg: '#fff', bg: '#fff5f5', surface: '#ffffff', text: '#1a0404', muted: '#804040', border: '#fcc8c8', darkBg: '#0a0202', darkSurface: '#180404', darkAccent: '#f05050' },
    { name: 'Innovation Purple', accent: '#7c3aed', accentFg: '#fff', bg: '#f7f4ff', surface: '#ffffff', text: '#0e0820', muted: '#5a4090', border: '#d8c8f8', darkBg: '#060410', darkSurface: '#0e0818', darkAccent: '#a868ff' },
    { name: 'Emerald Growth', accent: '#059669', accentFg: '#fff', bg: '#f4fdf8', surface: '#ffffff', text: '#04100e', muted: '#306855', border: '#b0ead4', darkBg: '#020806', darkSurface: '#04100d', darkAccent: '#20b880' },
    { name: 'Warm Amber', accent: '#d97706', accentFg: '#fff', bg: '#fdf9f0', surface: '#ffffff', text: '#1a1004', muted: '#7a6020', border: '#f0d8a8', darkBg: '#0c0803', darkSurface: '#1a1205', darkAccent: '#f0a020' },
  ],
  shop: [
    { name: 'Bold Coral', accent: '#e8522a', accentFg: '#fff', bg: '#fff8f5', surface: '#ffffff', text: '#200a04', muted: '#904030', border: '#f8ccbc', darkBg: '#0c0402', darkSurface: '#1a0804', darkAccent: '#f07050' },
    { name: 'Indigo Store', accent: '#4338ca', accentFg: '#fff', bg: '#f5f4ff', surface: '#ffffff', text: '#0c0a20', muted: '#4a44a0', border: '#d0ccf8', darkBg: '#06040e', darkSurface: '#0c0a18', darkAccent: '#7068f8' },
    { name: 'Warm Market', accent: '#d97706', accentFg: '#fff', bg: '#fdf9f0', surface: '#ffffff', text: '#1a1004', muted: '#7a6020', border: '#f0d8a8', darkBg: '#0c0803', darkSurface: '#1a1205', darkAccent: '#f0a020' },
    { name: 'Modern Slate', accent: '#0f172a', accentFg: '#fff', bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', darkBg: '#050609', darkSurface: '#0f172a', darkAccent: '#4a6080' },
    { name: 'Fresh Green', accent: '#16a34a', accentFg: '#fff', bg: '#f4fdf7', surface: '#ffffff', text: '#04100a', muted: '#306840', border: '#b0eac0', darkBg: '#020806', darkSurface: '#041008', darkAccent: '#30c860' },
    { name: 'Vivid Rose', accent: '#e11d48', accentFg: '#fff', bg: '#fff5f7', surface: '#ffffff', text: '#1a0308', muted: '#804050', border: '#fcc4cc', darkBg: '#0a0204', darkSurface: '#180407', darkAccent: '#f84070' },
  ],
  workshop: [
    { name: 'Industrial Orange', accent: '#c0392b', accentFg: '#fff', bg: '#fff8f6', surface: '#ffffff', text: '#200606', muted: '#804040', border: '#f8ccc8', darkBg: '#0c0303', darkSurface: '#1a0606', darkAccent: '#e05848' },
    { name: 'Steel Dark', accent: '#e67e22', accentFg: '#fff', bg: '#fdf9f4', surface: '#ffffff', text: '#1a1004', muted: '#7a5020', border: '#f0d8b8', darkBg: '#0c0803', darkSurface: '#1a1006', darkAccent: '#f0a040' },
    { name: 'Charcoal Work', accent: '#2c3e50', accentFg: '#fff', bg: '#f4f6f8', surface: '#ffffff', text: '#0c1018', muted: '#4a6070', border: '#c8d4dc', darkBg: '#060809', darkSurface: '#0c1018', darkAccent: '#4a7090' },
    { name: 'Safety Yellow', accent: '#ca8a04', accentFg: '#fff', bg: '#fdfcf0', surface: '#ffffff', text: '#1a1604', muted: '#7a7020', border: '#f0e8a0', darkBg: '#0c0a02', darkSurface: '#1a1604', darkAccent: '#e0b020' },
    { name: 'Bold Red', accent: '#d35400', accentFg: '#fff', bg: '#fff6f2', surface: '#ffffff', text: '#1a0800', muted: '#804020', border: '#f8d0b8', darkBg: '#0c0400', darkSurface: '#1a0800', darkAccent: '#f07040' },
    { name: 'Electric Blue', accent: '#1d4ed8', accentFg: '#fff', bg: '#eff6ff', surface: '#ffffff', text: '#03091c', muted: '#3060a0', border: '#bdd0f8', darkBg: '#020408', darkSurface: '#030a18', darkAccent: '#4070f0' },
  ],
  generic: [
    { name: 'Indigo Pro', accent: '#2563eb', accentFg: '#fff', bg: '#f0f4ff', surface: '#ffffff', text: '#04081a', muted: '#3a5a9a', border: '#c4d4f8', darkBg: '#02040c', darkSurface: '#04081a', darkAccent: '#4878f8' },
    { name: 'Violet Modern', accent: '#7c3aed', accentFg: '#fff', bg: '#f7f4ff', surface: '#ffffff', text: '#0e0820', muted: '#5a4090', border: '#d8c8f8', darkBg: '#060410', darkSurface: '#0e0818', darkAccent: '#a868ff' },
    { name: 'Teal Fresh', accent: '#0d9488', accentFg: '#fff', bg: '#f0fdf9', surface: '#ffffff', text: '#04201e', muted: '#3a7070', border: '#b0e8e0', darkBg: '#030c0b', darkSurface: '#06161a', darkAccent: '#2dbab0' },
    { name: 'Warm Amber', accent: '#d97706', accentFg: '#fff', bg: '#fdf9f0', surface: '#ffffff', text: '#1a1004', muted: '#7a6020', border: '#f0d8a8', darkBg: '#0c0803', darkSurface: '#1a1205', darkAccent: '#f0a020' },
    { name: 'Slate Business', accent: '#475569', accentFg: '#fff', bg: '#f8fafc', surface: '#ffffff', text: '#0f172a', muted: '#64748b', border: '#e2e8f0', darkBg: '#030406', darkSurface: '#0f172a', darkAccent: '#748aa0' },
    { name: 'Coral Energy', accent: '#f43f5e', accentFg: '#fff', bg: '#fff5f7', surface: '#ffffff', text: '#1a040a', muted: '#80405a', border: '#fcc4cc', darkBg: '#0a0204', darkSurface: '#180407', darkAccent: '#f87090' },
  ],
}

function buildDesignDNA(placeName: string, variant: string, vertical: Vertical, hasPaletteOverride: boolean): string {
  // XOR name hash with live timestamp → every generation is unique
  let nameHash = 5381
  for (let i = 0; i < placeName.length; i++) nameHash = ((nameHash << 5) + nameHash + placeName.charCodeAt(i)) >>> 0
  const seed = (nameHash ^ (Date.now() & 0xffffffff) ^ (variant === 'B' ? 0xb00b5 : 0x13370)) >>> 0
  const rng = seededRng(seed)
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)]

  const font            = pick(DNA_FONT_PAIRS)
  const heroLayout      = pick(DNA_HERO_LAYOUTS)
  const cardStyle       = pick(DNA_CARD_STYLES)
  const headingStyle    = pick(DNA_HEADING_STYLES)
  const aboutLayout     = pick(DNA_ABOUT_LAYOUTS)
  const bgTemp          = pick(DNA_BG_TEMPERATURES)
  const spatial         = pick(DNA_SPATIAL_DENSITY)
  const invertedSection = pick(DNA_INVERSION_OPTIONS)
  // New dimensions
  const navStyle        = pick(DNA_NAV_STYLES)
  const buttonShape     = pick(DNA_BUTTON_SHAPES)
  const sectionRhythm   = pick(DNA_SECTION_RHYTHMS)
  const footerStyle     = pick(DNA_FOOTER_STYLES)
  // Full palette (used when no operator override)
  const palettePick = hasPaletteOverride
    ? null
    : pick(DNA_FULL_PALETTES[vertical] ?? DNA_FULL_PALETTES.generic)

  const colorLine = palettePick
    ? `• COLOR PALETTE "${palettePick.name}": Set EXACTLY these CSS custom properties in :root —
  --accent:${palettePick.accent}; --accent-fg:${palettePick.accentFg}; --accent-light:${palettePick.accent}1a;
  --bg:${palettePick.bg}; --surface:${palettePick.surface}; --text:${palettePick.text};
  --muted:${palettePick.muted}; --border:${palettePick.border}
  For :root.dark — --bg:${palettePick.darkBg}; --surface:${palettePick.darkSurface}; --accent:${palettePick.darkAccent};
  --text:#f1f5f9; --muted:#94a3b8; --border:${palettePick.darkSurface}cc
  Apply --accent to: all primary buttons (background), nav active links, section heading accents, icon fills, thin dividers, and any decorative lines.`
    : `• COLOR: Use the PALETTE OVERRIDE values above — do NOT invent new colors.`

  const inversionLine = invertedSection !== 'none'
    ? `\n• CONTRAST SECTION: "${invertedSection}" section uses a very dark background (#111 or deep brand-dark derived from --accent) with white/light text. All others stay light.`
    : ''

  return `
UNIQUE DESIGN DNA — generated fresh for this site. Follow ALL 12 points precisely — they override generic suggestions:
• FONTS: Import "${font.faces}" via Google Fonts @import. Headlines: font-size ${font.h1} (H1) / ${font.h2} (H2), line-height:${font.hLH}, letter-spacing:${font.hLS}. Body: ${font.bSize}, line-height:${font.bLH}. ${font.note}
• HERO: ${heroLayout}
${colorLine}
• ${bgTemp}
• ${spatial}
• ABOUT SECTION: ${aboutLayout}
• CARDS: ${cardStyle}
• SECTION HEADINGS: ${headingStyle}${inversionLine}
• ${navStyle}
• ${buttonShape}
• ${sectionRhythm}
• ${footerStyle}`
}

// ─────────────────────────────────────────────────────────────────────────────

export function buildHtmlGenerationPrompt(place: GooglePlaceData | null, vertical: Vertical, extraContext?: string, siteTheme: 'light' | 'dark' = 'light', whatsappOverride?: string, compact = false, contactEmail?: string, enrichedData?: string, styleVariant: 'A' | 'B' = 'A', menuText?: string, stylePreset: StylePresetKey = 'auto', tone: 'friendly' | 'formal' = 'friendly', density: 'full' | 'minimal' = 'full', language: 'es' | 'en' | 'de' | 'fr' = 'es', palette?: string[], websiteContent?: string, styleGuide?: string, modelProvider: 'claude' | 'openai' | 'gemini' | 'groq' = 'claude', social?: { instagram?: string; facebook?: string; tiktok?: string }, ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote', valueProp?: string, servicesText?: string, heroPhotoOverride?: string): string {
  const langName = ({ es: 'Spanish', en: 'English', de: 'German', fr: 'French' } as const)[language] ?? 'Spanish'
  const locale   = ({ es: 'es_ES',   en: 'en_GB',   de: 'de_DE', fr: 'fr_FR'  } as const)[language] ?? 'es_ES'
  const langOverride = language !== 'es'
    ? `\nLANGUAGE: Generate ALL visible text, copy, CTAs, navigation and legal content in ${langName}. Do NOT write in Spanish. Adapt CTAs and phrasing to natural ${langName} conventions.`
    : ''

  // ── Social media block — with exact brand SVG paths ──────────────────────────
  const igHandle = social?.instagram?.replace('@', '').replace(/.*instagram\.com\//i, '').replace(/\/$/, '') || ''
  const fbUrl = social?.facebook ? (social.facebook.startsWith('http') ? social.facebook : `https://facebook.com/${social.facebook}`) : ''
  const ttHandle = social?.tiktok?.replace('@', '').replace(/.*tiktok\.com\/@?/i, '').replace(/\/$/, '') || ''
  const hasSocial = !!(igHandle || fbUrl || ttHandle)

  // Exact brand SVG paths — copy these verbatim into the generated site
  const IG_SVG = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>`
  const FB_SVG  = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`
  const TT_SVG  = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.15a8.16 8.16 0 004.77 1.52V7.22a4.85 4.85 0 01-1-.53z"/></svg>`

  // Social icon link builder — circular button, hover scale
  const socialIconLink = (href: string, label: string, svg: string) =>
    `<a href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${label}" style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.1);transition:background .2s,transform .2s;color:inherit;text-decoration:none" onmouseover="this.style.background='rgba(255,255,255,0.22)';this.style.transform='scale(1.1)'" onmouseout="this.style.background='rgba(255,255,255,0.1)';this.style.transform='scale(1)'">${svg}</a>`

  const socialBlock = hasSocial
    ? `\nSOCIAL MEDIA — use these EXACT anchor tags with the exact SVG icons below. DO NOT substitute generic circles or placeholder icons.
Paste this HTML block verbatim in the footer (before the legal bottom bar) inside a flex div with gap:10px, preceded by a "Síguenos" label (font-size:12px, text-transform:uppercase, letter-spacing:.08em, opacity:.6):
${igHandle ? socialIconLink(`https://instagram.com/${igHandle}`, `Instagram @${igHandle}`, IG_SVG) : ''}${fbUrl ? socialIconLink(fbUrl, 'Facebook', FB_SVG) : ''}${ttHandle ? socialIconLink(`https://tiktok.com/@${ttHandle}`, `TikTok @${ttHandle}`, TT_SVG) : ''}
Also link to the same profiles in the hero "Síguenos" row (below CTAs) and — for Instagram — add a "@${igHandle || ttHandle || 'handle'}" overlay badge on the first gallery photo.
`
    : ''

  // ── CTA type instruction ──────────────────────────────────────────────────────
  const ctaInstruction = ctaType === 'whatsapp'
    ? '\nPRIMARY CTA — WhatsApp first: every hero/section CTA button opens WhatsApp (wa.me link). Phone calls are secondary. Label CTAs "Escríbenos por WhatsApp" / "Contactar por WhatsApp".'
    : ctaType === 'email'
    ? '\nPRIMARY CTA — Email/form first: main CTA buttons scroll to the contact form. "Envíanos un mensaje" / "Escríbenos". Phone in footer only.'
    : ctaType === 'quote'
    ? '\nPRIMARY CTA — Quote request: all CTAs say "Pedir presupuesto" / "Solicitar presupuesto gratis". Scroll to contact form with a "¿Qué necesitas?" message field.'
    : '' // default = phone — no override needed

  // ── Value proposition block ───────────────────────────────────────────────────
  const valuePropBlock = valueProp?.trim()
    ? `\nKEY DIFFERENTIATOR (owner-provided — use in hero subheadline and about section): "${valueProp.trim()}"`
    : ''

  // Claude understands conceptual placeholders and replaces them with real hex values.
  // Other models (Gemini, GPT, Groq/Llama) sometimes copy them literally → blank CSS.
  // For non-Claude providers we supply concrete starting hex values + "adapt to vertical" guidance.
  const themeInstruction = modelProvider === 'claude'
    ? `DUAL THEME SYSTEM — Generate BOTH light and dark palettes using CSS custom properties.
Define in :root the LIGHT theme, and in :root.dark the DARK theme. Choose brand-appropriate color values for this vertical — do NOT use the placeholder names below, fill in real hex values:
:root { /* LIGHT — ${siteTheme === 'light' ? 'DEFAULT' : 'ALT'} */
  --bg: [light page bg]; --surface: [light card bg]; --text: [dark heading+body]; --muted: [medium gray];
  --border: [subtle divider]; --accent: [brand primary]; --accent-fg: #fff; --accent-light: [10% opacity tint of accent];
}
:root.dark { /* DARK — ${siteTheme === 'dark' ? 'DEFAULT' : 'ALT'} */
  --bg: [very dark bg e.g. #0c0c10]; --surface: [dark card e.g. #16181e]; --text: [light text]; --muted: [mid gray];
  --border: [dark subtle divider]; --accent: [same hue 20% lighter]; --accent-fg: #fff; --accent-light: [dark tinted accent];
}
STRICT RULE: In all CSS rules OUTSIDE :root and :root.dark — use ONLY var(--bg), var(--text), var(--accent) etc. Zero hardcoded hex colors in general selectors.`
    : `DUAL THEME SYSTEM — Generate BOTH light and dark palettes using CSS custom properties.
CRITICAL: You MUST output REAL hex color codes (e.g. #f8f9fa). NEVER output placeholder text like [description] inside CSS values — that breaks the site.
Start from the base values below and replace ALL colors with brand-appropriate hex values for this business vertical:
:root { /* LIGHT — ${siteTheme === 'light' ? 'DEFAULT (no class on <html>)' : 'ALT'} */
  --bg: #f8f9fa; --surface: #ffffff; --text: #1a1a2e; --muted: #6c757d;
  --border: #dee2e6; --accent: #4f46e5; --accent-fg: #ffffff; --accent-light: rgba(79,70,229,0.1);
}
:root.dark { /* DARK — ${siteTheme === 'dark' ? 'DEFAULT (add class="dark" to <html>)' : 'ALT'} */
  --bg: #0c0c10; --surface: #16181e; --text: #f1f5f9; --muted: #94a3b8;
  --border: #2d3748; --accent: #818cf8; --accent-fg: #ffffff; --accent-light: rgba(129,140,248,0.15);
}
→ Replace EVERY color value above with hex codes matching the business vertical and brand personality:
  restaurant/bar → warm amber/terracotta (#c8602a, #fff8f0 …) | salon/spa → blush/rose (#e8a4b0, #fdf8f8 …)
  clinic/pharmacy → clean blue/teal (#0d7eb5, #f0f8ff …) | lawyer/finance → deep navy (#1a2744, #f5f7fa …)
  gym/fitness → energetic orange/black (#e85d04, #0d0d0d …) | hotel → gold/cream (#b8972c, #fdfaf4 …)
  shop/retail → bold indigo/coral | generic → professional indigo/slate (keep base values as-is)
STRICT RULE: In all CSS rules OUTSIDE :root and :root.dark — use ONLY var(--bg), var(--text), var(--accent) etc. Zero hardcoded hex colors in general selectors.`

  const paletteOverride = palette && palette.length >= 4
    ? `\nCOLOR PALETTE OVERRIDE — The operator has chosen a specific brand palette. Use EXACTLY these colors (override your default vertical colors):
  --accent: ${palette[0]}  (brand primary — buttons, CTAs, highlights, nav accent)
  --surface: ${palette[1]}  (card/panel backgrounds, secondary areas)
  --text: ${palette[2]}    (body text, headings)
  --bg: ${palette[3]}      (page background)
Set these exact hex values in :root (light theme). For :root.dark, darken --bg and --surface by 40-60% while keeping --accent as-is or slightly lighter.\n`
    : ''

  // Design DNA — unique per generation (Date.now() in seed), thousands of combinations
  const identityInstruction = buildDesignDNA(
    place?.name ?? extraContext?.slice(0, 30) ?? 'x',
    styleVariant,
    vertical,
    !!(palette?.length)
  )

  // variantInstruction is now superseded by the identity system (A/B always differ by identity)
  const variantInstruction = ''

  const styleInstruction = STYLE_PRESETS[stylePreset]?.promptDirective ?? ''

  // HTML class contract — when a non-auto preset is active, the AI MUST use these
  // exact class names so the injected Opus CSS design system can style them reliably.
  const htmlContract = stylePreset !== 'auto' ? `
HTML CLASS CONTRACT — MANDATORY: You MUST use these exact CSS class names in your HTML.
The design system CSS will style these classes. Do NOT invent different class names.
- Navigation: class="nav" on <nav>, class="nav-logo" on brand link, class="nav-links" on <ul>, class="nav-cta" on CTA link
- Hero: class="hero" on section, class="hero-inner" on content wrapper, class="hero-eyebrow" on tagline, use <h1> directly inside hero-inner, class="hero-sub" on subtitle <p>, class="hero-btns" on button wrapper
- Buttons: class="btn-primary" on primary CTA, class="btn-secondary" on secondary, class="btn-outline" on outline variant
- Section headings: wrap <h2> in <div class="section-heading">, add <p class="section-sub"> for subtitle
- About: class="about" on section, class="about-inner" on grid wrapper, class="about-text" on text side, class="about-img" on image side
- Cards: class="cards-grid" on 3-col grid, class="card" on each card, class="card-icon" on icon, class="card-title" on name, class="card-desc" on description, class="card-price" on price
- Features: class="feats-grid" on 2-col grid, class="feat" on each item, class="feat-icon" on icon wrapper, class="feat-title" on title, class="feat-text" on description
- Reviews: class="reviews-grid" on 3-col grid, class="review-card" on each, class="review-stars" on stars, class="review-text" on quote, class="review-author" on name
- FAQ: class="faq-list" on container, use <details class="faq-item">, <summary class="faq-q">, <p class="faq-a">
- CTA band: class="cta-band" on full-width colored section
- Contact: class="contact-grid" on 2-col layout, class="contact-info" on info column, class="contact-form" on form column, class="form-group" on each field wrapper, class="form-submit" on submit button
- Footer: use <footer>, class="footer-inner" on content wrapper, class="footer-top" on top row, class="footer-brand" on brand col, class="footer-links" on nav col, class="footer-bottom" on copyright row
- Animations: class="fade-in" on any element that should animate in on scroll` : ''

  const toneInstruction = tone === 'formal'
    ? '\nTONE — FORMAL: All copy in formal Spanish. Use "usted" forms. CTAs: "Contacte con nosotros", "Solicite información", "Concierte una cita". No emojis in body copy. Professional vocabulary. Measured, authoritative language throughout.'
    : '\nTONE — FRIENDLY: Warm, approachable Spanish. Use "tú" or "vosotros" forms. CTAs: "Llámanos", "Escríbenos", "Ven a vernos". Conversational, human, close to the customer. Can use emojis sparingly.'

  const densityInstruction = density === 'minimal'
    ? '\nDENSITY — MINIMAL: Luxury restraint. Include only: Hero, About (1 short paragraph), Services/Carta (max 4 items), Contact, Footer. Skip FAQ, skip standalone gallery, skip extended reviews section (at most 2 inline quotes in the About). Generous vertical padding (min 100px per section). Headlines max 6 words. Descriptions max 2 sentences. Think high-end boutique landing page, not content-heavy brochure.'
    : ''

  const contentGuidance = getVerticalContentGuidance(vertical)
  // identityInstruction comes LAST so it has highest specificity — overrides generic vertical direction
  const designOverrides = styleInstruction + htmlContract + toneInstruction + densityInstruction + contentGuidance + langOverride + paletteOverride + identityInstruction + socialBlock + ctaInstruction + valuePropBlock

  const styleGuideBlock = styleGuide
    ? `\nDESIGN INSPIRATION — The operator has provided a reference website. Adapt its visual style to this business (same color palette, font personality, layout structure, vibe) while using ONLY this business's content. Do NOT copy competitor's text. Style guide extracted from reference site:
${styleGuide}
→ Override your default vertical colors/fonts with those from the style guide. Replicate the vibe and layout density described above.`
    : ''

  const websiteContentBlock = websiteContent
    ? `\nEXISTING WEBSITE CONTENT (the business already has a website — use this as ground truth for menu items, real prices, services, team names, and any specific details):
${websiteContent}
→ Extract and use real data from the above: menu items with real prices, exact service names, real team members, authentic brand voice. Do NOT invent data that contradicts this.`
    : ''

  // Parse enrichment JSON into structured injection blocks
  let enrichedDataBlock = ''
  let enrichedFaqHints: string[] = []
  let enrichedTrustStats: string[] = []
  if (enrichedData) {
    try {
      const ed = JSON.parse(enrichedData)
      const lines: string[] = ['\nMARKETING INTELLIGENCE — AI-analyzed from real reviews and website data. USE EACH FIELD AS DIRECTED:']
      if (ed.tagline) lines.push(`• HERO SUBHEADLINE: Adapt this tagline for the hero subheadline (keep its spirit, match the tone): "${ed.tagline}"`)
      if (ed.atmosphere) lines.push(`• BRAND ATMOSPHERE: "${ed.atmosphere}" — infuse this throughout the About section and hero subtext`)
      if ((ed.usps as string[])?.length) lines.push(`• UNIQUE SELLING POINTS — weave into About section and hero supporting text:\n  - ${(ed.usps as string[]).join('\n  - ')}`)
      if ((ed.highlights as string[])?.length) lines.push(`• TOP CUSTOMER PRAISE — use as pull-quotes or testimonial intro sentences:\n  - ${(ed.highlights as string[]).join('\n  - ')}`)
      if ((ed.trust_stats as string[])?.length) {
        enrichedTrustStats = ed.trust_stats as string[]
        lines.push(`• TRUST NUMBERS for the About stats strip: ${enrichedTrustStats.join(' · ')}`)
      }
      if ((ed.faq_hints as string[])?.length) {
        enrichedFaqHints = ed.faq_hints as string[]
        lines.push(`• FAQ QUESTIONS — use these verbatim as the FAQ section (extracted from real customer concerns):\n${enrichedFaqHints.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}`)
      }
      enrichedDataBlock = lines.join('\n')
    } catch {
      enrichedDataBlock = `\nMARKETING INTELLIGENCE:\n${enrichedData}\n→ Use tagline in hero subheadline, USPs in About section, highlights as pull-quotes.`
    }
  }

  // Shared snippets injected into every prompt mode
  const responsiveSnippet = `RESPONSIVE SYSTEM — mandatory 3 breakpoints:
- Mobile (<768px): single column, hamburger nav, hero text clamp(1.8rem,6vw,2.4rem), stacked sections, all buttons/links min touch target 44px height, images full-width, horizontal padding 16px-20px
- Tablet (768px–1199px): 2-column grids where applicable, nav links visible (no hamburger), hero clamp(2.4rem,5vw,3.2rem), padding 24px-40px
- Desktop (≥1200px): full layout, max-width:1240px centered, full multi-column grids, generous whitespace
Use clamp() for fluid typography throughout. Every section must look intentional at 375px, 768px, and 1400px — not just "not broken".`

  const poweredBySnippet = `- POWERED BY BADGE: inside the footer bottom bar, add a small tasteful link: <a href="https://yaweb.ai" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:11px;opacity:0.45;color:inherit;text-decoration:none;transition:opacity .15s" onmouseover="this.style.opacity='.8'" onmouseout="this.style.opacity='.45'"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Creado con yaweb.ai</a>`

  const trustStripSnippet = (rating: string | number, reviewCount: number, zone: string) =>
    `- TRUST STRIP: immediately after the hero section, add a slim horizontal bar (padding: 14px 0, border-top+bottom: 1px solid with low opacity, background slightly offset from --color-bg). Show 3-4 trust signals inline: "${rating ? `⭐ ${rating}/5 en Google` : ''}" · "${reviewCount > 0 ? `${reviewCount} reseñas verificadas` : ''}" · "${zone ? `📍 ${zone}` : ''}" · "✓ Sin compromiso". Use flex, justify-center, gap:32px, font-size:13px, subtle color. Mobile: wrap or reduce to 2 items.`

  const cookieBannerSnippet = `- COOKIE BANNER: add a fixed bottom banner (id="cookie-banner") that checks localStorage('yw_cookies') on load. If not set, show it. HTML: <div id="cookie-banner" style="position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#1a1a1a;color:#fff;padding:14px 24px;display:none;align-items:center;justify-content:space-between;gap:16px;font-size:13px"><span>Usamos cookies para mejorar tu experiencia. <a href="#" onclick="document.getElementById('modal-cookies').showModal();return false" style="color:#a78bfa;text-decoration:underline">Política de cookies</a></span><div style="display:flex;gap:8px"><button onclick="(function(){localStorage.setItem('yw_cookies','1');document.getElementById('cookie-banner').style.display='none'})()" style="padding:6px 16px;background:#7c3aed;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">Aceptar</button><button onclick="(function(){localStorage.setItem('yw_cookies','0');document.getElementById('cookie-banner').style.display='none'})()" style="padding:6px 16px;background:transparent;color:#ccc;border:1px solid #555;border-radius:6px;cursor:pointer;font-size:12px">Rechazar</button></div></div><script>if(!localStorage.getItem('yw_cookies'))document.getElementById('cookie-banner').style.display='flex'</script>`

  const bizName = place?.name ?? 'este negocio'

  // Vertical-specific quote/appointment forms — fields are read by the WA form interceptor
  // and forwarded automatically as a WhatsApp message. No submit JS needed here.
  const quoteFormsByVertical: Partial<Record<Vertical, { heading: string; cta: string; fields: string }>> = {
    workshop: {
      heading: 'Solicitar presupuesto gratuito',
      cta: 'Pedir presupuesto gratis',
      fields: `nombre (text, required, placeholder "Tu nombre"), teléfono (tel, required), vehículo (text, placeholder "Marca · Modelo · Año"), tipo de servicio (select: Diagnóstico, Reparación, Mantenimiento, Revisión ITV, Cambio de piezas, Otro), descripción de la avería o servicio (textarea, required, placeholder "Cuéntanos qué le pasa al vehículo o qué necesitas")`,
    },
    lawyer: {
      heading: 'Primera consulta gratuita',
      cta: 'Solicitar consulta gratuita',
      fields: `nombre (text, required), teléfono (tel, required), email (email), área legal (select: Civil, Penal, Laboral, Familia y Divorcios, Herencias, Accidentes de tráfico, Empresa y Contratos, Otro), urgencia (select: Urgente — necesito respuesta hoy, Esta semana, Sin urgencia), descripción breve del caso (textarea, required, placeholder "Explícanos brevemente tu situación para poder orientarte mejor")`,
    },
    clinic: {
      heading: 'Pedir cita',
      cta: 'Solicitar cita',
      fields: `nombre (text, required), teléfono (tel, required), especialidad o motivo de consulta (text, required, placeholder "¿Con qué especialista o para qué motivo?"), ¿es primera visita? (select: Sí — primera vez, No — ya soy paciente), disponibilidad preferida (select: Mañanas, Tardes, Cualquier horario), comentario adicional (textarea, placeholder "Síntomas, medicación actual u otra información relevante")`,
    },
    salon: {
      heading: 'Reservar cita',
      cta: 'Reservar mi cita',
      fields: `nombre (text, required), teléfono (tel, required), servicio deseado (text, placeholder "Corte, color, tratamiento, uñas..."), disponibilidad preferida (select: Mañanas entre semana, Tardes entre semana, Sábados, Cualquier horario), comentario (textarea, placeholder "Alergias, preferencias o algo que debamos saber")`,
    },
    gym: {
      heading: 'Información y precios',
      cta: 'Quiero más información',
      fields: `nombre (text, required), teléfono (tel, required), objetivo principal (select: Perder peso, Ganar músculo, Mejorar resistencia, Clases dirigidas, Rehabilitación, Otro), disponibilidad (select: Mañanas, Mediodía, Tardes, Noches, Fin de semana, Flexible), experiencia previa (select: Nunca he ido al gimnasio, Tengo experiencia básica, Soy habitual), mensaje (textarea, placeholder "¿Tienes alguna lesión o condición que debamos tener en cuenta?")`,
    },
    academy: {
      heading: 'Solicitar información',
      cta: 'Quiero más información',
      fields: `nombre (text, required), teléfono (tel, required), email (email), curso o área de interés (text, required, placeholder "¿Qué quieres aprender?"), nivel (select: Soy principiante, Tengo conocimientos básicos, Nivel intermedio, Nivel avanzado), modalidad preferida (select: Presencial, Online, Mixta — me adapto), mensaje (textarea, placeholder "Cuéntanos tu situación actual o qué quieres conseguir")`,
    },
  }

  const quoteForm = quoteFormsByVertical[vertical as Vertical]
  const contactFormSnippet = quoteForm
    ? `- QUOTE/APPOINTMENT FORM (id="contacto-form") in the contact section — this is a LEAD CAPTURE form, not a simple contact form:
  Heading: "${quoteForm.heading}" with a brief subtitle explaining it's free and no-commitment.
  Fields: ${quoteForm.fields}.
  Submit button: "${quoteForm.cta}" — full-width, prominent, brand accent color.
  Form style: clean card with slight shadow, generous padding, field labels above inputs (not placeholder-only), brand accent focus rings.
  NO submit JS — the platform handles submission automatically. Just use a standard <form> with named inputs and a submit button.
  Below the form: small reassurance line — lock icon + "Sin compromiso · Respuesta en menos de 24h · Tus datos están seguros".`
    : `- CONTACT FORM in the contact section: 3 fields — nombre (text, required), teléfono (tel), mensaje (textarea, required). Style cleanly with brand colors. NO submit JS — the platform handles it. Submit button: "Enviar mensaje".`

  const emailNote = contactEmail
    ? `\nCONTACT EMAIL: show "${contactEmail}" visibly in the contact section (alongside phone). The platform handles form submission to this email automatically — do NOT add mailto links or form action attributes.`
    : ''

  // Context-only mode (no Google Places data) — used by portfolio demos and landing
  if (!place) {
    const waNumber = whatsappOverride?.replace(/\D/g, '') || ''
    const waLine = waNumber
      ? `\n- WhatsApp floating button (fixed, bottom-right, #25D366, pulse glow animation): https://wa.me/${waNumber}`
      : '\n- WhatsApp floating button (fixed, bottom-right, #25D366, pulse glow animation) if phone is in the brief'
    const ctxFallbacks = UNSPLASH_FALLBACKS[vertical] ?? UNSPLASH_FALLBACKS.generic
    const heroPhotoLine = heroPhotoOverride
      ? `\nHERO PHOTO — use this as the hero background image: ${heroPhotoOverride}\nApply as CSS background-image with overlay: linear-gradient(to top,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.25) 65%). Hero text MUST be white and fully legible.`
      : ''
    const ctxGalleryPhotos = heroPhotoOverride
      ? [ctxFallbacks[0], ctxFallbacks[1], ctxFallbacks[2]]
      : ctxFallbacks.slice(0, 3)
    const hasCtxGallery = ctxGalleryPhotos.filter(Boolean).length >= 2
    const ctxGalleryBlock = hasCtxGallery
      ? `\n4b. PHOTO GALLERY — full-width edge-to-edge CSS grid (3 columns on desktop, 1 on mobile), each cell height:280px, gap:4px. No section heading. Photos:\n${ctxGalleryPhotos.filter(Boolean).map((u, i) => `  Photo ${i + 1}: ${u}`).join('\n')}`
      : ''

    // ── Context-only: menu + nav logic (mirrors Google Places mode) ────────────
    const ctxIsFood = vertical === 'restaurant' || vertical === 'bar'
    const ctxHasMenu = ctxIsFood && !!(menuText?.trim())
    const ctxMenuBlock = ctxHasMenu
      ? `\nREAL MENU DATA — populate the "Carta" section (id="carta") with EXACTLY this content. Do NOT invent dishes, categories, or prices:\n${menuText}\n`
      : ''

    // Detect if hours are mentioned in the brief
    const ctxHasHours = !!(extraContext && /lunes|martes|miércoles|jueves|viernes|sábado|domingo|horario|abierto|cerrado|L[–-]V|L[–-]S|Ma[–-]|Ma–Do|lun[–-]|vie[–-]/i.test(extraContext))

    // ── Booking section: WhatsApp-based reservations / appointments ──────────
    const BOOKING_VERTICALS = ['restaurant', 'bar', 'salon', 'clinic', 'gym', 'academy', 'hotel']
    const ctxHasBooking = BOOKING_VERTICALS.includes(vertical)
    const ctxBookingId   = ctxIsFood ? 'reservar' : 'cita'
    const ctxBookingLabel = ctxIsFood ? 'Reservar' : 'Cita'
    const ctxBookingHeading = vertical === 'restaurant' ? 'Reserva tu mesa'
      : vertical === 'bar'     ? 'Reserva tu sitio'
      : vertical === 'salon'   ? 'Reserva tu cita'
      : vertical === 'clinic'  ? 'Pide tu cita'
      : vertical === 'gym'     ? 'Empieza hoy gratis'
      : vertical === 'hotel'   ? 'Reserva tu estancia'
      : 'Solicita tu cita'
    const ctxBookingMsg  = ctxIsFood
      ? 'Hola%2C+me+gustar%C3%ADa+hacer+una+reserva'
      : 'Hola%2C+me+gustar%C3%ADa+pedir+una+cita'
    const ctxBookingHref = waNumber
      ? `https://wa.me/${waNumber}?text=${ctxBookingMsg}`
      : `#contacto`
    const ctxBookingCallLabel = ctxIsFood ? 'reservar por teléfono' : 'pedir cita por teléfono'

    // Build explicit nav — every item MUST match a real section id below
    const ctxCartaSection = ctxHasMenu
      ? `4. Carta — id="carta" (MANDATORY — this section MUST exist). Full-width section. Render the REAL MENU DATA above into 2–3 categories. Use EXACTLY those dish names and prices — do NOT invent anything. Style it beautifully: category headings in serif font, dishes in rows (name left, price right), subtle dividers. "Ver carta" nav button and hero CTA MUST scroll here.`
      : ctxIsFood
        ? `4. Especialidades — id="especialidades". Highlight the signature dishes mentioned in the brief as feature cards.`
        : `4. Servicios — id="servicios". 3-column card grid, exactly 3 or 6 cards (never 4 or 5 — reach a multiple of 3). Each card: name (bold), 1-line description, price if mentioned.`

    const ctxHoursSection = ctxHasHours
      ? `5. Horarios — id="horarios". Extract all hours from the brief and render as a clean table: two columns (day | hours), white-space:nowrap on both, font-weight:700 on day names. Highlight today's row in var(--accent). Add a small <script> that auto-highlights today: var d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][new Date().getDay()]; document.querySelectorAll('#horarios tr').forEach(function(r){if(r.cells[0]&&r.cells[0].textContent.toLowerCase().trim()===d){r.style.color='var(--accent)';r.cells[0].style.fontWeight='800'}}).`
      : ''

    const ctxBookingSection = ctxHasBooking
      ? `${ctxHoursSection ? '6' : '5'}. ${ctxBookingLabel} — id="${ctxBookingId}" (MANDATORY). Full-width section, centered card (max-width:540px, border-radius:16px, generous padding). Accent-light background (8–12% opacity tint of brand color).
   Heading (bold, large): "${ctxBookingHeading}"
   Subline (small, muted): "Confirmación inmediata · Sin esperas · Sin compromiso"
   Primary CTA button (full-width, height:52px, border-radius:12px, background:#25D366, font-size:16px, font-weight:700, color:#fff): href="${ctxBookingHref}" — include inline WhatsApp SVG icon (viewBox="0 0 24 24", fill:currentColor, 20px) + " ${ctxIsFood ? 'Reservar por WhatsApp' : 'Cita por WhatsApp'}"
   Below button (small, centered, opacity:.6): "Prefiero ${ctxBookingCallLabel}: [phone from brief]"
   Keep it visually clean and conversion-focused — no form fields.`
      : ''

    const ctxNavItems = [
      'Nosotros',
      ctxHasMenu ? 'Carta' : (!ctxIsFood ? 'Servicios' : 'Especialidades'),
      ctxHasBooking ? ctxBookingLabel : null,
      ctxHasHours ? 'Horarios' : null,
      'FAQ',
      'Contacto',
    ].filter(Boolean).join(' · ')

    // Social links — prominent in hero when available
    const ctxSocialHeroLine = hasSocial
      ? `Below the CTA buttons, add a compact "Síguenos" row: ${igHandle ? `Instagram icon link → https://instagram.com/${igHandle}` : ''}${fbUrl ? `, Facebook icon link → ${fbUrl}` : ''}${ttHandle ? `, TikTok icon link → https://tiktok.com/@${ttHandle}` : ''}. Small SVG icons 20px, circular ghost buttons, inline-flex row, gap:10px, opacity:.8 on idle.`
      : ''

    return `You are an elite web designer and copywriter creating a premium, production-quality website for a Spanish local business. Your output will be shown to the business owner as a demo — it must be so impressive they immediately want to pay for it.

ALL BUSINESS INFORMATION IS IN THE CLIENT BRIEF BELOW. Use it fully — infer the business name, type, tone, services, and any other details from this text:

CLIENT BRIEF:
${extraContext}
${heroPhotoLine}
${ctxMenuBlock}
${themeInstruction}

DESIGN DIRECTION for ${vertical}:
${getVerticalDesignDirection(vertical)}${variantInstruction}${designOverrides}

SINGLE-PAGE SITE: One HTML file. ALL links between sections use anchor links.
NAV ANCHOR CONTRACT (MANDATORY): Every link in the nav (e.g. href="#carta") MUST have an EXACTLY matching section id in the page (e.g. <section id="carta">). No orphan links. No mismatches. Test every nav item before finishing.

REQUIRED SECTIONS — in this exact order, with these exact ids:
1. Sticky navigation — name/logo left, anchor links center (${ctxNavItems}), phone CTA right. Theme toggle button (id="yw-th", 32px, borderless, last item right of CTA) — toggles class="dark" on <html>, persists localStorage('yw_th'), shows sun SVG in dark mode, moon SVG in light mode. Mobile: hamburger button (id="nav-toggle") that toggles id="nav-links" visibility via JS onclick.
2. Hero — full-viewport headline, subheadline, 2 CTA buttons: PRIMARY → href="#${ctxHasMenu ? 'carta' : ctxIsFood ? 'especialidades' : ctxHasBooking ? ctxBookingId : 'servicios'}" (main action for vertical); SECONDARY → href="${waNumber ? `https://wa.me/${waNumber}?text=Hola%2C+tengo+una+consulta` : '#contacto'}" in green #25D366 with WhatsApp SVG icon${ctxSocialHeroLine ? ` + "${ctxSocialHeroLine}"` : ''}. Hero photo as CSS background-image if provided. Dark overlay on photo: gradient ending rgba(0,0,0,0.60)+ at text position — white text fully legible.
2b. Trust strip — slim bar after hero: 3–4 trust signals inferred from the brief (rating, years, certifications, location). Flex, centered, subtle borders.
3. About/Story — id="nosotros", 2–3 warm paragraphs from the brief details.
${ctxGalleryBlock}
${ctxCartaSection}
${ctxHoursSection}
${ctxBookingSection}
7. FAQ — id="faq", 5 questions specific to this business type, <details>/<summary> accordion. Real, specific questions — not generic.
8. Contact — id="contacto". Two-column layout (desktop): left = contact info card (address, phones, email listed as a CSS grid: display:grid;grid-template-columns:max-content 1fr;gap:8px 24px;align-items:baseline — each row is label+value pair, labels in uppercase 11px opacity:.6, values normal weight or accent color for phone/email links) + WhatsApp CTA button (green #25D366). Right = contact form. If address available: Google Maps embed iframe below. Phone: href="tel:PHONE", WhatsApp: href="https://wa.me/${waNumber || 'PHONE'}?text=Hola%2C+tengo+una+consulta".
9. Footer — premium dark, multi-column: col1 logo+tagline, col2 nav links, col3 contact details + WhatsApp link${hasSocial ? `, col4 "Síguenos" with SVG social icons (${igHandle ? `@${igHandle}` : ''}${fbUrl ? ' Facebook' : ''}${ttHandle ? ` @${ttHandle}` : ''}) — circular 34px buttons, hover scale.` : '.'} Bottom bar: copyright · Aviso Legal · Privacidad · Cookies (3 modal dialogs with Spanish legal text) · ${poweredBySnippet.replace('- POWERED BY BADGE: inside the footer bottom bar, add a small tasteful link: ', '')}.

TECHNICAL REQUIREMENTS:
- Single self-contained HTML file — ALL CSS in <style> tag
- In <head>: og:title (business name from brief), og:description, og:locale="${locale}", twitter:card="summary_large_image"
- Import 2–3 Google Fonts via @import (match brand personality)
- CSS custom properties in :root — DUAL THEME (light + dark) with :root.dark override
- ${responsiveSnippet}
- Smooth scroll (scroll-behavior:smooth on html), fade-in IntersectionObserver animations${waLine}
- ${contactFormSnippet}${emailNote}
- ${cookieBannerSnippet}
- Semantic HTML5. All text in ${langName}. NO Lorem Ipsum. NO broken img tags. Compact CSS (no comments, no blank lines).

QUALITY BAR: Top-tier Spanish digital agency. Bold typographic choices, sophisticated palette, bespoke personality. Not a template. Always close every tag, end with </body></html>.

Output ONLY raw HTML from <!DOCTYPE html>. No explanations. No markdown. No code fences.`
  }

  // Full mode with Google Places data
  const hours = parseOpeningHours(place)
  const hoursText = hours.length
    ? hours.map(h => `${h.day}: ${h.closed ? 'Cerrado' : `${h.open}–${h.close}`}`).join('\n')
    : 'No disponible'

  const maxReviews = compact ? 3 : 5
  const reviews = place.reviews
    ?.filter(r => r.rating >= 4)
    .slice(0, maxReviews)
    .map(r =>
      compact
        ? `${r.author_name} (${r.rating}★): "${smartTruncate(r.text, 120)}"`
        : `<review><author>${r.author_name}</author><rating>${r.rating}/5</rating><text>${smartTruncate(r.text, 220)}</text><date>${r.relative_time_description}</date></review>`
    ).join('\n') || ''

  const maxPhotos = compact ? 4 : 10
  const photoUrls = place.photos?.slice(0, maxPhotos).map(p => getPhotoUrl(p.photo_reference, 1200)) || []

  // Unsplash fallback — always fill to at least 4 total so gallery is always possible
  if (photoUrls.length < 4) {
    const fallbacks = UNSPLASH_FALLBACKS[vertical] ?? UNSPLASH_FALLBACKS.generic
    for (let i = photoUrls.length; i < Math.min(4, fallbacks.length); i++) photoUrls.push(fallbacks[i])
  }

  const heroPhoto = heroPhotoOverride || photoUrls[0] || ''
  const extraPhotos = photoUrls.slice(1)

  const whatsapp = formatWhatsApp(whatsappOverride || place.formatted_phone_number || '')
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(place.formatted_address)}`
  const lat = place.geometry?.location.lat
  const lng = place.geometry?.location.lng
  const mapsEmbed = lat && lng
    ? `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed&hl=es`
    : `https://maps.google.com/maps?q=${encodeURIComponent(place.formatted_address)}&output=embed&hl=es`

  const isFood = vertical === 'restaurant' || vertical === 'bar'

  // ── Section availability: only include sections with real data ──────────────
  const qualifiedReviews = place.reviews?.filter(r => r.rating >= 4) ?? []
  const hasHours = hours.length > 0
  const hasReviews = qualifiedReviews.length >= 2
  const hasGallery = extraPhotos.length >= 2
  const galleryPhotos = compact ? extraPhotos.slice(0, 3) : extraPhotos.slice(0, 8)
  const hasMenu = isFood && !!(menuText?.trim())

  // Dynamic nav — only link sections that will actually exist
  const navItems = [
    'Nosotros',
    hasMenu ? 'Carta' : (!isFood ? 'Servicios' : null),
    hasHours ? 'Horarios' : null,
    hasReviews ? 'Reseñas' : null,
    !compact ? 'FAQ' : null,
    'Contacto',
  ].filter(Boolean).join(' · ')

  // Real menu block to inject into the prompt
  const menuBlock = hasMenu
    ? `\nREAL MENU DATA — use this to populate the Carta section. Do NOT invent dishes or prices. Render exactly what's here, organized into categories:\n${menuText}\n`
    : ''

  // ── Services block (non-food, owner-provided) ─────────────────────────────
  const hasRealServices = !isFood && !!(servicesText?.trim())
  const servicesBlock = hasRealServices
    ? `\nREAL SERVICES DATA — use this verbatim to populate the Services section. Do NOT invent or add services not listed here. Do NOT change prices. Render exactly what's listed, organized into beautiful cards:\n${servicesText}\n`
    : ''

  // Explicit skip instructions for the AI
  const skipLines = [
    !hasHours && `- "Horarios" section (id="horarios") — Google has no schedule data for this business. Do NOT generate it. Do NOT add "Horarios" to the nav.`,
    !hasReviews && `- "Reseñas" section (id="reseñas") — only ${qualifiedReviews.length} verified review(s) available (minimum 2 needed for a credible section). Do NOT generate it. Do NOT add "Reseñas" to the nav.`,
    !hasGallery && `- Photo gallery — not enough real photos available. Do NOT generate a gallery section.`,
    isFood && !hasMenu && `- "Carta" section (id="carta") — no menu data provided. Do NOT invent dishes or prices. Do NOT add "Carta" to the nav. Skip this section entirely.`,
  ].filter(Boolean)
  const skipInstruction = skipLines.length
    ? `\nSECTIONS TO OMIT — insufficient data, do NOT include these sections or their nav links:\n${skipLines.join('\n')}\n`
    : ''

  const galleryBlock = hasGallery
    ? `\n4b. PHOTO GALLERY — Full-width section, edge-to-edge (zero horizontal padding/margin, no container). ${compact
      ? `Three photos in a grid: CSS grid repeat(3,1fr) on desktop, repeat(2,1fr) on tablet (≥600px), 1fr on mobile. Each cell height:220px, gap:3px.`
      : `CSS grid of ${Math.min(galleryPhotos.length, 3)} columns, cell height:320px, gap:4px. Last photo spans 2 cols if grid count is even. Mobile: 1 column.`}
Each cell = <div style="background-image:url('URL');background-size:cover;background-position:center;height:Xpx;width:100%;"></div>. No section heading — photos speak for themselves. Add a very subtle bottom border/divider to separate from next section.${hasSocial && igHandle ? `\nOverlay on first gallery photo: absolute-positioned pill badge "📸 @${igHandle}" (font-size:12px, bg:rgba(0,0,0,0.55), color:#fff, border-radius:20px, padding:4px 10px, bottom:12px, left:12px).` : ''}
Real photos:
${galleryPhotos.map((u, i) => `  Photo ${i + 2}: ${u}`).join('\n')}`
    : ''

  const hamburguerInstruction = `- Mobile hamburger menu: give the nav-links list id="nav-links". After it (still inside nav), add: <button id="nav-toggle" aria-label="Menú" onclick="var nl=document.getElementById('nav-links');nl.classList.toggle('nav-open')"><span></span><span></span><span></span></button>. CSS: #nav-toggle{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:4px;color:inherit}#nav-toggle span{display:block;width:22px;height:2px;background:currentColor}@media(max-width:900px){#nav-toggle{display:flex}#nav-links{display:none}#nav-links.nav-open{display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:var(--bg,#fff);padding:16px 24px;gap:6px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.12)}}`

  return `You are an elite web designer and copywriter creating a premium, production-quality website for a Spanish local business. Your output will be shown to the business owner as a demo — it must be so impressive they immediately want to pay for it.

${themeInstruction}
${extraContext ? `
IMPORTANT — EXTRA CONTEXT FROM THE CLIENT (prioritize this, it overrides generic assumptions):
${extraContext}
` : ''}${styleGuideBlock}${websiteContentBlock}${enrichedDataBlock}
BUSINESS DATA (from Google):
- Name: ${place.name}
- Type: ${vertical}${place.primary_type_display_name ? ` (${place.primary_type_display_name})` : ''}
- Address: ${place.formatted_address}
- Maps URL: ${place.google_maps_uri || `https://maps.google.com/?q=${encodeURIComponent(place.formatted_address)}`}
- Phone: ${place.formatted_phone_number || 'N/A'}
- Contact email: ${contactEmail || 'N/A'}
- Rating: ${place.rating || 'N/A'}/5 (${place.user_ratings_total || 0} reviews on Google)
- Price: ${place.price_range || (place.price_level ? '€'.repeat(place.price_level) : 'N/A')}
- Description: ${buildBusinessDescription(place, vertical)}
${place.review_summary ? `- Google review summary: ${place.review_summary}` : ''}
${place.neighborhood_summary ? `- Neighbourhood: ${place.neighborhood_summary}` : ''}
${buildAttributesBlock(place)}
OPENING HOURS:
${hoursText}
${place.secondary_opening_hours?.length ? `\nSECONDARY HOURS (delivery, drive-through, happy hour, etc.):\n${place.secondary_opening_hours.map(h => `${h.type}: ${h.weekday_text.join(', ')}`).join('\n')}\n` : ''}
REAL GOOGLE REVIEWS (4-5 stars only — use these verbatim):
${reviews || 'No reviews available'}

${heroPhoto ? `PHOTOS (real photos of this business):
Hero (MANDATORY — use as hero CSS background-image): ${heroPhoto}
  Apply EXACTLY: background-image:linear-gradient(to bottom,rgba(0,0,0,.58) 0%,rgba(0,0,0,.22) 70%),url('${heroPhoto}');background-size:cover;background-position:center;min-height:100vh
  Hero section text MUST be white (#fff). This is a real photo — do NOT substitute a solid color or omit it.
${extraPhotos.map((u, i) => `Photo ${i + 2}: ${u}`).join('\n')}` : ''}

DESIGN DIRECTION for ${vertical}:
${getVerticalDesignDirection(vertical)}${variantInstruction}${designOverrides}

SINGLE-PAGE SITE: One HTML file only. ALL links between sections must be anchor links.
NAV ANCHOR CONTRACT (MANDATORY): Every nav link (e.g. href="#carta") MUST have an EXACTLY matching section id (e.g. <section id="carta">). No orphan links — verify every item before closing </html>.
BOOKING VIA WHATSAPP: For restaurant/bar/salon/clinic/gym/hotel — include ONE "Reservar" or "Cita" nav link to id="reservar" or id="cita". The reservar/cita section contains:
  PRIMARY CTA (only one button): full-width green (#25D366) WhatsApp button → https://wa.me/${whatsapp || 'PHONE'}?text=${vertical === 'restaurant' || vertical === 'bar' ? 'Hola%2C+me+gustar%C3%ADa+hacer+una+reserva' : 'Hola%2C+me+gustar%C3%ADa+pedir+una+cita'}
  SECONDARY (plain text, NOT a button): "Prefiero llamar: [phone number]" — just a styled <a href="tel:..."> inline text link below the button.
  NO additional booking buttons elsewhere on the page. The hero CTA scrolls to #${isFood ? 'carta' : 'servicios'} — NOT to #reservar. The nav pill IS the only "Reservar" button visible in the header area.
CTA COUNT RULE: Total booking-related buttons on the ENTIRE page = maximum 2 (1 green WhatsApp button in the reservar section + 1 nav pill). Every other link must use a plain anchor text style, not a button.
${menuBlock}${servicesBlock}${skipInstruction}
${compact ? `REQUIRED SECTIONS (tight — token budget 7000):
1. Sticky nav — name/logo left, anchor links center (${navItems}), phone CTA right. Mobile: hide links, keep CTA.
2. Hero — full-viewport (min-height:100vh), headline, subheadline, ONE CTA button scrolling to #${isFood ? 'carta' : 'servicios'} (NOT to #reservar)${heroPhoto ? '. MANDATORY: apply the Hero photo above as CSS background-image (exact CSS given above). White text.' : ''}
2b. Trust strip — slim bar after hero: "${enrichedTrustStats.length >= 2 ? enrichedTrustStats.join(' · ') + ' · ✓ Sin compromiso' : `⭐ ${place.rating || '5'}/5 en Google · ${place.user_ratings_total || 0} reseñas · 📍 ${place.formatted_address.split(',').slice(-3, -1).join(',').trim() || place.formatted_address.split(',').slice(-2, -1)[0]?.trim() || ''} · ✓ Sin compromiso`}". Flex, centered, subtle border-top/bottom. Mobile: show first 2 items only.
3. About — id="nosotros", 1-2 short paragraphs
${hasMenu ? '4. Carta — id="carta", render the REAL MENU DATA above into 2-3 beautiful categories. Use exactly those dishes and prices. No inventions.' : isFood ? '' : hasRealServices ? '4. Services — id="servicios", render the REAL SERVICES DATA above as compact cards (name, 1-line desc, price badge). No inventions.' : '4. Services — id="servicios", 4 compact cards based on the business type'}
${hasHours ? `4b. Opening hours — id="horarios". Compact clean <table> (max-width:480px, centered). Two columns: day (font-weight:700, white-space:nowrap, min-width:110px) | hours (white-space:nowrap). <script>(function(){var d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][new Date().getDay()];document.querySelectorAll('#horarios tr').forEach(function(r){if(r.cells[0]&&r.cells[0].textContent.toLowerCase().trim()===d){r.style.color='var(--accent)';r.cells[0].style.fontWeight='800'}})})()</\\/script>` : ''}
${hasReviews ? `5. Reviews — id="reseñas", "${place.rating || ''}/5 ★", "basado en ${place.user_ratings_total || 0} reseñas", 2-3 cards (100 chars each)` : ''}
${enrichedFaqHints.length >= 3
  ? `${hasReviews ? '6' : '5'}b. Mini FAQ — id="faq". Use EXACTLY these 3 questions (AI-extracted from real customer concerns for this business type): 1. "${enrichedFaqHints[0]}" 2. "${enrichedFaqHints[1]}" 3. "${enrichedFaqHints[2]}". Simple <details>/<summary> accordion. <summary> styled with accent color. 3 short answers specific to this business.`
  : `${hasReviews ? '6' : '5'}b. Mini FAQ — id="faq". Write 3 questions a customer typically asks before first contact with this type of business. Simple <details>/<summary> accordion.`
}
6. Contact + Map — id="contacto", phone, WhatsApp, address. Embed Google Maps as <iframe src="${mapsEmbed}" style="width:100%;height:300px;border:0" loading="lazy"></iframe>
7. Footer — premium dark background regardless of theme. Multi-column: col1 logo + tagline + short description, col2 anchor nav links, col3 address + phone + WhatsApp${hasSocial ? `, col4 "Síguenos" with social icon SVG links (${igHandle ? `Instagram @${igHandle}` : ''}${fbUrl ? ', Facebook' : ''}${ttHandle ? `, TikTok @${ttHandle}` : ''} — only the ones with data)` : ''}. Bottom bar: copyright · legal links (Aviso Legal · Privacidad · Cookies) that open inline modals · ${poweredBySnippet.replace('- POWERED BY BADGE: inside the footer bottom bar, add a small tasteful link: ', '')}. Include 3 hidden modal dialogs with auto-generated Spanish legal text (Aviso Legal, Política de Privacidad, Política de Cookies) based on the business name and address. Modal JS: toggle display with a small <script>. Footer must feel substantial and premium — generous padding, clear hierarchy, subtle top border accent.

TECHNICAL:
- All CSS in <style> — MINIFIED (no comments, no blank lines, combine selectors)
- In <head>: og:title="${place.name}", og:description (short tagline), og:locale="${locale}"${heroPhoto ? `, og:image="${heroPhoto}"` : ''}, twitter:card="summary_large_image"
- 1 Google Font @import, CSS custom properties in :root with :root.dark override
- scroll-behavior:smooth on html.
- ${responsiveSnippet}
- ${hamburguerInstruction}
- WhatsApp fixed button (bottom-right, #25D366, subtle pulse animation)${whatsapp ? `, href="https://wa.me/${whatsapp}"` : ''}
- Theme toggle (id="yw-th") as last nav-right item: 32px button, sun/moon SVG, toggles class="dark" on <html>, localStorage('yw_th')
- ${contactFormSnippet.replace('BUSINESS_NAME_HERE', `'${place.name}'`)}${emailNote}
- ${cookieBannerSnippet}
- NO Lorem Ipsum. NO broken img tags. NO external JS.
- TOKEN BUDGET: ~7000 tokens. Compact CSS mandatory. No scroll animations.` : `REQUIRED SECTIONS (in this order):
1. Sticky navigation — name/logo left, anchor links center (${navItems}), phone CTA right. ${hamburguerInstruction}
2. Hero — full-viewport (min-height:100vh), headline, subheadline, ONE CTA button scrolling to #${isFood ? 'carta' : 'servicios'} (NOT to #reservar)${heroPhoto ? '. MANDATORY: use the Hero photo above as CSS background-image with the exact gradient overlay specified. All text must be white.' : ''}
2b. Trust strip — slim bar immediately after hero: "${enrichedTrustStats.length >= 2 ? enrichedTrustStats.join(' · ') + ' · ✓ Sin compromiso' : `⭐ ${place.rating || '5'}/5 en Google · ${place.user_ratings_total || 0} reseñas verificadas · 📍 ${place.formatted_address.split(',').slice(-3, -1).join(',').trim()} · ✓ Sin compromiso`}". Flex centered, gap:32px, font-size:13px, subtle border-top/bottom, low opacity background. Mobile: 2 items only.
3. About/Story — id="nosotros", 2-3 warm paragraphs specific to this business${galleryBlock}
${hasMenu ? '4c. Carta — id="carta", render the REAL MENU DATA above into 3 categories with their exact dishes and prices. Style it beautifully — no inventions.' : isFood ? '' : hasRealServices ? '4c. Services — id="servicios", render the REAL SERVICES DATA above into beautiful service cards. Each card: service name (bold), 1-2 sentence description, price or range in a badge. Use a 2-3 column grid. No inventions — only what is listed.' : '4c. Services — id="servicios". 3-column card grid, EXACTLY 3 or 6 cards (never 4 or 5 — group or add to reach a multiple of 3). Each card: name (bold), 1-2 line description, price if known.'}
${hasHours ? `5. Opening hours — id="horarios". Render as a clean <table> inside a centered card (max-width:560px). Two columns: day name (font-weight:700, white-space:nowrap, width:130px) | hours (white-space:nowrap). NO grid layout — pure <tr><td> so times never wrap onto a second line. Add highlight script: <script>(function(){var d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][new Date().getDay()];document.querySelectorAll('#horarios tr').forEach(function(r){if(r.cells[0]&&r.cells[0].textContent.toLowerCase().trim()===d){r.style.color='var(--accent)';r.cells[0].style.fontWeight='800'}})})()</\\/script>` : ''}
6. Location + Map — id="ubicacion", embed Google Maps as <iframe src="${mapsEmbed}" style="width:100%;height:400px;border:0;border-radius:12px" loading="lazy" allowfullscreen></iframe> above the address block, plus a "Ver en Google Maps" button → ${mapsUrl}
${hasReviews ? `7. Reviews — id="reseñas", big "${place.rating || ''}/5" rating, visual ★ stars row, "Basado en ${place.user_ratings_total || 0} reseñas verificadas en Google", 3 review cards (author, stars, text max 130 chars, relative date). Below the cards: a centered link "Ver todas las reseñas en Google →" → ${'https://search.google.com/local/reviews?placeid=' + (place?.place_id ?? '')}` : ''}
8. FAQ — id="faq". Write 5-6 questions real customers ask BEFORE calling. Base them on the reviews above + common pre-purchase concerns: prices/rates, booking/appointment process, parking/access, delivery zone, guarantees, payment methods, waiting times. Use <details>/<summary> accordion, CSS transition on open. Brand accent color on open state border-left. Add FAQPage JSON-LD.
9. Contact — id="contacto". Two-column layout: left = contact info card with details listed as a two-column CSS grid (display:grid;grid-template-columns:max-content 1fr;gap:8px 24px;align-items:baseline — label in col1: uppercase 11px opacity:.55 white-space:nowrap, value in col2: normal or accent for phone/email) + WhatsApp CTA button (green #25D366, full-width). Right = contact form. Labels MUST all start at the same x-position; values MUST all start at the same x-position.
10. Footer — premium dark background (regardless of page theme). Large multi-column layout: col1 logo + tagline + 2-line business description, col2 "Navegación" with anchor links, col3 "Contacto" with address/phone/WhatsApp${hasHours ? ', col4 "Horario" with opening hours summary' : ''}${hasSocial ? `, col${hasHours ? '5' : '4'} "Síguenos" with inline SVG social icon links (${igHandle ? `Instagram @${igHandle}` : ''}${fbUrl ? ', Facebook' : ''}${ttHandle ? `, TikTok @${ttHandle}` : ''} — only present ones). Circular buttons 36×36px, semi-transparent bg, hover scale.` : ''}. Bottom bar full-width: copyright · legal links (Aviso Legal · Política de Privacidad · Política de Cookies) that open modal dialogs · ${poweredBySnippet.replace('- POWERED BY BADGE: inside the footer bottom bar, add a small tasteful link: ', '')}. Footer: generous padding (80px top), subtle top accent border in brand color. Include 3 hidden <dialog> modals with auto-generated Spanish legal boilerplate (LSSI + GDPR) using the real business name, address, and contact details. Modal open/close via <script>.

TECHNICAL REQUIREMENTS:
- Single self-contained HTML file — ALL CSS in a <style> tag, no external CSS files
- In <head>: <meta property="og:type" content="website"><meta property="og:title" content="${place.name}"><meta property="og:description" content="${place.editorial_summary?.overview?.slice(0, 150) || place.name}"><meta property="og:locale" content="${locale}">${heroPhoto ? `<meta property="og:image" content="${heroPhoto}">` : ''}<meta name="twitter:card" content="summary_large_image">
- Import 2-3 Google Fonts via @import (match brand personality, NOT Inter or Roboto)
- CSS custom properties in :root — apply TEMA rigorously
- scroll-behavior:smooth on html. Mobile-first (CSS Grid + Flexbox, breakpoints at 768px and 1200px)
- Fade-in animations: add class .fade{opacity:0;transform:translateY(22px);transition:opacity .65s ease,transform .65s ease} .fade.in{opacity:1;transform:none} to section headings and cards, then include EXACTLY this script before </body>: <script>const _ob=new IntersectionObserver(e=>e.forEach(i=>{if(i.isIntersecting){i.target.classList.add('in');_ob.unobserve(i.target)}}),{threshold:.12});document.querySelectorAll('.fade').forEach(e=>_ob.observe(e))</script>
- WhatsApp floating button (fixed, bottom-right, #25D366, pulse glow animation)${whatsapp ? `, href="https://wa.me/${whatsapp}"` : ''}
- Phone tel: links. Google Maps link: ${mapsUrl}
- Theme toggle button (id="yw-th") as last item in the right side of the nav bar: 32×32px borderless button, showing sun SVG in dark mode / moon SVG in light mode. Toggles class="dark" on <html>, persists to localStorage('yw_th'). Include inline <script>.
- ${contactFormSnippet.replace('BUSINESS_NAME_HERE', `'${place.name}'`)}${emailNote}
- ${cookieBannerSnippet}
- Schema.org JSON-LD for LocalBusiness in <head>: include name, address, phone, aggregateRating, openingHoursSpecification, priceRange ("${place.price_level ? '€'.repeat(place.price_level) : '€€'}")${isFood ? ', "@type":["Restaurant","LocalBusiness"], "servesCuisine":"Mediterránea/Española"' : ''}. Also FAQPage schema if FAQ section exists.
- ${responsiveSnippet}
- Semantic HTML5, all text in ${langName}
- NO Lorem Ipsum. NO broken image tags. NO external JavaScript libraries.
- CSS EFFICIENCY: no repetition, use custom properties, avoid verbose selectors`}

QUALITY: Top-tier Spanish digital agency — bold typographic choices, sophisticated palette, considered whitespace. Bespoke for THIS business, not a template.

Output ONLY raw HTML starting with <!DOCTYPE html>. No explanations. No markdown. No code fences.`
}

function getVerticalDesignDirection(vertical: Vertical): string {
  const directions: Record<Vertical, string> = {
    restaurant: `Warm, rich, appetizing. Think editorial food magazine meets Spanish bistro.
    Colors: Deep warm tones — terracotta, cream, warm white, rich brown. Gold accents.
    Typography: An elegant serif for headlines (Playfair Display, Cormorant, or Fraunces), clean sans for body.
    Layout: Full-bleed hero with photo overlay, generous whitespace, ingredients/dish names in italic serif.
    Mood: You can smell the food through the screen.`,

    bar: `Sophisticated and moody. Craft cocktail bar energy.
    Colors: Dark charcoal or near-black bg, gold/amber accents, cream text.
    Typography: A condensed bold display font (Bebas Neue, Barlow Condensed) for headlines, elegant sans for body.
    Layout: Dark hero, asymmetric sections, bold oversized type.
    Mood: Exclusive, after-hours, crafted.`,

    salon: `Elevated beauty. Aspirational but accessible.
    Colors: Soft neutral palette — warm white, blush, sage, champagne. One bold accent.
    Typography: A delicate serif or refined sans (Cormorant, DM Serif Display, Jost).
    Layout: Airy, minimal, lots of whitespace. Services in a clean editorial grid.
    Mood: You leave feeling like your best self.`,

    clinic: `Clinical trust meets human warmth.
    Colors: Pure white, cool teal-blue, soft sky, touches of warm grey.
    Typography: Clean humanist sans (Source Sans Pro, Nunito, DM Sans) — readable and reassuring.
    Layout: Clean cards, lots of padding, clear hierarchy.
    Mood: Professional, caring, competent.`,

    academy: `Inspiring and achievement-oriented.
    Colors: Deep navy or rich midnight blue, energetic yellow or orange accent, white.
    Typography: A strong geometric sans (Outfit, Plus Jakarta Sans) for headlines, readable body.
    Layout: Dynamic, progress-oriented sections, testimonials prominent.
    Mood: You can do this. We'll show you how.`,

    shop: `Fresh, commercial, inviting.
    Colors: Clean white base, one strong brand color, warm neutrals.
    Typography: Modern geometric sans (Poppins, Outfit) — friendly and clear.
    Layout: Product-thinking grid, clear CTAs, clean navigation.
    Mood: Want it. Buy it. Love it.`,

    workshop: `Industrial confidence. Expert craftsmanship.
    Colors: Dark greys, near-black, strong orange or red accent, metallic touches.
    Typography: A solid condensed sans or slab serif — mechanical, precise.
    Layout: Bold, structured, no-nonsense. Results-focused sections.
    Mood: You're in expert hands.`,

    generic: `Versatile premium professionalism.
    Colors: Sophisticated neutral base, strong indigo or deep blue accent, clean whites.
    Typography: A refined sans pairing (e.g., DM Serif Display + DM Sans) — premium but accessible.
    Layout: Clean, editorial, considered.
    Mood: Trustworthy, modern, quality.`,

    gym: `Athletic energy. Transformation machine.
    Colors: Near-black or deep charcoal base, electric accent (lime green #a3e635, neon orange, or electric blue), white text.
    Typography: A bold condensed display font (Barlow Condensed, Anton, or Bebas Neue) for headlines — commanding and powerful. Clean sans for body.
    Layout: Bold full-bleed hero with action/training photo, class schedule in structured grid, transformation testimonials prominent.
    Mood: Push limits. Feel the burn. Community of achievers.`,

    lawyer: `Authority meets precision.
    Colors: Deep navy (#1e3a5f) or charcoal, white, gold or burgundy accent — conservative but commanding.
    Typography: A classic serif (Libre Baskerville, EB Garamond, or Playfair Display) for headlines — gravitas and trust. Clean sans for body text.
    Layout: Formal but modern, practice areas as structured cards, partner/team credibility section, clear CTA for consultation.
    Mood: Trusted. Precise. On your side. Every word counts.`,

    hotel: `Aspirational escape. Premium hospitality.
    Colors: Warm cream (#faf7f2), deep forest green or midnight navy, gold accents, soft warm whites.
    Typography: An elegant serif for headlines (Cormorant Garamond, Bodoni Moda), refined sans for UI elements.
    Layout: Full-bleed hero with property photo, amenities in editorial cards, room types with pricing, location as lifestyle.
    Mood: Home away from home — but infinitely better. Every detail considered.`,

    pharmacy: `Trusted local health authority.
    Colors: Clean white, pharmacy green (#0d9e6e), light grey, minimal accent palette — clinical but welcoming.
    Typography: A clear humanist sans (Nunito, DM Sans, or Source Sans 3) — readable, friendly, professional.
    Layout: Services grid, prominent opening hours, location easy to find, health tips or categories.
    Mood: Reliable. Local. Caring. Your neighborhood health ally.`,
  }
  return directions[vertical] ?? directions['generic']
}

function getVerticalColor(vertical: Vertical): string {
  const colors: Record<Vertical, string> = {
    restaurant: '#c0392b',
    bar: '#8e44ad',
    salon: '#e91e8c',
    clinic: '#2980b9',
    academy: '#27ae60',
    shop: '#f39c12',
    workshop: '#2c3e50',
    gym: '#84cc16',
    lawyer: '#1e3a5f',
    hotel: '#b8860b',
    pharmacy: '#0d9e6e',
    generic: '#2563eb',
  }
  return colors[vertical] || '#2563eb'
}

function getVerticalStyle(vertical: Vertical): string {
  if (vertical === 'restaurant' || vertical === 'bar') return 'bold'
  if (vertical === 'salon' || vertical === 'hotel') return 'modern'
  if (vertical === 'clinic' || vertical === 'pharmacy') return 'minimal'
  if (vertical === 'gym') return 'bold'
  if (vertical === 'lawyer') return 'classic'
  return 'modern'
}
