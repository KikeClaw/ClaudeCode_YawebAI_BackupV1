import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { SiteData, Vertical, GooglePlaceData } from '@/types'
import { buildGenerationPrompt, buildHtmlGenerationPrompt } from './prompts'
import { getPhotoUrl } from '../google-places'
import { STYLE_PRESETS, type StylePresetKey } from '../style-presets'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const VALID_MODELS = [
  // Anthropic
  'claude-opus-4-7',
  'claude-sonnet-4-6',
  'claude-haiku-4-5-20251001',
  // OpenAI
  'gpt-4o',
  // Google
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  // Groq (free)
  'groq-llama-3.3-70b',
] as const

export type GenerationModel = typeof VALID_MODELS[number]

const HTML_SYSTEM = 'You are an elite web designer. Generate beautiful, production-quality HTML websites for Spanish local businesses. Output ONLY the raw HTML starting with <!DOCTYPE html> — no markdown, no explanation, no code fences. Write compact CSS (no comments, minimal whitespace) to stay within token limits. Always close every tag and end with </html>. ICONS: The platform auto-injects the Lucide icon library. Use <i data-lucide="ICON_NAME" style="width:NNpx;height:NNpx;display:inline-block;vertical-align:middle"></i> for ALL icons — never use emoji as icons. Available icons include: utensils, coffee, sun, moon, star, map-pin, phone, mail, clock, calendar, truck, package, car, users, baby, dog, tv, music, leaf, wine, beer, credit-card, smartphone, banknote, square-parking, warehouse, accessibility, armchair, sparkles, store, building-2, check, check-circle, arrow-right, chevron-down, x, menu, external-link, instagram, facebook, globe, heart, shield, award, zap, layers, and many more standard Lucide names. LAYOUT RULES (mandatory): (1) Photo/image grids MUST use grid-auto-flow:dense so no trailing empty cells appear. (2) All images inside grids or galleries MUST have width:100%;height:100%;object-fit:cover;display:block — never leave images at their natural size inside a grid cell. (3) Flex rows that contain multiple card siblings MUST have align-items:stretch so all cards reach the same height — never use align-items:flex-start on a card row. (4) Never set a fixed pixel height on a card or image container; use aspect-ratio or padding-bottom percentage instead. (5) Add overflow-x:hidden to body to prevent horizontal scroll. (6) CONTACT INFO ALIGNMENT: when displaying a list of contact details (address, phone, email, secondary contacts) inside a card or section, ALWAYS render them as a two-column CSS grid: display:grid;grid-template-columns:max-content 1fr;gap:6px 24px;align-items:baseline — labels in column 1 (font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap;opacity:.6), values in column 2. Never use auto-width <dl>, <table> with auto columns, or plain <div> stacking that breaks alignment. (7) CARD GRID SYMMETRY: when using a 3-column service, feature, or testimonial card grid, generate EXACTLY 3 or 6 cards — never 4, 5, 7, or 8. If content naturally gives 4 or 5 items, merge two into one combined card or add a logical extra to reach 6. If unavoidable, set justify-content:center on the grid so any partial last row centers rather than left-aligns. SELF-REVIEW (mandatory before closing </html>): Before writing the final </html> tag, verify every point and silently fix any issue — do not mention the review in the output: (A) CONTRAST — every text element has sufficient contrast against its background; GRADIENT CHECK: if a section has a CSS gradient background (linear-gradient), ensure the gradient reaches rgba(0,0,0,0.60) or darker at the position where white text sits — never let a gradient fade to white/light while white text is above it; nav links visible in both hero and scrolled states. PASTEL BG CHECK: if any section has a light pastel background (mint, cream, sage, beige, light teal, pale lavender), ALL body and paragraph text in that section MUST use a near-black color (e.g. #1a1a1a, #222, #2c2c2c — contrast ratio ≥4.5:1 WCAG AA). Never use medium grey (#888, #999, #aaa, rgba(0,0,0,0.4)) as body text on a pastel background — it will be unreadable. (B) CTA VISIBILITY — primary CTA button is prominent, above the fold on mobile, high-contrast colour; WhatsApp button is green (#25d366). (C) COMPLETENESS — hero has headline + subheadline + CTA; contact section has real phone/email from the brief; business name in <title> and nav logo; if a "Carta" nav link exists → a <section id="carta"> MUST exist; if a "Servicios" nav link exists → a <section id="servicios"> MUST exist. (D) MOBILE — no horizontal overflow; body font-size ≥ 15px; touch targets ≥ 44px tall. (E) IMAGES — every <img> inside a grid or flex container has object-fit:cover and defined height or aspect-ratio. (F) NAV ANCHORS — For EVERY <a href="#X"> in the nav bar, verify that <section id="X"> (or <div id="X">) EXISTS in the HTML. If not: either ADD the missing section before </body> or REMOVE the broken nav link. CANONICAL IDS (no accents, no spaces): nosotros · carta · servicios · horarios · resenas · faq · contacto · reservar · cita · caracteristicas · especialidades · ubicacion. NEVER use "reviews", "opiniones", "reseñas" (accented) — always "resenas". NEVER use "horario" — always "horarios". After fixing, recount nav links vs section ids. (G) CTA DEDUPLICATION — COUNT every booking-related <button> and styled <a> (background-color, padding, border-radius). The MAXIMUM allowed across the ENTIRE page = 2 buttons total: (1) the nav pill "Reservar/Cita" + (2) the single green WhatsApp button inside the reservar/cita section. If you have more than 2 styled booking buttons, convert the extras to plain anchor text links. The hero CTA MUST scroll to content (#carta or #servicios), NOT to #reservar — and MUST have a label different from the nav pill (use "Ver la carta →", "Descubrir", "Ver servicios", etc.). (H) NO EMPTY PLACEHOLDER DIVS: scan every div and section — if any element has only a background-color/border-radius/min-height but NO text, NO <img> tag, and NO background-image URL with an actual image path, it is an empty placeholder rectangle. Either fill it with a real photo from the available URLs or remove it entirely. An empty colored box is never acceptable.'

// ─── Cost table (USD per million tokens) ────────────────────────────────────
const COST_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-opus-4-7':           { input: 15,    output: 75   },
  'claude-sonnet-4-6':         { input: 3,     output: 15   },
  'claude-haiku-4-5-20251001': { input: 0.8,   output: 4    },
  'gpt-4o':                    { input: 2.5,   output: 10   },
  'gemini-2.5-flash':          { input: 0,     output: 0    },  // free tier
  'gemini-2.5-pro':            { input: 1.25,  output: 10   },
  'gemini-2.0-flash':          { input: 0.075, output: 0.3  },
  'groq-llama-3.3-70b':        { input: 0,     output: 0    },  // free tier
}

function calcCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = COST_PER_MTOK[model]
  if (!p) return 0
  return (inputTokens * p.input + outputTokens * p.output) / 1_000_000
}

export interface GenerationResult {
  html: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  truncated?: boolean
  /** Set when post-generation validation detects a quality problem (too short, no styles, placeholders…) */
  validationWarning?: string
  /** Issues found by Haiku post-generation AI audit (contrast, CTA, completeness, mobile, images) */
  aiValidationIssues?: string[]
  /** Prompt-cache stats — only set for Claude models */
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

// ─── AI post-generation validator (Haiku, ~0.006€ per call) ─────────────────
//
// Reads the full HTML and checks 5 quality criteria. Returns a list of issues
// described in Spanish. If all pass, returns []. Never blocks delivery —
// errors are silently swallowed so a Haiku failure never kills a good Opus site.

async function validateHtmlWithAi(html: string): Promise<string[]> {
  const prompt = `You are a quality auditor for single-page HTML websites. Check these 5 criteria. Return ONLY valid JSON — no markdown, no explanation.

HTML to audit (${html.length} chars):
${html.slice(0, 25000)}

Return exactly this shape — set issue to a short description when ok is false, else null:
{
  "contrast_ok": true,
  "contrast_issue": null,
  "cta_ok": true,
  "cta_issue": null,
  "completeness_ok": true,
  "completeness_issue": null,
  "mobile_ok": true,
  "mobile_issue": null,
  "images_ok": true,
  "images_issue": null
}

Criteria:
1. contrast_ok — false only if you find text with the same/near-same color as its background (white text on white section, invisible nav links, #fff on #fff)
2. cta_ok — false only if there is no phone/WhatsApp/email anchor near the top of the page, or the CTA button has no visible contrast
3. completeness_ok — false only if <title> is empty/generic OR hero is missing an <h1> headline
4. mobile_ok — false only if body lacks overflow-x:hidden OR an element has a fixed width > 500px with no max-width:100%
5. images_ok — false only if <img> tags inside display:grid or display:flex containers are missing object-fit:cover and have no defined height or aspect-ratio`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const p = JSON.parse(cleaned)

    const issues: string[] = []
    if (!p.contrast_ok     && p.contrast_issue)     issues.push(`Contraste: ${p.contrast_issue}`)
    if (!p.cta_ok          && p.cta_issue)          issues.push(`CTA: ${p.cta_issue}`)
    if (!p.completeness_ok && p.completeness_issue) issues.push(`Completitud: ${p.completeness_issue}`)
    if (!p.mobile_ok       && p.mobile_issue)       issues.push(`Móvil: ${p.mobile_issue}`)
    if (!p.images_ok       && p.images_issue)       issues.push(`Imágenes: ${p.images_issue}`)
    return issues
  } catch (err) {
    console.warn('[validator] AI validation failed (non-blocking):', err)
    return []
  }
}

/** Sanity-checks generated HTML before it reaches the database / customer preview. */
function validateGeneratedHtml(html: string): string | undefined {
  if (html.length < 4000) return 'too_short'
  if (!/<style[\s>]/i.test(html)) return 'no_styles'
  if (/lorem ipsum|\[describe\s|\[insert\s|\[add\s/i.test(html)) return 'has_placeholders'
  const sectionCount = (html.match(/<section/gi) ?? []).length
  if (sectionCount < 3) return 'too_few_sections'
  return undefined // all good
}

// ─── Build Report ─────────────────────────────────────────────────────────────

export type ReportStatus = 'yes' | 'no' | 'partial' | 'n/a'

export interface BuildReportRow {
  section: string       // human label
  emoji: string
  in_google: ReportStatus
  incorporated: ReportStatus
  detail?: string       // e.g. "10 disponibles, 8 usadas"
}

export interface BuildReport {
  generated_at: string
  model: string
  vertical: string
  business_name: string
  compact_mode: boolean
  rows: BuildReportRow[]
  stats: {
    photos_available: number
    photos_used: number
    reviews_available: number
    input_tokens: number
    output_tokens: number
    cost_usd: number
  }
}

function buildReportFromPlace(
  place: import('@/types').GooglePlaceData | null,
  vertical: string,
  model: string,
  compact: boolean,
  resolvedSocial: { instagram?: string; facebook?: string; tiktok?: string } | undefined,
  resolvedMenuText: string | undefined,
  websiteScraped: boolean,
  inputTokens: number,
  outputTokens: number,
  costUsd: number,
): BuildReport {
  const row = (
    section: string,
    emoji: string,
    in_google: ReportStatus,
    incorporated: ReportStatus,
    detail?: string,
  ): BuildReportRow => ({ section, emoji, in_google, incorporated, detail })

  const photos = place?.photos?.length ?? 0
  const photosUsed = compact ? Math.min(photos, 4) : Math.min(photos, 10)
  const reviews = place?.reviews?.length ?? 0
  const qualifiedReviews = place?.reviews?.filter(r => r.rating >= 4).length ?? 0

  const hasGenerativeSummary = !!place?.generative_summary
  const hasEditorial = !!place?.editorial_summary?.overview
  const hasReviewSummary = !!place?.review_summary
  const hasNeighborhoodSummary = !!place?.neighborhood_summary

  // Count attribute groups
  const serviceAttrs = [place?.dine_in, place?.outdoor_seating, place?.takeout, place?.delivery, place?.curbside_pickup, place?.reservable, place?.live_music].filter(Boolean).length
  const servedAttrs = [place?.serves_breakfast, place?.serves_brunch, place?.serves_lunch, place?.serves_dinner, place?.serves_coffee, place?.serves_beer, place?.serves_wine, place?.serves_cocktails, place?.serves_dessert, place?.serves_vegetarian_food].filter(Boolean).length
  const amenityAttrs = [place?.good_for_children, place?.menu_for_children, place?.good_for_groups, place?.allows_dogs, place?.restroom, place?.good_for_watching_sports].filter(Boolean).length
  const accessAttrs = [place?.wheelchair_accessible_entrance, place?.wheelchair_accessible_seating, place?.wheelchair_accessible_restroom, place?.wheelchair_accessible_parking].filter(Boolean).length
  const payAttrs = [place?.accepts_credit_cards, place?.accepts_debit_cards, place?.accepts_nfc, place?.accepts_cash_only].filter(Boolean).length
  const parkAttrs = [place?.free_parking_lot, place?.free_street_parking, place?.paid_parking_lot, place?.valet_parking, place?.free_garage_parking, place?.paid_garage_parking].filter(Boolean).length
  const totalAttrs = serviceAttrs + servedAttrs + amenityAttrs + accessAttrs + payAttrs + parkAttrs

  const rows: BuildReportRow[] = [
    // ── Identity ──────────────────────────────────────────────────────────
    row('Nombre del negocio',   '🏢', place?.name ? 'yes' : 'no',   place?.name ? 'yes' : 'n/a', place?.name),
    row('Dirección',            '📍', place?.formatted_address ? 'yes' : 'no', place?.formatted_address ? 'yes' : 'n/a', place?.formatted_address),
    row('Teléfono',             '📞', place?.formatted_phone_number ? 'yes' : 'no', place?.formatted_phone_number ? 'yes' : 'n/a', place?.formatted_phone_number),
    row('Tipo de negocio',      '🏷️', place?.primary_type_display_name ? 'yes' : 'no', place?.primary_type_display_name ? 'yes' : 'n/a', place?.primary_type_display_name),
    // ── Descriptions ──────────────────────────────────────────────────────
    row('Descripción AI Google','✨', hasGenerativeSummary ? 'yes' : 'no', hasGenerativeSummary ? 'yes' : 'n/a', hasGenerativeSummary ? 'generativeSummary disponible' : 'no disponible'),
    row('Descripción editorial','📝', hasEditorial ? 'yes' : 'no',         hasEditorial ? 'yes' : (hasGenerativeSummary ? 'n/a' : 'no'), hasEditorial ? 'editorialSummary disponible' : undefined),
    row('Resumen de reseñas AI','🤖', hasReviewSummary ? 'yes' : 'no',     hasReviewSummary ? 'yes' : 'n/a', hasReviewSummary ? 'reviewSummary disponible' : 'SKU Enterprise+Atm requerido'),
    row('Descripción del barrio','🏘️', hasNeighborhoodSummary ? 'yes' : 'no', hasNeighborhoodSummary ? 'yes' : 'n/a', hasNeighborhoodSummary ? 'disponible' : undefined),
    // ── Ratings & Reviews ─────────────────────────────────────────────────
    row('Rating de Google',     '⭐', place?.rating ? 'yes' : 'no', place?.rating ? 'yes' : 'n/a', place?.rating ? `${place.rating}/5 · ${place.user_ratings_total?.toLocaleString() || 0} reseñas` : undefined),
    row('Reseñas de clientes',  '💬', reviews > 0 ? 'yes' : 'no', qualifiedReviews >= 2 ? 'yes' : qualifiedReviews === 1 ? 'partial' : 'no', `${qualifiedReviews} reseñas ≥4★ incorporadas (${reviews} totales)`),
    // ── Media ─────────────────────────────────────────────────────────────
    row('Fotos del negocio',    '📸', photos > 0 ? 'yes' : 'no', photos > 0 ? 'yes' : 'no', photos > 0 ? `${photosUsed} usadas de ${photos} disponibles` : 'sin fotos → Unsplash fallback'),
    // ── Hours ─────────────────────────────────────────────────────────────
    row('Horarios de apertura', '🕐', place?.opening_hours ? 'yes' : 'no', place?.opening_hours ? 'yes' : 'n/a'),
    row('Horarios secundarios', '🚴', (place?.secondary_opening_hours?.length ?? 0) > 0 ? 'yes' : 'no', (place?.secondary_opening_hours?.length ?? 0) > 0 ? 'yes' : 'n/a', place?.secondary_opening_hours?.map(h => h.type).join(', ')),
    // ── Pricing ───────────────────────────────────────────────────────────
    row('Rango de precio',      '💶', (place?.price_range || place?.price_level) ? 'yes' : 'no', (place?.price_range || place?.price_level) ? 'yes' : 'n/a', place?.price_range || (place?.price_level ? '€'.repeat(place.price_level) : undefined)),
    // ── Menu ──────────────────────────────────────────────────────────────
    row('Carta / menú',           '🍽️', resolvedMenuText ? 'yes' : 'no', resolvedMenuText ? 'yes' : 'n/a', resolvedMenuText ? 'extraído del menuText o web' : 'no disponible'),
    // ── Website ───────────────────────────────────────────────────────────
    row('Web del negocio',      '🌐', place?.website ? 'yes' : 'no', websiteScraped ? 'yes' : (place?.website ? 'partial' : 'n/a'), place?.website ? (websiteScraped ? `${place.website}` : 'es URL social (no scrapeada)') : undefined),
    // ── Social ────────────────────────────────────────────────────────────
    row('Instagram',            '📷', resolvedSocial?.instagram ? 'yes' : 'no', resolvedSocial?.instagram ? 'yes' : 'n/a', resolvedSocial?.instagram ? `@${resolvedSocial.instagram}` : undefined),
    row('Facebook',             '👥', resolvedSocial?.facebook ? 'yes' : 'no', resolvedSocial?.facebook ? 'yes' : 'n/a', resolvedSocial?.facebook),
    row('TikTok',               '🎵', resolvedSocial?.tiktok ? 'yes' : 'no', resolvedSocial?.tiktok ? 'yes' : 'n/a', resolvedSocial?.tiktok ? `@${resolvedSocial.tiktok}` : undefined),
    // ── Google Maps ───────────────────────────────────────────────────────
    row('Mapa / coordenadas',   '🗺️', place?.geometry ? 'yes' : 'no', place?.geometry ? 'yes' : 'partial', place?.geometry ? `${place.geometry.location.lat.toFixed(4)}, ${place.geometry.location.lng.toFixed(4)}` : 'embed con dirección'),
    // ── Attributes ────────────────────────────────────────────────────────
    row('Características (atributos)', '✅', totalAttrs > 0 ? 'yes' : 'no', totalAttrs > 0 ? 'yes' : 'n/a', totalAttrs > 0 ? `${totalAttrs} atributos → sección chips` : 'sin atributos de Google'),
    row('  · Servicio (terraza, para llevar…)', '🏠', serviceAttrs > 0 ? 'yes' : 'no', serviceAttrs > 0 ? 'yes' : 'n/a', serviceAttrs > 0 ? `${serviceAttrs} opciones` : undefined),
    row('  · Qué sirven (café, vinos…)',        '🍴', servedAttrs > 0 ? 'yes' : 'no',  servedAttrs > 0 ? 'yes' : 'n/a',  servedAttrs > 0 ? `${servedAttrs} opciones` : undefined),
    row('  · Ambiente (familias, perros…)',      '✨', amenityAttrs > 0 ? 'yes' : 'no', amenityAttrs > 0 ? 'yes' : 'n/a', amenityAttrs > 0 ? `${amenityAttrs} opciones` : undefined),
    row('  · Accesibilidad',                    '♿', accessAttrs > 0 ? 'yes' : 'no',  accessAttrs > 0 ? 'yes' : 'n/a',  accessAttrs > 0 ? `${accessAttrs} opciones` : undefined),
    row('  · Formas de pago',                   '💳', payAttrs > 0 ? 'yes' : 'no',     payAttrs > 0 ? 'yes' : 'n/a',     payAttrs > 0 ? `${payAttrs} opciones` : undefined),
    row('  · Aparcamiento',                     '🅿️', parkAttrs > 0 ? 'yes' : 'no',    parkAttrs > 0 ? 'yes' : 'n/a',    parkAttrs > 0 ? `${parkAttrs} opciones` : undefined),
    // ── Always included ───────────────────────────────────────────────────
    row('Formulario de contacto','📬', 'n/a', 'yes', 'siempre incluido'),
    row('Burbuja WhatsApp',      '💬', place?.formatted_phone_number ? 'yes' : 'no', place?.formatted_phone_number ? 'yes' : 'partial', 'enlace wa.me directo'),
    row('Banner de cookies',     '🍪', 'n/a', 'yes', 'RGPD + LSSI'),
    row('Textos legales',        '⚖️', 'n/a', 'yes', 'Aviso Legal, Privacidad, Cookies'),
    row('Google Maps embed',     '🗺️', place?.geometry ? 'yes' : 'no', 'yes', 'iframe embed'),
    row('SEO / Open Graph',      '🔍', 'n/a', 'yes', 'og:title, og:description, og:image'),
  ].filter(r => r.in_google !== 'no' || r.incorporated !== 'n/a') // skip rows with nothing

  return {
    generated_at: new Date().toISOString(),
    model,
    vertical,
    business_name: place?.name ?? 'Negocio sin nombre',
    compact_mode: compact,
    rows,
    stats: {
      photos_available: photos,
      photos_used: photosUsed,
      reviews_available: reviews,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
    },
  }
}

type ProviderResult = {
  html: string
  inputTokens: number
  outputTokens: number
  truncated?: boolean
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

const MODEL_MAX_TOKENS: Record<string, number> = {
  'claude-opus-4-7': 32000,
  'claude-sonnet-4-6': 32000,         // Claude 4: supports 32k+ output
  'claude-haiku-4-5-20251001': 8000,  // Haiku: compact mode intentional (cost/speed for lead demos)
  'gpt-4o': 16000,                    // GPT-4o hard limit is 16,384 — keep at 16k
  'gemini-2.0-flash': 8000,           // Real API cap ~8,192 → set 8k so compact mode kicks in consistently
  'gemini-2.5-flash': 32000,          // Gemini 2.5 supports 65k output
  'gemini-2.5-pro': 32000,            // Gemini 2.5 supports 65k output
  'groq-llama-3.3-70b': 4500,         // free tier TPM limit: 12k total — input ~7k + output 4.5k = ~11.5k < 12k
}

// ─── Provider helpers ────────────────────────────────────────────────────────

async function generateWithClaude(prompt: string, model: string, styleDirective?: string): Promise<ProviderResult> {
  // ── Prompt caching — system blocks are cached for 5 min (Anthropic ephemeral)
  // HTML_SYSTEM is always static. styleDirective (preset promptDirective) is static
  // for a given preset and is shared across all businesses generated with it.
  // First call creates the cache (+25% on cached tokens); subsequent calls read at 10%.
  const systemBlocks: Anthropic.Messages.TextBlockParam[] = [
    { type: 'text', text: HTML_SYSTEM, cache_control: { type: 'ephemeral' as const } },
    ...(styleDirective?.trim()
      ? [{ type: 'text' as const, text: styleDirective, cache_control: { type: 'ephemeral' as const } }]
      : []),
  ]

  // Use streaming — required by Anthropic for long-running requests (>10 min / large max_tokens)
  const stream = anthropic.messages.stream({
    model,
    max_tokens: MODEL_MAX_TOKENS[model] ?? 7800,
    system: systemBlocks,
    messages: [{ role: 'user', content: prompt }],
  })
  const response = await stream.finalMessage()
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  if (response.stop_reason === 'max_tokens') {
    console.warn(`[generator] ⚠️ HTML TRUNCATED — model ${model} hit max_tokens (${MODEL_MAX_TOKENS[model]}). Output may be incomplete.`)
  }

  // Log cache performance for monitoring
  // The Anthropic SDK types don't expose cache fields yet — access via unknown cast
  const usageAny = response.usage as unknown as Record<string, number>
  const cacheRead   = usageAny.cache_read_input_tokens   ?? 0
  const cacheWrite  = usageAny.cache_creation_input_tokens ?? 0
  if (cacheRead > 0)  console.log(`[cache] ✅ ${cacheRead} tokens read from cache (saved ~${Math.round(cacheRead * 0.9 * (model.includes('opus') ? 15 : 3) / 1000000 * 100) / 100}€)`)
  if (cacheWrite > 0) console.log(`[cache] 📝 ${cacheWrite} tokens written to cache (model=${model}, preset directive=${!!styleDirective})`)

  return {
    html: text.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim(),
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    truncated: response.stop_reason === 'max_tokens',
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
  }
}

async function generateWithOpenAI(prompt: string, model: string): Promise<ProviderResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await client.chat.completions.create({
    model,
    max_tokens: MODEL_MAX_TOKENS[model] ?? 16000,
    messages: [
      { role: 'system', content: HTML_SYSTEM },
      { role: 'user', content: prompt },
    ],
  })
  const text = response.choices[0]?.message?.content ?? ''
  return {
    html: text.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim(),
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }
}

async function generateWithGemini(prompt: string, model: string): Promise<ProviderResult> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '')
  const gemini = genAI.getGenerativeModel({ model, systemInstruction: HTML_SYSTEM })
  const result = await gemini.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: MODEL_MAX_TOKENS[model] ?? 16000 },
  })
  const meta = result.response.usageMetadata
  const text = result.response.text()
  return {
    html: text.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim(),
    inputTokens: meta?.promptTokenCount ?? 0,
    outputTokens: meta?.candidatesTokenCount ?? 0,
  }
}

async function generateWithGroq(prompt: string): Promise<ProviderResult> {
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  })
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: MODEL_MAX_TOKENS['groq-llama-3.3-70b'],
    messages: [
      { role: 'system', content: HTML_SYSTEM },
      { role: 'user', content: prompt },
    ],
  })
  const text = response.choices[0]?.message?.content ?? ''
  return {
    html: text.replace(/^```html\n?/i, '').replace(/\n?```\s*$/i, '').trim(),
    inputTokens: response.usage?.prompt_tokens ?? 0,
    outputTokens: response.usage?.completion_tokens ?? 0,
  }
}

// ─── Two-pass enrichment ─────────────────────────────────────────────────────

// Extracts a design style guide from a reference website's HTML using Haiku
export async function extractStyleGuide(websiteHtml: string): Promise<string | null> {
  const prompt = `Analyze this website's HTML/CSS and extract a design style guide. Return ONLY valid JSON, no explanation.

HTML content (may be partial):
${websiteHtml.slice(0, 4000)}

Extract the visual design language and return:
{
  "colors": {
    "primary": "#hex — main brand/accent color",
    "bg": "#hex — page background",
    "surface": "#hex — card/section background",
    "text": "#hex — main text color"
  },
  "fonts": ["Font Name 1", "Font Name 2"],
  "style": "minimal" or "full",
  "vibe": "one phrase: e.g. elegant luxury, bold sporty, friendly casual, corporate professional",
  "sections": ["hero", "about", "services", ...],
  "layout": "single-column" or "multi-column",
  "notes": "2 sentences capturing the most distinctive visual traits to replicate"
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    JSON.parse(cleaned) // validate
    return cleaned
  } catch {
    return null
  }
}

/** Enrichment for context-only mode (no Google Places data) — runs on free-text business brief */
async function enrichContextData(extraContext: string, vertical: Vertical): Promise<string | null> {
  const prompt = `Extract marketing copy data for a website based on this business brief. Return ONLY valid JSON, no explanation.

Business brief:
${extraContext.slice(0, 2000)}

JSON (all fields in Spanish):
{
  "tagline": "catchy 5-8 word tagline inferred from the brief",
  "services": ["main service 1", "service 2", "service 3", "service 4"],
  "usps": ["unique selling point from brief", "usp 2", "usp 3"],
  "atmosphere": "2-sentence vibe/feel description",
  "highlights": ["key strength 1", "strength 2", "strength 3"],
  "faq_hints": ["specific question customers ask BEFORE contacting", "faq 2", "faq 3", "faq 4", "faq 5"],
  "trust_stats": ["credibility number e.g. '10+ años de experiencia'", "stat 2 if inferable", "stat 3"],
  "social_links": {"instagram": "@handle if mentioned in brief, else empty", "facebook": "URL if mentioned, else empty", "tiktok": "@handle if mentioned, else empty"}
}`
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 700,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try { JSON.parse(cleaned); return cleaned } catch { return null }
}

async function enrichBusinessData(place: GooglePlaceData, vertical: Vertical, websiteContent?: string): Promise<string | null> {
  const reviews = place.reviews
    ?.filter(r => r.rating >= 4)
    .slice(0, 5)
    .map(r => r.text.slice(0, 180))
    .join('\n---\n') || 'No reviews'

  const websiteBlock = websiteContent
    ? `\nCurrent website content (extract real menu items, prices, services, team info — use this as ground truth):\n${websiteContent.slice(0, 3000)}`
    : ''

  const menuField = (vertical === 'restaurant' || vertical === 'bar')
    ? ',\n  "menu_extract": "If website has a menu, copy the key items/prices here as plain text. Empty string if not found."'
    : ''

  // Best available description — generative_summary is richest (Enterprise+Atmosphere SKU)
  const description =
    place.generative_summary ??
    place.editorial_summary?.overview ??
    place.review_summary ??
    ''

  const richContext = [
    place.review_summary     && `Customer sentiment summary: ${place.review_summary}`,
    place.neighborhood_summary && `Neighbourhood context: ${place.neighborhood_summary}`,
    place.price_range        && `Price range: ${place.price_range}`,
    place.primary_type_display_name && `Business type: ${place.primary_type_display_name}`,
  ].filter(Boolean).join('\n')

  const prompt = `Extract marketing copy data for a website about "${place.name}" (${vertical}). Return ONLY valid JSON, no explanation.

Business: ${place.name} | ${vertical} | ${place.formatted_address}
Rating: ${place.rating ?? 'N/A'}/5 (${place.user_ratings_total ?? 0} reviews)
About: ${description}
${richContext ? `\nAdditional context:\n${richContext}` : ''}
Top reviews:
${reviews}${websiteBlock}

JSON (all fields in Spanish):
{
  "tagline": "catchy 5-8 word tagline for THIS specific business",
  "services": ["main service/product 1", "service 2", "service 3", "service 4"],
  "usps": ["what makes them unique based on reviews", "usp 2", "usp 3"],
  "atmosphere": "2-sentence vibe/feel description customers would use",
  "highlights": ["what customers praise most in reviews", "highlight 2", "highlight 3"],
  "faq_hints": ["specific question customers ask BEFORE calling (from reviews)", "faq 2", "faq 3", "faq 4", "faq 5"],
  "trust_stats": ["a credibility number e.g. '4.8★ en Google' or '500+ clientes' or '15 años' (infer from reviews if mentioned, else use rating/count)", "trust stat 2", "trust stat 3"],
  "social_links": {"instagram": "@handle or profile URL found in website content, empty string if not found", "facebook": "URL found in website content, empty string if not found", "tiktok": "@handle found in website content, empty string if not found"}${menuField}
}`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    JSON.parse(cleaned)
    return cleaned
  } catch {
    return null // AI returned malformed JSON — skip enrichment
  }
}

// ─── Post-processing helpers ─────────────────────────────────────────────────

function formatWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  // Strip international dialing prefix (0044... → 44..., 0034... → 34...)
  const stripped = digits.startsWith('00') ? digits.slice(2) : digits
  if (stripped.length <= 9) return `34${stripped}` // Spanish local → prepend +34
  return stripped
}

function buildLocalBusinessJsonLd(place: GooglePlaceData, vertical: Vertical, heroPhoto?: string): string {
  const typeMap: Record<Vertical, string | string[]> = {
    restaurant: ['Restaurant', 'LocalBusiness'],
    bar: ['BarOrPub', 'LocalBusiness'],
    salon: 'BeautySalon',
    clinic: 'MedicalClinic',
    gym: 'SportsActivityLocation',
    lawyer: 'LegalService',
    hotel: 'Hotel',
    pharmacy: 'Pharmacy',
    academy: 'EducationalOrganization',
    shop: 'Store',
    workshop: 'AutoRepair',
    generic: 'LocalBusiness',
  }
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': typeMap[vertical] ?? 'LocalBusiness',
    name: place.name,
    address: { '@type': 'PostalAddress', streetAddress: place.formatted_address, addressCountry: 'ES' },
  }
  if (place.formatted_phone_number) schema.telephone = place.formatted_phone_number
  if (place.website) schema.url = place.website
  if (place.rating) schema.aggregateRating = {
    '@type': 'AggregateRating',
    ratingValue: place.rating,
    reviewCount: place.user_ratings_total ?? 0,
    bestRating: 5,
  }
  if (place.geometry?.location) schema.geo = {
    '@type': 'GeoCoordinates',
    latitude: place.geometry.location.lat,
    longitude: place.geometry.location.lng,
  }
  if (place.opening_hours?.weekday_text?.length) {
    const schDayMap: Record<string, string> = {
      'lunes': 'Monday', 'martes': 'Tuesday', 'miércoles': 'Wednesday', 'jueves': 'Thursday',
      'viernes': 'Friday', 'sábado': 'Saturday', 'domingo': 'Sunday',
      'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday',
      'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday',
    }
    const specs = place.opening_hours.weekday_text.map(line => {
      const lower = line.toLowerCase()
      const dayKey = Object.keys(schDayMap).find(k => lower.startsWith(k))
      if (!dayKey) return null
      const dayOfWeek = `https://schema.org/${schDayMap[dayKey]}`
      if (lower.includes('cerrado') || lower.includes('closed')) {
        return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens: '00:00', closes: '00:00' }
      }
      const timePart = line.split(':').slice(1).join(':').trim()
      const match = timePart.match(/(\d{1,2}:\d{2})\s*[–\-]\s*(\d{1,2}:\d{2})/)
      if (!match) return null
      return { '@type': 'OpeningHoursSpecification', dayOfWeek, opens: match[1], closes: match[2] }
    }).filter(Boolean)
    if (specs.length) schema.openingHoursSpecification = specs
    else schema.openingHours = place.opening_hours.weekday_text
  }
  if (place.price_level) schema.priceRange = '€'.repeat(place.price_level)
  if (heroPhoto) schema.image = heroPhoto
  return `<script type="application/ld+json">${JSON.stringify(schema)}<\/script>`
}

// Shared WA message per vertical — includes "vengo de vuestra web" for attribution
function getWaMessage(vertical: Vertical): string {
  const messages: Partial<Record<Vertical, string>> = {
    restaurant: 'Hola, vengo de vuestra web y quiero hacer una reserva.',
    bar:        'Hola, vengo de vuestra web. ¿Tenéis disponibilidad esta noche?',
    salon:      'Hola, vengo de vuestra web y quiero pedir cita.',
    clinic:     'Hola, vengo de vuestra web y quiero pedir cita.',
    gym:        'Hola, vengo de vuestra web y quiero información sobre tarifas.',
    lawyer:     'Hola, vengo de vuestra web y quisiera solicitar una primera consulta.',
    hotel:      'Hola, vengo de vuestra web y quiero consultar disponibilidad y precios.',
    pharmacy:   'Hola, vengo de vuestra web y quiero consultar sobre un producto.',
    academy:    'Hola, vengo de vuestra web y quiero información sobre vuestros cursos.',
    shop:       'Hola, vengo de vuestra web y quisiera más información sobre vuestros productos.',
    workshop:   'Hola, vengo de vuestra web y quiero solicitar un presupuesto.',
  }
  return messages[vertical] ?? 'Hola, vengo de vuestra web y quisiera más información.'
}

// ── New post-processing helpers ───────────────────────────────────────────────

// GA4 analytics snippet — uses our shared Measurement ID
function buildGA4Snippet(measurementId: string): string {
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${measurementId}',{anonymize_ip:true})</script>`
}

// Comprehensive Schema.org LocalBusiness JSON-LD built from real Places API data
function buildLocalBusinessSchema(place: GooglePlaceData, vertical: Vertical): string {
  const typeMap: Partial<Record<Vertical, string>> = {
    restaurant: 'Restaurant', bar: 'BarOrPub', salon: 'BeautySalon',
    clinic: 'MedicalClinic', pharmacy: 'Pharmacy', gym: 'HealthClub',
    lawyer: 'LegalService', hotel: 'Hotel',
    academy: 'EducationalOrganization', workshop: 'AutoRepair',
    shop: 'Store', generic: 'LocalBusiness',
  }
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

  // Note: p.open.time / p.close.time can be undefined for 24/7 businesses or incomplete API data
  const hours = (place.opening_hours?.periods ?? []).map(p => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: DAYS[p.open?.day ?? 0],
    opens:  p.open?.time?.replace(/(\d{2})(\d{2})/, '$1:$2') ?? '00:00',
    closes: p.close?.time?.replace(/(\d{2})(\d{2})/, '$1:$2') ?? '23:59',
  }))

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': typeMap[vertical] ?? 'LocalBusiness',
    name: place.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: place.formatted_address,
    },
  }

  if (place.formatted_phone_number || place.international_phone_number)
    schema.telephone = place.formatted_phone_number ?? place.international_phone_number
  if (place.website) schema.url = place.website
  if (place.google_maps_uri) schema.hasMap = place.google_maps_uri
  if (place.geometry?.location) {
    schema.geo = { '@type': 'GeoCoordinates',
      latitude: place.geometry.location.lat, longitude: place.geometry.location.lng }
  }
  if (place.rating && place.user_ratings_total) {
    schema.aggregateRating = { '@type': 'AggregateRating',
      ratingValue: place.rating, reviewCount: place.user_ratings_total, bestRating: 5 }
  }
  if (hours.length) schema.openingHoursSpecification = hours
  if (place.price_range) schema.priceRange = place.price_range
  else if (place.price_level) schema.priceRange = '€'.repeat(place.price_level)

  return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`
}

// Open Graph + Twitter card meta tags
function buildOpenGraphTags(name: string, description: string): string {
  const safe = (s: string) => s.replace(/"/g, '&quot;').replace(/</g, '&lt;').slice(0, 200)
  return [
    `<meta property="og:type" content="business.business" />`,
    `<meta property="og:title" content="${safe(name)}" />`,
    `<meta property="og:description" content="${safe(description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safe(name)}" />`,
    `<meta name="twitter:description" content="${safe(description)}" />`,
  ].join('\n  ')
}

// Star rating badge — shown in hero area after <h1>
function buildRatingBadge(rating: number, total: number): string {
  const stars = Array.from({ length: 5 }, (_, i) =>
    `<span style="color:${i < Math.round(rating) ? '#f59e0b' : '#d1d5db'}">★</span>`
  ).join('')
  const count = total >= 1000 ? (total / 1000).toFixed(1) + 'k' : String(total)
  // Uses site CSS vars so it blends with any preset theme
  return `<div id="yw-rb" style="display:inline-flex;align-items:center;gap:8px;background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);border-radius:9999px;padding:7px 16px;font-size:13px;font-weight:600;color:var(--text,#374151);margin:10px 0;flex-wrap:wrap"><span style="display:flex;gap:1px;line-height:1">${stars}</span><span>${rating.toFixed(1)}</span><span style="opacity:.5;font-weight:400">·</span><span style="font-weight:500">${count} reseñas en Google</span></div>`
}

// "Cómo llegar" button — injected before Google Maps iframe
function buildDirectionsButton(placeId: string, address: string): string {
  const dest = placeId
    ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${encodeURIComponent(placeId)}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
  // CSS-class hover so we can use CSS vars (inline onmouseover can't resolve var())
  return `<style>#yw-dir a{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:var(--surface,#fff);border:1.5px solid var(--border,#e5e7eb);border-radius:8px;font-size:14px;font-weight:600;color:var(--text,#374151);text-decoration:none;transition:all .2s}#yw-dir a:hover{border-color:var(--accent,#2563eb);color:var(--accent,#2563eb);background:var(--accent-light,rgba(79,70,229,.06))}</style><div id="yw-dir" style="margin-bottom:12px"><a href="${dest}" target="_blank" rel="noopener"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>Cómo llegar</a></div>`
}

// Animated reviews carousel — horizontal drag-scroll with auto-play
function buildReviewsCarousel(reviews: Array<{ author_name: string; rating: number; text: string; relative_time_description: string }>): string {
  const cards = reviews.filter(r => r.text?.length > 30).slice(0, 6)
  if (cards.length < 2) return ''
  const cardHtml = cards.map((r, i) => {
    const stars = Array.from({ length: 5 }, (_, j) =>
      `<span style="color:${j < r.rating ? '#f59e0b' : '#d1d5db'}">★</span>`
    ).join('')
    const snippet = r.text.length > 160 ? r.text.slice(0, 157) + '…' : r.text
    const initials = r.author_name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    // Avatar bg colors stay vibrant — they're identity colors, not theme colors
    const colors = ['#7c3aed','#0369a1','#065f46','#9a3412','#be185d','#1d4ed8']
    const bg = colors[i % colors.length]
    // Card bg/border/text use site CSS vars so cards match the active preset theme
    return `<div class="yw-rc-c" data-i="${i}" style="flex:0 0 290px;background:var(--surface,#fff);border:1.5px solid var(--border,#f1f5f9);border-radius:16px;padding:22px;box-shadow:0 2px 12px rgba(0,0,0,.05);display:flex;flex-direction:column;gap:10px;scroll-snap-align:start"><div style="display:flex;gap:2px">${stars}</div><p style="font-size:13px;color:var(--muted,#374151);line-height:1.65;margin:0;flex:1">&ldquo;${snippet}&rdquo;</p><div style="display:flex;align-items:center;gap:10px;margin-top:4px"><div style="width:32px;height:32px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0">${initials}</div><div><div style="font-size:12px;font-weight:600;color:var(--text,#111)">${r.author_name}</div><div style="font-size:10px;color:var(--muted,#9ca3af)">${r.relative_time_description}</div></div><svg style="margin-left:auto;flex-shrink:0" width="14" height="14" viewBox="0 0 24 24"><path fill="#4285f4" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.34 5 12c0-4.59 3.53-7.27 7.21-7.27 3.08 0 4.9 1.41 4.9 1.41l1.99-2.14C17.01 2.38 14.58 1 12.16 1 6.15 1 1 6.14 1 12s5.15 11 11.21 11c6.21 0 10.52-4.14 10.52-10.22 0-.73-.08-1.43-.38-1.68z"/></svg></div></div>`
  }).join('')
  // Initial dots — active dot gets accent, JS will update them using runtime CSS var value
  const dots = cards.map((_, i) => `<button onclick="ywRcGo(${i})" id="yw-rc-d${i}" aria-label="Reseña ${i+1}" style="width:${i === 0 ? '20px' : '8px'};height:8px;border-radius:9999px;border:none;background:${i === 0 ? 'var(--accent,#2563eb)' : 'var(--border,#d1d5db)'};cursor:pointer;padding:0;transition:all .3s"></button>`).join('')
  return `<section id="yw-rc" style="padding:56px 24px 48px;background:var(--surface,#f8fafc);overflow:hidden" role="region" aria-label="Reseñas de clientes"><div style="max-width:1080px;margin:0 auto"><h2 style="text-align:center;font-size:1.5rem;font-weight:800;color:var(--text,#111);margin:0 0 28px;letter-spacing:-.03em">Lo que dicen nuestros clientes</h2><div id="yw-rc-t" style="display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;padding:4px 2px 8px;cursor:grab">${cardHtml}</div><div style="display:flex;justify-content:center;gap:6px;margin-top:16px">${dots}</div></div><style>#yw-rc-t::-webkit-scrollbar{display:none}#yw-rc-t.drag{cursor:grabbing}.yw-rc-c:hover{box-shadow:0 8px 24px rgba(0,0,0,.1)!important;transform:translateY(-2px);transition:all .2s}</style><script>(function(){var t=document.getElementById('yw-rc-t');var n=${cards.length};var cur=0;var cs=getComputedStyle(document.documentElement);var accentCol=cs.getPropertyValue('--accent').trim()||'#2563eb';var borderCol=cs.getPropertyValue('--border').trim()||'#d1d5db';window.ywRcGo=function(i){cur=i;var c=t.querySelector('[data-i="'+i+'"]');if(c)t.scrollTo({left:c.offsetLeft-t.offsetLeft,behavior:'smooth'});for(var j=0;j<n;j++){var d=document.getElementById('yw-rc-d'+j);if(d){d.style.width=j===i?'20px':'8px';d.style.background=j===i?accentCol:borderCol;d.setAttribute('aria-current',j===i?'true':'false')}}};var drag=false,sx=0,sl=0;t.addEventListener('mousedown',function(e){drag=true;t.classList.add('drag');sx=e.pageX-t.offsetLeft;sl=t.scrollLeft});document.addEventListener('mouseup',function(){drag=false;t.classList.remove('drag')});t.addEventListener('mousemove',function(e){if(!drag)return;e.preventDefault();t.scrollLeft=sl-(e.pageX-t.offsetLeft-sx)*1.5});var iv=setInterval(function(){cur=(cur+1)%n;ywRcGo(cur)},4500);t.addEventListener('mouseenter',function(){clearInterval(iv)});t.addEventListener('mouseleave',function(){iv=setInterval(function(){cur=(cur+1)%n;ywRcGo(cur)},4500)})})()</script></section>`
}

// Footer trust badges + yaweb.ai credit
function buildFooterBadges(): string {
  const lockSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="11" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  const shieldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`
  const zapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  return `<div id="yw-fb" style="border-top:1px solid rgba(128,128,128,.15);margin-top:28px;padding-top:18px;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:20px"><span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:600;opacity:.45">${lockSvg} SSL Seguro</span><span style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:600;opacity:.45">${shieldSvg} Google Verified</span><a href="https://yaweb.ai" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:600;opacity:.45;text-decoration:none;color:inherit;transition:opacity .2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='.45'">${zapSvg} Creado con yaweb.ai</a></div>`
}

function buildWhatsAppFloat(waNumber: string, vertical: Vertical = 'generic'): string {
  const msg = encodeURIComponent(getWaMessage(vertical))
  return `<style>@keyframes yw-pulse{0%,100%{box-shadow:0 4px 16px rgba(37,211,102,.45),0 0 0 0 rgba(37,211,102,.35)}65%{box-shadow:0 4px 16px rgba(37,211,102,.45),0 0 0 10px rgba(37,211,102,0)}}#yw-wa{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:#25d366;color:#fff;text-decoration:none;transition:transform .2s,box-shadow .2s;animation:yw-pulse 2.8s ease-in-out infinite}#yw-wa:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,.6);animation:none}#yw-wa svg{width:30px;height:30px;fill:currentColor}</style><a id="yw-wa" href="https://wa.me/${waNumber}?text=${msg}" target="_blank" rel="noopener" aria-label="Contactar por WhatsApp"><svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>`
}

// Email form handler — intercepts submit, POSTs JSON to /api/contact, shows toast
function buildFormEmailHandler(contactEmail: string, businessName: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'
  const safeName = businessName.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  const safeEmail = contactEmail.replace(/'/g, "\\'")
  return `<script id="yw-fe">(function(){
  var API='${appUrl}/api/contact';
  document.querySelectorAll('form').forEach(function(f){
    if(f.closest('#yw-bk'))return;
    f.addEventListener('submit',function(e){
      e.preventDefault();
      var data={_to:'${safeEmail}',_site:'${safeName}'};
      new FormData(f).forEach(function(v,k){data[k]=v});
      var btn=f.querySelector('[type=submit]');
      if(btn){btn.disabled=true;btn.textContent='Enviando…';}
      fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
        .then(function(r){return r.json()})
        .then(function(r){showToast(r.ok)})
        .catch(function(){showToast(false)})
        .finally(function(){if(btn){btn.disabled=false;btn.textContent=btn.dataset.label||'Enviar';}});
    });
    var btn=f.querySelector('[type=submit]');
    if(btn)btn.dataset.label=btn.textContent;
  });
  function showToast(ok){
    var t=document.createElement('div');
    t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:99999;background:'+(ok?'#16a34a':'#dc2626')+';color:#fff;padding:14px 24px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.2);display:flex;align-items:center;gap:8px;white-space:nowrap';
    t.textContent=ok?'✓  Mensaje enviado correctamente':'✗  Error al enviar. Por favor llámanos.';
    document.body.appendChild(t);
    setTimeout(function(){t.remove()},5000);
  }
})()</script>`
}

// Booking widget — Calendly inline or generic CTA button
function buildBookingWidget(bookingUrl: string): string {
  const isCalendly = bookingUrl.includes('calendly.com')
  const heading = 'Reserva tu cita online'
  const sub = isCalendly
    ? 'Elige el día y hora que mejor te venga. Rápido y sin compromiso.'
    : 'Elige el día y hora que mejor te venga desde nuestra agenda online.'

  // Uses CSS vars so the section blends with the active preset theme
  const inner = isCalendly
    ? `<div class="calendly-inline-widget" data-url="${bookingUrl}" style="min-width:320px;height:700px;"></div>
    <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>`
    : `<a href="${bookingUrl}" target="_blank" rel="noopener" style="display:inline-block;padding:14px 36px;background:var(--accent,#2563eb);color:var(--accent-fg,#fff);border-radius:8px;font-weight:600;font-size:1rem;text-decoration:none;transition:opacity .2s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">Reservar cita →</a>`

  return `<section id="yw-bk" style="padding:60px 24px;background:var(--surface,#f8fafc);text-align:center;">
  <div style="max-width:900px;margin:0 auto;">
    <h2 style="margin:0 0 8px;font-size:1.75rem;font-weight:700;color:var(--text,#0f172a);">${heading}</h2>
    <p style="color:var(--muted,#64748b);margin:0 0 28px;font-size:1rem;">${sub}</p>
    ${inner}
  </div>
</section>`
}

// Sticky mobile bar — fixed bottom on mobile with call + WhatsApp buttons
function buildStickyMobileBar(phone: string, waNum: string, vertical: Vertical): string {
  const msg = encodeURIComponent(getWaMessage(vertical))
  const waUrl = `https://wa.me/${waNum}?text=${msg}`
  const waSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`
  const phoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.63 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.21 6.21l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`
  const cols = (phone ? 1 : 0) + (waNum ? 1 : 0)
  const callBtn = phone ? `<a href="tel:${phone}" id="yw-mb-call" aria-label="Llamar">${phoneSvg}<span>Llamar</span></a>` : ''
  const waBtn  = waNum  ? `<a href="${waUrl}" id="yw-mb-wa" target="_blank" rel="noopener" aria-label="WhatsApp">${waSvg}<span>WhatsApp</span></a>` : ''
  // Uses CSS vars + env(safe-area-inset-bottom) for iOS notch compatibility
  return `<div id="yw-mb"><style>#yw-mb{position:fixed;bottom:0;left:0;right:0;z-index:9996;display:none;grid-template-columns:repeat(${cols},1fr);border-top:1px solid var(--border,rgba(0,0,0,.1));box-shadow:0 -2px 20px rgba(0,0,0,.1);padding-bottom:env(safe-area-inset-bottom,0px)}@media(max-width:767px){#yw-mb{display:grid!important}body{padding-bottom:calc(60px + env(safe-area-inset-bottom,0px))!important}#yw-wa{bottom:calc(80px + env(safe-area-inset-bottom,0px))!important}}#yw-mb a{display:flex;align-items:center;justify-content:center;gap:8px;padding:15px;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:.01em}#yw-mb-call{background:var(--surface,#f1f5f9);color:var(--text,#1e293b);border-right:1px solid var(--border,rgba(0,0,0,.06))}#yw-mb-wa{background:#25d366;color:#fff}</style>${callBtn}${waBtn}</div>`
}

// Form → WhatsApp interceptor — intercepts contact form submit and routes to WA
function buildFormInterceptor(waNum: string): string {
  return `<script id="yw-fi">document.addEventListener('DOMContentLoaded',function(){var wa='${waNum}';document.querySelectorAll('form').forEach(function(f){var id=(f.id||'').toLowerCase(),cl=(f.className||'').toLowerCase();if(id.includes('cookie')||id.includes('legal')||id.includes('gdpr')||cl.includes('cookie')||cl.includes('modal')||cl.includes('gdpr')) return;if(f.action&&f.action!==''&&f.action!=='#'&&!f.action.includes(location.hostname)&&!f.action.includes('api/contact')) return;f.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation();var fd=new FormData(f),lines=['\uD83D\uDCCB Contacto desde la web:',''];fd.forEach(function(v,k){if(v&&typeof v==='string'&&v.trim()&&!['_next','_subject','_cc','_replyto','_gotcha','_honeypot'].includes(k)){var l=k.charAt(0).toUpperCase()+k.slice(1).replace(/[_-]/g,' ');lines.push(l+': '+v.trim())}});window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(lines.join('\n')),'_blank');f.innerHTML='<div style="text-align:center;padding:48px 24px 40px"><div style="width:60px;height:60px;border-radius:50%;background:rgba(37,211,102,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 18px"><svg xmlns=\\'http://www.w3.org/2000/svg\\'width=\\'28\\'height=\\'28\\'viewBox=\\'0 0 24 24\\'fill=\\'none\\'stroke=\\'#25d366\\'stroke-width=\\'2\\'stroke-linecap=\\'round\\'stroke-linejoin=\\'round\\'><path d=\\'M22 11.08V12a10 10 0 1 1-5.93-9.14\\'/><polyline points=\\'22 4 12 14.01 9 11.01\\'/></svg></div><h3 style=\\'margin:0 0 8px;color:var(--text,#111);font-size:20px;font-weight:700\\'>¡Mensaje enviado!</h3><p style=\\'color:var(--muted,#666);margin:0;font-size:14px;line-height:1.5\\'>Hemos abierto WhatsApp para que puedas enviarnos tu consulta directamente.</p></div>'},true)})})}<\/script>`
}

// "Abierto ahora" real-time status badge — uses structured periods data from Google Places
// periods.time format: "HHMM" string e.g. "0830" = 08:30
function buildOpenNowWidget(periods: Array<{open:{day:number,time:string}, close?:{day:number,time:string}}>): string {
  const periodsJson = JSON.stringify(periods)
  // In JS: parse "0830" → hours=8, mins=30 → total minutes = 8*60+30
  return `<script id="yw-on">(function(){var p=${periodsJson};if(!p||!p.length)return;var now=new Date(),day=now.getDay(),mins=now.getHours()*60+now.getMinutes();function tm(t){var h=parseInt(t.slice(0,2),10),m=parseInt(t.slice(2),10);return h*60+m}function fmt(t){return t.slice(0,2)+':'+t.slice(2)}var open=false,closeAt=null,nextOpen=null;p.forEach(function(r){var od=r.open.day,om=tm(r.open.time),cd=r.close?r.close.day:-1,cm=r.close?tm(r.close.time):-1;if(od===day&&mins>=om&&(cd!==day||mins<cm)){open=true;if(r.close)closeAt=fmt(r.close.time);}var prevDay=(day+6)%7;if(cd===day&&od===prevDay&&mins<cm){open=true;if(r.close)closeAt=fmt(r.close.time);}});if(!open){var fw=p.filter(function(r){var om=tm(r.open.time);return r.open.day>day||(r.open.day===day&&om>mins);}).sort(function(a,b){return(a.open.day*1440+tm(a.open.time))-(b.open.day*1440+tm(b.open.time))});if(!fw.length)fw=p.slice().sort(function(a,b){return(a.open.day*1440+tm(a.open.time))-(b.open.day*1440+tm(b.open.time))});if(fw.length)nextOpen=fmt(fw[0].open.time);}var el=document.createElement('div');el.id='yw-on';el.style.cssText='display:inline-flex;align-items:center;gap:7px;padding:6px 14px;border-radius:100px;font-size:13px;font-weight:600;margin-bottom:14px;';var dot='<span style="width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block;';if(open){el.style.background='rgba(34,197,94,.12)';el.style.color='#15803d';el.innerHTML=dot+'background:#22c55e;animation:yw-p 2s ease infinite"></span>'+(closeAt?'Abierto \xB7 Cierra a las '+closeAt:'Abierto ahora');}else{el.style.background='rgba(239,68,68,.1)';el.style.color='#dc2626';el.innerHTML=dot+'background:#ef4444"></span>'+(nextOpen?'Cerrado \xB7 Abre a las '+nextOpen:'Cerrado');}var s=document.createElement('style');s.textContent='@keyframes yw-p{0%,100%{opacity:1}50%{opacity:.35}}';document.head.appendChild(s);var h=document.getElementById('horarios')||document.querySelector('[id*="horario"],[class*="horario"],[id*="schedule"],[class*="hours"],[id*="hours"]');if(h)h.insertBefore(el,h.firstChild);})()</script>`
}

// Gallery lightbox — click any gallery image to open full-size overlay
function buildGalleryLightbox(): string {
  return `<div id="yw-lb" style="display:none;position:fixed;inset:0;z-index:99990;background:rgba(0,0,0,.92);align-items:center;justify-content:center;cursor:zoom-out"><img id="yw-lb-i" style="max-width:92vw;max-height:88vh;object-fit:contain;border-radius:6px;box-shadow:0 24px 80px rgba(0,0,0,.6);cursor:default" alt=""><button onclick="document.getElementById('yw-lb').style.display='none';document.body.style.overflow=''" style="position:absolute;top:16px;right:16px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.15);color:#fff;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:24px;line-height:1;display:flex;align-items:center;justify-content:center;padding:0">&times;</button></div><script id="yw-lb-js">(function(){var lb=document.getElementById('yw-lb'),img=document.getElementById('yw-lb-i');if(!lb)return;lb.addEventListener('click',function(e){if(e.target===lb){lb.style.display='none';document.body.style.overflow=''}});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&lb.style.display==='flex'){lb.style.display='none';document.body.style.overflow=''}});document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('[class*="galeri"] img,[class*="gallery"] img,[class*="grid"] img,[class*="foto"] img,[id*="galeri"] img,[id*="gallery"] img,[id*="fotos"] img,[class*="photo"] img,[class*="imagen"] img').forEach(function(i){if(i.closest('#yw-lb'))return;i.style.cursor='zoom-in';i.addEventListener('click',function(){img.src=i.src.replace(/w=\d+/,'w=1600').replace(/&q=\d+/,'&q=90');lb.style.display='flex';document.body.style.overflow='hidden'})})});})()</script>`
}

function buildGdprBanner(): string {
  return `<div id="yw-gdpr" style="display:none;position:fixed;bottom:0;left:0;right:0;z-index:9998;background:#1a1a2e;color:#e2e8f0;padding:14px 24px;align-items:center;gap:16px;flex-wrap:wrap;font-size:13px;font-family:system-ui,sans-serif"><span style="flex:1;min-width:180px">Usamos cookies para mejorar tu experiencia.</span><div style="display:flex;gap:8px;flex-shrink:0"><button id="yw-gdpr-ok" style="background:#4f46e5;color:#fff;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">Aceptar</button><button id="yw-gdpr-no" style="background:transparent;color:#94a3b8;border:1px solid #334155;padding:8px 18px;border-radius:8px;font-size:13px;cursor:pointer">Solo esenciales</button></div></div><script>(function(){if(localStorage.getItem('yw_cookies'))return;var b=document.getElementById('yw-gdpr');if(b)b.style.display='flex';['yw-gdpr-ok','yw-gdpr-no'].forEach(function(id,i){document.getElementById(id)?.addEventListener('click',function(){localStorage.setItem('yw_cookies',i===0?'all':'essential');document.getElementById('yw-gdpr').style.display='none'})})})()<\/script>`
}

// ─── Main generation function ────────────────────────────────────────────────

export async function generateHtmlSite(
  place: GooglePlaceData | null,
  vertical: Vertical,
  extraContext?: string,
  model: GenerationModel = 'claude-sonnet-4-6',
  siteTheme: 'light' | 'dark' = 'light',
  whatsapp?: string,
  contactEmail?: string,
  styleVariant: 'A' | 'B' = 'A',
  menuText?: string,
  stylePreset: StylePresetKey = 'auto',
  tone: 'friendly' | 'formal' = 'friendly',
  density: 'full' | 'minimal' = 'full',
  language: 'es' | 'en' | 'de' | 'fr' = 'es',
  palette?: string[],
  websiteContent?: string,
  styleGuide?: string,
  social?: { instagram?: string; facebook?: string; tiktok?: string },
  ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote',
  valueProp?: string,
  servicesText?: string,
  heroPhotoOverride?: string,
): Promise<GenerationResult> {
  const compact = MODEL_MAX_TOKENS[model] <= 8000

  // Determine provider family for prompt adaptation
  const modelProvider: 'claude' | 'openai' | 'gemini' | 'groq' =
    model.startsWith('claude-') ? 'claude'
    : model.startsWith('gpt-') ? 'openai'
    : model.startsWith('gemini-') ? 'gemini'
    : model.startsWith('groq-') ? 'groq'
    : 'claude'

  // Cap websiteContent per model's context budget.
  // Groq free tier: strict 12k TPM → 1500 chars max
  // Compact models (Sonnet/Haiku, 8k output): 3500 chars — leave room for prompt + output
  // Large context models (Opus, GPT-4o, Gemini): 10000 chars — use more of the scraped site
  const isGroq = modelProvider === 'groq'
  const websiteMaxChars = isGroq ? 1500 : compact ? 3500 : 10000
  const effectiveWebsiteContent = websiteContent
    ? websiteContent.slice(0, websiteMaxChars)
    : websiteContent

  // Pass 1: Haiku enrichment — runs for all models except Groq (prompt budget too tight)
  // Runs on Google Places data when available, or on free-text extraContext otherwise
  let enrichedData: string | undefined
  if (!isGroq) {
    try {
      const enriched = place
        ? await enrichBusinessData(place, vertical, effectiveWebsiteContent)
        : extraContext ? await enrichContextData(extraContext, vertical) : null
      if (enriched) enrichedData = enriched
    } catch { /* silently skip — enrichment is optional */ }
  }

  // Parse enrichment for auto-wiring
  let enrichedParsed: Record<string, unknown> | null = null
  if (enrichedData) { try { enrichedParsed = JSON.parse(enrichedData) } catch {} }

  // Auto-populate social from enrichment if not manually provided
  const hasSocialManual = !!(social?.instagram || social?.facebook || social?.tiktok)
  let effectiveSocial = social
  if (!hasSocialManual && enrichedParsed?.social_links) {
    const sl = enrichedParsed.social_links as { instagram?: string; facebook?: string; tiktok?: string }
    if (sl.instagram || sl.facebook || sl.tiktok) {
      effectiveSocial = {
        instagram: sl.instagram || undefined,
        facebook: sl.facebook || undefined,
        tiktok: sl.tiktok || undefined
      }
    }
  }

  // Auto-use menu_extract for food businesses without manual menu
  const isFood = vertical === 'restaurant' || vertical === 'bar'
  let effectiveMenuText = menuText
  if (!menuText && isFood && enrichedParsed?.menu_extract) {
    const extracted = (enrichedParsed.menu_extract as string)?.trim()
    if (extracted && extracted.length > 20) {
      effectiveMenuText = `[Extraído automáticamente del sitio web del negocio]\n${extracted}`
    }
  }

  // Pass 2: generate HTML with enriched prompt (+ raw website content + style guide for extra context)
  const prompt = buildHtmlGenerationPrompt(
    place, vertical, extraContext, siteTheme, whatsapp, compact, contactEmail, enrichedData, styleVariant, effectiveMenuText, stylePreset, tone, density, language, palette, effectiveWebsiteContent, styleGuide, modelProvider, effectiveSocial, ctaType, valueProp, servicesText, heroPhotoOverride
  )

  // Pass style directive separately so Claude can cache it at the system-prompt level
  const styleDirective = STYLE_PRESETS[stylePreset]?.promptDirective?.trim() || undefined

  let providerResult: ProviderResult
  if (model.startsWith('claude-')) {
    providerResult = await generateWithClaude(prompt, model, styleDirective)
  } else if (model.startsWith('gpt-')) {
    providerResult = await generateWithOpenAI(prompt, model)
  } else if (model.startsWith('gemini-')) {
    providerResult = await generateWithGemini(prompt, model)
  } else if (model.startsWith('groq-')) {
    providerResult = await generateWithGroq(prompt)
  } else {
    throw new Error(`Unknown model provider: ${model}`)
  }
  let html = providerResult.html

  // ── Post-processing pipeline ──────────────────────────────────────────────

  // 0. RESCUE: detect unresolved CSS placeholder text (e.g. `--bg: [light page bg]`).
  //    Gemini, GPT, and Groq/Llama sometimes echo these literally instead of substituting
  //    real hex values, causing blank / invisible sections. Replace any broken :root block
  //    with safe neutral fallbacks so the site is at least visible.
  if (/--[\w-]+\s*:\s*\[/.test(html)) {
    console.warn(`[postprocess][${model}] Detected literal CSS placeholder text — applying fallback :root values`)
    const lightFallback = ':root{--bg:#f8f9fa;--surface:#ffffff;--text:#1a1a2e;--muted:#6c757d;--border:#dee2e6;--accent:#4f46e5;--accent-fg:#fff;--accent-light:rgba(79,70,229,.1)}'
    const darkFallback  = ':root.dark{--bg:#0c0c10;--surface:#16181e;--text:#f1f5f9;--muted:#94a3b8;--border:#2d3748;--accent:#818cf8;--accent-fg:#fff;--accent-light:rgba(129,140,248,.15)}'
    // Replace any :root { } block that still contains bracket placeholders
    html = html.replace(/:root\s*\{([^}]*\[[^\]]+\][^}]*)\}/g, lightFallback)
    html = html.replace(/:root\.dark\s*\{([^}]*\[[^\]]+\][^}]*)\}/g, darkFallback)
    // Catch any remaining stray `property: [text]` values outside the root blocks
    html = html.replace(/(--[\w-]+)\s*:\s*\[[^\]]+\]/g, '$1: inherit')
  }

  // 1. Inject fade-in observer if the AI used .fade but forgot the script
  if (
    (html.includes('class="fade"') || html.includes("class='fade'") || html.includes('.fade{opacity') || html.includes('.fade {opacity')) &&
    !html.includes('IntersectionObserver') &&
    !html.includes('classList.add')
  ) {
    const observer = `<script>const _ob=new IntersectionObserver(e=>e.forEach(i=>{if(i.isIntersecting){i.target.classList.add('in');_ob.unobserve(i.target)}}),{threshold:.12});document.querySelectorAll('.fade').forEach(e=>_ob.observe(e))<\/script>`
    html = html.replace('</body>', observer + '\n</body>')
  }

  // 1b. Fade safety fallback — if IntersectionObserver misses elements (e.g. inside admin
  //     preview iframes with fixed height), force all .fade elements visible after 400ms.
  //     Elements already animated (.in) are unaffected.
  if (
    (html.includes('class="fade"') || html.includes("class='fade'") || html.includes('.fade{') || html.includes('.fade {')) &&
    !html.includes('yw-fade-fb')
  ) {
    const fadeFallback = `<script id="yw-fade-fb">document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){document.querySelectorAll('.fade:not(.in)').forEach(function(e){e.classList.add('in')})},400)})<\/script>`
    html = html.replace('</body>', fadeFallback + '\n</body>')
  }

  // 2. Inject Google Fonts preconnect for faster rendering
  if (html.includes('fonts.googleapis.com') && !html.includes('rel="preconnect"')) {
    html = html.replace(
      '<head>',
      '<head>\n<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    )
  }

  // 2b. Hero image preload — insert right at the top of <head> for maximum LCP benefit.
  //     Must run BEFORE any </head> replacements so it ends up in the first ~5 lines.
  const heroPreloadUrl = heroPhotoOverride ||
    (place?.photos?.[0] ? getPhotoUrl(place.photos[0].photo_reference, 1200) : null)
  if (heroPreloadUrl && !html.includes('rel="preload"')) {
    html = html.replace(
      '<head>',
      `<head>\n<link rel="preload" as="image" href="${heroPreloadUrl}" fetchpriority="high">`
    )
  }

  // 3. Inject mobile hamburger if nav hides links but has no toggle button
  if (
    (html.includes('.nav-links{display:none') || html.includes('.nav-links {display:none')) &&
    !html.includes('nav-toggle') && !html.includes('hamburger') && !html.includes('menu-btn') && !html.includes('nav-open')
  ) {
    const hamburgerCSS = `<style>#yw-nt{display:none;flex-direction:column;gap:5px;cursor:pointer;background:none;border:none;padding:6px;color:inherit;z-index:201}#yw-nt span{display:block;width:22px;height:2px;background:currentColor}@media(max-width:900px){#yw-nt{display:flex}nav.yw-open .nav-links{display:flex!important;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:var(--bg,#fff);padding:16px 24px;gap:6px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.12)}}</style>`
    const hamburgerBtn = `<button id="yw-nt" aria-label="Menú" onclick="this.closest('nav').classList.toggle('yw-open')"><span></span><span></span><span></span></button>`
    html = html.replace('</head>', hamburgerCSS + '\n</head>')
    html = html.replace('</nav>', hamburgerBtn + '\n</nav>')
  }

  // 4. Inject today's hours highlight script
  if ((html.includes('id="horarios"') || html.includes('hours-list') || html.includes('horario')) && !html.includes('getDay()')) {
    const todayScript = `<script>(function(){var d=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'][new Date().getDay()];document.querySelectorAll('[id*="horario"] li,[id*="hours"] li,[id*="schedule"] li,[class*="horario"] li,#horarios li,[class*="hour"] li,li,tr').forEach(function(el){if(el.textContent.toLowerCase().trim().startsWith(d)){el.style.fontWeight='700';el.style.color='var(--accent,var(--color-accent,#b5623c))';}});})()<\/script>`
    html = html.replace('</body>', todayScript + '\n</body>')
  }

  // 5. (removed — step 21 handles LocalBusiness schema authoritatively from Places API data)

  // 6. Inject WhatsApp floating button if there's a number and AI didn't include one
  const waNum = formatWhatsApp(whatsapp || place?.formatted_phone_number || '')
  if (waNum && !html.includes('wa.me') && !html.includes('yw-wa')) {
    html = html.replace('</body>', buildWhatsAppFloat(waNum, vertical) + '\n</body>')
  }

  // 7. Inject Lucide icon library when the AI used data-lucide attributes
  if (html.includes('data-lucide') && !html.includes('lucide.min.js') && !html.includes('lucide@')) {
    html = html.replace('</head>', '<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>\n</head>')
    html = html.replace('</body>', '<script>document.addEventListener("DOMContentLoaded",function(){if(typeof lucide!=="undefined")lucide.createIcons()})<\/script>\n</body>')
  }

  // 8. Inject GDPR cookie banner if AI didn't include one
  if (!html.includes('yw_cookies') && !html.includes('cookie-banner')) {
    html = html.replace('</body>', buildGdprBanner() + '\n</body>')
  }

  // 8. Inject dual-theme toggle button if AI used :root.dark (dual theme CSS vars)
  //    Placed in the nav bar (before </nav>) — not as a floating button.
  if (html.includes(':root.dark') && !html.includes('yw-th')) {
    if (siteTheme === 'dark' && !html.includes('class="dark"') && !html.includes("class='dark'")) {
      html = html.replace('<html', '<html class="dark"')
    }
    // Lucide-style inline SVG icons for sun and moon
    const SUN_SVG  = `<svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/></svg>`
    const MOON_SVG = `<svg viewBox="0 0 24 24" width="17" height="17" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`

    const themeStyle  = `<style>#yw-th{background:none;border:1.5px solid var(--border,rgba(128,128,128,.2));border-radius:8px;width:34px;height:34px;cursor:pointer;color:inherit;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;padding:0;transition:background .15s,transform .15s;vertical-align:middle;margin-left:8px}#yw-th:hover{background:var(--surface,rgba(128,128,128,.08));transform:scale(1.08)}#yw-th svg{pointer-events:none}</style>`
    const themeBtn    = `<button id="yw-th" aria-label="Cambiar tema"></button>`
    const themeScript = `<script>(function(){var btn=document.getElementById('yw-th');if(!btn)return;var d=document.documentElement;var S='${SUN_SVG.replace(/'/g, "\\'")}',M='${MOON_SVG.replace(/'/g, "\\'")}';function upd(){btn.innerHTML=d.classList.contains('dark')?M:S}var s=localStorage.getItem('yw_th');if(s==='d')d.classList.add('dark');else if(s==='l')d.classList.remove('dark');upd();btn.addEventListener('click',function(){d.classList.toggle('dark');localStorage.setItem('yw_th',d.classList.contains('dark')?'d':'l');upd()})})()</script>`

    // Prefer injecting into nav bar (before first </nav>) — cleaner than a floating button
    if (html.includes('</nav>')) {
      html = html.replace('</nav>', themeBtn + '</nav>')
    }
    html = html.replace('</head>', themeStyle + '</head>')
    html = html.replace('</body>', themeScript + '\n</body>')
  }

  // 9. Ensure <html> has correct lang attribute for SEO and accessibility
  const htmlLangCode = ({ es: 'es', en: 'en', de: 'de', fr: 'fr' } as const)[language] ?? 'es'
  if (!/<html[^>]+lang=/.test(html)) {
    html = html.replace(/<html(\s[^>]*)?>/, (match, attrs) => `<html${attrs ?? ''} lang="${htmlLangCode}">`)
  }

  // 9b. Patch viewport meta to add viewport-fit=cover (required for iOS safe-area CSS to work)
  html = html.replace(/<meta[^>]+name="viewport"[^>]*>/i, (match) => {
    if (match.includes('viewport-fit')) return match
    return match.replace(/content="([^"]*)"/, (_, c) => `content="${c}, viewport-fit=cover"`)
  })

  // 10. Add loading="lazy" to images and iframes that are missing it (skip first <img> = LCP hero)
  let imgIndex = 0
  html = html.replace(/<img(\s[^>]*)?\/?>/gi, (match, attrs = '') => {
    imgIndex++
    if (attrs.includes('loading=')) return match
    if (imgIndex === 1) return match // first image is likely hero/LCP — don't lazy-load it
    return `<img${attrs} loading="lazy">`
  })
  html = html.replace(/<iframe(\s[^>]*)?\/?>/gi, (match, attrs = '') => {
    if (attrs.includes('loading=')) return match
    return `<iframe${attrs} loading="lazy">`
  })

  // 11. Gallery lightbox — click any gallery image to open full-size overlay
  if (!html.includes('yw-lb')) {
    html = html.replace('</body>', buildGalleryLightbox() + '\n</body>')
  }

  // 12. "Abierto ahora" real-time status badge near opening hours section
  const openPeriods = place?.opening_hours?.periods
  if (openPeriods?.length && !html.includes('yw-on')) {
    html = html.replace('</body>', buildOpenNowWidget(openPeriods) + '\n</body>')
  }

  // 13. Form handling — email is primary; WA interceptor only as fallback when no email
  if (contactEmail && html.includes('<form') && !html.includes('yw-fe')) {
    const bizName = place?.name ?? 'negocio'
    html = html.replace('</body>', buildFormEmailHandler(contactEmail, bizName) + '\n</body>')
  } else if (waNum && html.includes('<form') && !html.includes('yw-fi') && !html.includes('yw-fe')) {
    html = html.replace('</body>', buildFormInterceptor(waNum) + '\n</body>')
  }

  // 14. Sticky mobile CTA bar — call + WhatsApp buttons fixed at bottom on mobile
  const stickyPhone = place?.international_phone_number || place?.formatted_phone_number || ''
  if ((stickyPhone || waNum) && !html.includes('yw-mb')) {
    html = html.replace('</body>', buildStickyMobileBar(stickyPhone, waNum, vertical) + '\n</body>')
  }

  // 15. NAV ANCHOR FIX — guaranteed smooth-scroll for ALL href="#..." links.
  //     Normalises accents and case so href="#resenas" matches id="reseñas" etc.
  //     This runs regardless of what the AI produced, so nav ALWAYS works.
  if (!html.includes('yw-nav-fix')) {
    const navFixScript = `<script id="yw-nav-fix">(function(){function nx(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'')}document.addEventListener('DOMContentLoaded',function(){var NAV_H=72;document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var h=(a.getAttribute('href')||'').slice(1);if(!h)return;var t=document.getElementById(h);if(!t){var n=nx(h);var all=document.querySelectorAll('[id]');for(var i=0;i<all.length;i++){if(nx(all[i].id)===n){t=all[i];break}}}if(t){e.preventDefault();var top=t.getBoundingClientRect().top+window.pageYOffset-NAV_H;window.scrollTo({top:Math.max(0,top),behavior:'smooth'});history.replaceState(null,'','#'+t.id)}})})})}<\/script>`
    html = html.replace('</body>', navFixScript + '\n</body>')
  }

  // 15b. HERO PHOTO ENFORCEMENT — if the AI didn't use the hero photo as background-image,
  //      inject it programmatically on the first full-viewport section after nav.
  if (heroPreloadUrl && !html.includes('yw-hpf')) {
    // Check if the hero photo URL (or its base path without query params) appears in the HTML
    const urlKey = heroPreloadUrl.split('?')[0] // e.g. /api/photo
    const photoAlreadyUsed = html.includes(heroPreloadUrl) || (urlKey.length > 8 && (html.match(/background-image[^;]*url\([^)]+\)/gi)?.length ?? 0) > 0 && html.includes(urlKey.slice(0, 20)))
    if (!photoAlreadyUsed) {
      // Inject JS that sets hero background at runtime on the first large section
      const heroPhotoFix = `<script id="yw-hpf">(function(){var u="${heroPreloadUrl.replace(/"/g, '\\"')}";document.addEventListener('DOMContentLoaded',function(){var h=document.querySelector('#hero,.hero,section.hero,[class*="hero-"]:first-of-type');if(!h){var sections=document.querySelectorAll('body>section,body>div>section,nav~section,header~section,nav+section,nav+div,header+section');for(var i=0;i<sections.length;i++){var s=sections[i];var r=s.getBoundingClientRect();if(r.height>200){h=s;break}}}if(!h)return;var cs=window.getComputedStyle(h);var bg=cs.backgroundImage;if(bg&&bg!=='none'&&bg.includes('url('))return;h.style.backgroundImage='linear-gradient(to bottom,rgba(0,0,0,.55) 0%,rgba(0,0,0,.2) 70%),url("'+u+'")';h.style.backgroundSize='cover';h.style.backgroundPosition='center';h.style.color='#fff';h.querySelectorAll('p,h1,h2,h3,h4,a:not([class*="btn"]):not([class*="button"])').forEach(function(el){el.style.color='#fff'})})})()\<\/script>`
      html = html.replace('</body>', heroPhotoFix + '\n</body>')
    }
  }

  // 16. Open Graph + Twitter Card meta tags
  if (place?.name && !html.includes('og:title')) {
    const ogDesc = place.editorial_summary?.overview || place.generative_summary ||
      `${place.name} — ${place.primary_type_display_name || 'negocio local'} en ${place.formatted_address}`
    html = html.replace('</head>', `  ${buildOpenGraphTags(place.name, ogDesc)}\n</head>`)
  }

  // 17. Star rating badge — inject after first </h1> in hero
  if (place?.rating && place?.user_ratings_total && !html.includes('yw-rb')) {
    html = html.replace('</h1>', `</h1>\n${buildRatingBadge(place.rating, place.user_ratings_total)}`)
  }

  // 18. "Cómo llegar" button — inject before first Google Maps iframe
  if (!html.includes('yw-dir') && html.includes('google.com/maps')) {
    const dest = place?.place_id || place?.formatted_address || ''
    if (dest) html = html.replace('<iframe', buildDirectionsButton(place!.place_id, place!.formatted_address) + '<iframe')
  }

  // 19. Animated reviews carousel — inject before <footer> (or </body>) if we have enough reviews
  const reviews = place?.reviews ?? []
  if (reviews.length >= 2 && !html.includes('yw-rc')) {
    const carousel = buildReviewsCarousel(reviews)
    if (carousel) {
      html = html.includes('<footer')
        ? html.replace('<footer', carousel + '\n<footer')
        : html.replace('</body>', carousel + '\n</body>')
    }
  }

  // 20. Footer trust badges + yaweb.ai credit
  if (!html.includes('yw-fb')) {
    html = html.includes('</footer>')
      ? html.replace('</footer>', buildFooterBadges() + '\n</footer>')
      : html.replace('</body>', buildFooterBadges() + '\n</body>')
  }

  // 21. Schema.org LocalBusiness — replace AI-generated schema with our accurate version
  if (place) {
    // Strip only LocalBusiness-type schemas (preserve AI-generated FAQPage, BreadcrumbList, etc.)
    html = html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
      if (/"@type"\s*:\s*"(?:LocalBusiness|Restaurant|BarOrPub|FoodEstablishment|Dentist|Lawyer|Hotel|Store|AutoRepair|HealthAndBeautyBusiness|LegalService|MedicalClinic|Pharmacy|SportsClub|CivicStructure|AccountingService|FinancialService|HomeAndConstructionBusiness)"/.test(content)) {
        return '' // strip AI-generated LocalBusiness schema — ours (built from real API data) replaces it
      }
      return match // preserve FAQPage, BreadcrumbList, WebPage, etc.
    })
    html = html.replace('</head>', buildLocalBusinessSchema(place, vertical) + '\n</head>')
  }

  // 22. GA4 analytics — inject if NEXT_PUBLIC_GA_ID is configured
  const ga4Id = process.env.NEXT_PUBLIC_GA_ID
  if (ga4Id && !html.includes('googletagmanager.com')) {
    html = html.replace('</head>', buildGA4Snippet(ga4Id) + '\n</head>')
  }

  // 23. Style preset CSS — hard-codes fonts, border-radius, shadows, button styles
  // Runs AFTER AI generation so it can override whatever the AI produced.
  if (stylePreset && stylePreset !== 'auto' && !html.includes('yw-sp')) {
    const css = STYLE_PRESETS[stylePreset]?.cssInject?.trim()
    if (css) {
      html = html.replace('</head>', `<style id="yw-sp">${css}</style>\n</head>`)
    }
  }

  // 25. CSS Personality Skin — a post-generation style layer that enforces button shape,
  //     card elevation, and nav style based on a deterministic hash of the business name.
  //     This guarantees visual variety across sites even when the AI ignores DNA hints.
  //     Uses ONLY var(--xxx) tokens so it blends with any generated palette.
  if (!html.includes('yw-sk')) {
    // Deterministic seed from business name (no timestamp) → stable per business, varies across sites
    let skinHash = 0x811c9dc5
    const skinName = place?.name ?? extraContext?.slice(0, 20) ?? 'x'
    for (let i = 0; i < skinName.length; i++) {
      skinHash ^= skinName.charCodeAt(i)
      skinHash = Math.imul(skinHash, 0x01000193) >>> 0
    }
    // Pick button shape (4 options)
    const btnShapes = ['3px', '8px', '14px', '9999px']
    const btnRadius = btnShapes[skinHash % 4]
    // Pick card elevation (4 options)
    const cardElevations = [
      'box-shadow:0 2px 12px rgba(0,0,0,.06);border:1px solid var(--border,rgba(0,0,0,.07))',
      'box-shadow:0 8px 32px rgba(0,0,0,.10);border:none',
      'box-shadow:none;border:1.5px solid var(--border,rgba(0,0,0,.12))',
      'box-shadow:0 1px 4px rgba(0,0,0,.05);border:1px solid var(--border,rgba(0,0,0,.06));border-top:3px solid var(--accent,#4f46e5)',
    ]
    const cardElevation = cardElevations[(skinHash >> 4) % 4]
    // Pick heading accent style (3 options)
    const hAccents = ['', 'text-decoration:underline;text-decoration-color:var(--accent,#4f46e5);text-underline-offset:6px;text-decoration-thickness:3px', 'padding-bottom:10px;border-bottom:2px solid var(--accent,#4f46e5);display:inline-block']
    const hAccent = hAccents[(skinHash >> 8) % 3]
    // Build skin CSS
    const skinCss = [
      // Button shape — applied broadly across all button-like elements
      `a[class*="btn"],button[class*="btn"],.btn-primary,.btn-secondary,.btn-outline,[class*="cta-btn"],[class*="hero-btn"],#yw-bk a,#reservar a,#cita a,.hero-btns a,.hero-btns button{border-radius:${btnRadius}!important}`,
      // Card elevation — applied to common card class names
      `.card,.feat,.review-card,.service-card,.faq-item,[class*="service-card"],[class*="pricing-card"]{${cardElevation}!important}`,
      // Section heading accent (only when a non-empty style was picked)
      hAccent ? `h2[class*="section"],[class*="section-heading"] h2,.section-title{${hAccent}!important}` : '',
      // Subtle nav transition when scrolling
      'nav{transition:background .28s,box-shadow .28s,border-color .28s}',
    ].filter(Boolean).join('')
    html = html.replace('</head>', `<style id="yw-sk">${skinCss}</style>\n</head>`)
  }

  // 24. Layout insurance — corrects the most common AI layout bugs regardless of model or preset.
  //     Runs last so it overrides both AI CSS and preset CSS for these specific properties.
  if (!html.includes('yw-li')) {
    const layoutInsuranceCss = [
      // Equal-height card rows — .card/.feat/.review-card must fill their grid cell
      '.cards-grid,.feats-grid,.reviews-grid{align-items:stretch}',
      '.card,.feat,.review-card{display:flex;flex-direction:column;height:100%}',
      // Gallery: dense packing prevents trailing empty cells; images fill cells without distortion
      '[class*="gallery"],[class*="galeria"],[class*="fotos"],[class*="photo-grid"],[class*="foto-grid"]{grid-auto-flow:dense}',
      '[class*="gallery"] img,[class*="galeria"] img,[class*="fotos"] img,[class*="photo-grid"] img,[class*="foto-grid"] img{width:100%;height:100%;object-fit:cover;display:block}',
      // About-section images: always fill their shaped container
      '.about-img img,.about-img picture,.about-image img{width:100%;height:100%;object-fit:cover;display:block}',
      // Card/feat images: full-width block, cover so aspect-ratio never distorts
      '.card img,.feat img,.card picture{width:100%;display:block;object-fit:cover}',
      // All flex rows that happen to hold card-like children should stretch them
      '[class$="-row"],[class*="card-row"],[class*="info-grid"],[class*="schedule"],[class*="horario"]{align-items:stretch}',
      // Nav logo: never shrink or wrap — long business names must not bleed into nav links
      '.nav-logo{flex-shrink:0;white-space:nowrap;min-width:max-content}',
      // Map embeds: always fill width, guaranteed minimum height, no default iframe border
      '.map-embed,.map-embed iframe,.map-container iframe{width:100%;display:block;border:0;min-height:320px}',
      // Global image safety: never overflow, always block so no descender gap
      'img{max-width:100%;vertical-align:middle}',
      // Prevent horizontal scroll caused by AI over-wide elements
      'body{overflow-x:hidden}',
      // Sections always span full width regardless of AI flex/grid mistakes
      'section{width:100%;box-sizing:border-box}',
      // Location/contact/hero section text should be properly centered when text-align:center is set
      '#ubicacion p,#contacto p,#contacto address{max-width:none}',
      // Hero section must fill the viewport
      '#hero,section.hero,[class*="hero"]{min-height:100vh;box-sizing:border-box}',
    ].join('')
    html = html.replace('</head>', `<style id="yw-li">${layoutInsuranceCss}</style>\n</head>`)
  }

  // Always close gracefully — a partial site beats an error
  if (!html.includes('</html>')) {
    if (!html.includes('</body>')) {
      html += '\n</body></html>'
    } else {
      html += '\n</html>'
    }
  }
  // Validate the final HTML — warns admin but never blocks delivery (a partial site beats an error)
  const validationWarning = validateGeneratedHtml(html)
  if (validationWarning) {
    console.warn(`[generate][${model}] HTML validation warning: ${validationWarning} (len=${html.length}, business=${place?.name ?? 'unknown'})`)
  }

  return {
    html,
    inputTokens: providerResult.inputTokens,
    outputTokens: providerResult.outputTokens,
    costUsd: calcCostUsd(model, providerResult.inputTokens, providerResult.outputTokens),
    truncated: providerResult.truncated,
    validationWarning,
    cacheReadTokens: providerResult.cacheReadTokens,
    cacheWriteTokens: providerResult.cacheWriteTokens,
  }
}

// Generate two style variants in parallel (A = default, B = minimal/geometric alt)
export async function generateHtmlSiteVariants(
  place: GooglePlaceData | null,
  vertical: Vertical,
  extraContext?: string,
  model: GenerationModel = 'claude-sonnet-4-6',
  siteTheme: 'light' | 'dark' = 'light',
  whatsapp?: string,
  contactEmail?: string,
  menuText?: string,
  stylePreset: StylePresetKey = 'auto',
  tone: 'friendly' | 'formal' = 'friendly',
  density: 'full' | 'minimal' = 'full',
  language: 'es' | 'en' | 'de' | 'fr' = 'es',
  palette?: string[],
  websiteContent?: string,
  styleGuide?: string,
  social?: { instagram?: string; facebook?: string; tiktok?: string },
  ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote',
  valueProp?: string,
  servicesText?: string,
  heroPhotoOverride?: string,
): Promise<[GenerationResult, GenerationResult]> {
  return Promise.all([
    generateHtmlSite(place, vertical, extraContext, model, siteTheme, whatsapp, contactEmail, 'A', menuText, stylePreset, tone, density, language, palette, websiteContent, styleGuide, social, ctaType, valueProp, servicesText, heroPhotoOverride),
    generateHtmlSite(place, vertical, extraContext, model, siteTheme, whatsapp, contactEmail, 'B', menuText, stylePreset, tone, density, language, palette, websiteContent, styleGuide, social, ctaType, valueProp, servicesText, heroPhotoOverride),
  ])
}

// ─── Shared site-building pipeline ──────────────────────────────────────────
//
// ALL generation entry points (admin "Nueva Web", landing page, lead demos,
// future API integrations) call buildSite() — one function, same quality.
// The route layer only handles: job queuing, slug, client DB record, response.

export interface BuildSiteOptions {
  model?: GenerationModel
  siteTheme?: 'light' | 'dark'
  whatsapp?: string
  contactEmail?: string
  extraContext?: string
  menuText?: string
  stylePreset?: StylePresetKey
  tone?: 'friendly' | 'formal'
  density?: 'full' | 'minimal'
  language?: 'es' | 'en' | 'de' | 'fr'
  palette?: string[]
  social?: { instagram?: string; facebook?: string; tiktok?: string }
  ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote'
  valueProp?: string
  servicesText?: string
  heroPhotoOverride?: string
  inspirationUrl?: string
  readWebsite?: boolean
  variants?: boolean
  bookingUrl?: string
}

export interface BuildSiteResult {
  html: string
  htmlB?: string          // only set when variants=true
  inputTokens: number
  outputTokens: number
  costUsd: number
  truncated?: boolean         // true if output hit max_tokens (HTML may be cut off)
  validationWarning?: string  // set when post-generation checks detect a quality issue
  /** Issues found by Haiku AI post-audit (contrast, CTA, completeness, mobile, images) */
  aiValidationIssues?: string[]
  resolvedSocial?: { instagram?: string; facebook?: string; tiktok?: string }
  resolvedMenuText?: string
  buildReport: BuildReport
  /** Prompt-cache stats (Claude only) */
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

/**
 * Runs the full site-generation pipeline for a single place (or context-only).
 * Handles: social detection, website scraping, menu scraping, style guide,
 * Haiku enrichment, HTML generation (optionally two variants).
 *
 * Importable by any route — no job-queue or HTTP concerns here.
 */
export async function buildSite(
  place: GooglePlaceData | null,
  vertical: Vertical,
  options: BuildSiteOptions = {},
): Promise<BuildSiteResult> {
  const {
    model = 'claude-sonnet-4-6',
    siteTheme = 'light',
    whatsapp,
    contactEmail,
    extraContext,
    stylePreset = 'auto',
    tone = 'friendly',
    density = 'full',
    language = 'es',
    palette,
    ctaType,
    valueProp,
    servicesText,
    heroPhotoOverride,
    inspirationUrl,
    readWebsite = true,
    variants = false,
    bookingUrl,
  } = options

  // ── 1. Social detection ──────────────────────────────────────────────────
  let resolvedSocial = options.social
  if (place?.website) {
    const { extractSocialFromUrl, isSocialMediaUrl } = await import('../google-places')
    if (isSocialMediaUrl(place.website)) {
      const detected = extractSocialFromUrl(place.website)
      if (detected) resolvedSocial = { ...detected, ...options.social }
    }
  }

  // ── 2. Website scraping ──────────────────────────────────────────────────
  let websiteContent: string | undefined
  let websiteScraped = false
  if (readWebsite && place?.website) {
    const { isSocialMediaUrl } = await import('../google-places')
    if (!isSocialMediaUrl(place.website)) {
      try {
        const { scrapeWebsiteContent } = await import('../scrapeWebsite')
        const scraped = await scrapeWebsiteContent(place.website)
        if (scraped && scraped.length > 100) {
          websiteContent = scraped
          websiteScraped = true
          // Extract social from page HTML if not yet found
          if (!resolvedSocial?.instagram) {
            const m = scraped.match(/instagram\.com\/([A-Za-z0-9._]+)/i)
            if (m?.[1] && !['p', 'reel', 'explore'].includes(m[1]))
              resolvedSocial = { ...resolvedSocial, instagram: m[1] }
          }
          if (!resolvedSocial?.facebook) {
            const m = scraped.match(/facebook\.com\/([A-Za-z0-9./_-]+)/i)
            if (m?.[1] && !['sharer', 'watch', 'pages'].includes(m[1].split('/')[0]))
              resolvedSocial = { ...resolvedSocial, facebook: `https://facebook.com/${m[1]}` }
          }
          if (!resolvedSocial?.tiktok) {
            const m = scraped.match(/tiktok\.com\/@?([A-Za-z0-9._]+)/i)
            if (m?.[1]) resolvedSocial = { ...resolvedSocial, tiktok: m[1] }
          }
        }
      } catch { /* skip */ }
    }
  }

  // ── 3. Menu text resolution ───────────────────────────────────────────────
  // menuUri was removed from Places API field mask (causes 400 error).
  // Menu content comes from: (a) explicit menuText param, (b) website scraping.
  let resolvedMenuText = options.menuText

  // ── 4. Style guide from inspiration URL ──────────────────────────────────
  let styleGuide: string | undefined
  if (inspirationUrl) {
    try {
      const { scrapeWebsiteContent } = await import('../scrapeWebsite')
      const html = await scrapeWebsiteContent(inspirationUrl)
      if (html) styleGuide = await extractStyleGuide(html) ?? undefined
    } catch { /* skip */ }
  }

  // ── 5. Generate HTML ──────────────────────────────────────────────────────
  const compact = (MODEL_MAX_TOKENS[model] ?? 16000) <= 8000

  if (variants) {
    const [resultA, resultB] = await generateHtmlSiteVariants(
      place, vertical, extraContext, model, siteTheme, whatsapp, contactEmail,
      resolvedMenuText, stylePreset, tone, density, language, palette,
      websiteContent, styleGuide, resolvedSocial, ctaType, valueProp, servicesText, heroPhotoOverride,
    )
    const totalIn  = resultA.inputTokens  + resultB.inputTokens
    const totalOut = resultA.outputTokens + resultB.outputTokens
    const totalCost = resultA.costUsd + resultB.costUsd
    // 15. Booking widget — inject before first <footer> or before </body>
    const injectBooking = (h: string) => {
      if (!bookingUrl || h.includes('yw-bk')) return h
      const widget = buildBookingWidget(bookingUrl)
      return h.includes('<footer') ? h.replace('<footer', widget + '\n<footer') : h.replace('</body>', widget + '\n</body>')
    }
    return {
      html: injectBooking(resultA.html),
      htmlB: injectBooking(resultB.html),
      inputTokens: totalIn,
      outputTokens: totalOut,
      costUsd: totalCost,
      // Surface worst-case validation warning (if either variant is bad, flag it)
      validationWarning: resultA.validationWarning ?? resultB.validationWarning,
      resolvedSocial,
      resolvedMenuText,
      buildReport: buildReportFromPlace(place, vertical, model, compact, resolvedSocial, resolvedMenuText, websiteScraped, totalIn, totalOut, totalCost),
    }
  }

  const result = await generateHtmlSite(
    place, vertical, extraContext, model, siteTheme, whatsapp, contactEmail, 'A',
    resolvedMenuText, stylePreset, tone, density, language, palette,
    websiteContent, styleGuide, resolvedSocial, ctaType, valueProp, servicesText, heroPhotoOverride,
  )
  // 15. Booking widget — inject before first <footer> or before </body>
  let finalHtml = result.html
  if (bookingUrl && !finalHtml.includes('yw-bk')) {
    const widget = buildBookingWidget(bookingUrl)
    finalHtml = finalHtml.includes('<footer')
      ? finalHtml.replace('<footer', widget + '\n<footer')
      : finalHtml.replace('</body>', widget + '\n</body>')
  }

  // 16. Haiku AI quality audit — runs after Opus/Sonnet, non-blocking (~0.006€)
  const aiValidationIssues = await validateHtmlWithAi(finalHtml)
  if (aiValidationIssues.length > 0) {
    console.warn(`[validator] AI audit found ${aiValidationIssues.length} issue(s) (model=${model}):`, aiValidationIssues)
  }

  return {
    ...result,
    html: finalHtml,
    truncated: result.truncated,
    validationWarning: result.validationWarning,
    aiValidationIssues: aiValidationIssues.length > 0 ? aiValidationIssues : undefined,
    resolvedSocial,
    resolvedMenuText,
    buildReport: buildReportFromPlace(place, vertical, model, compact, resolvedSocial, resolvedMenuText, websiteScraped, result.inputTokens, result.outputTokens, result.costUsd),
  }
}

// ─── Legacy: JSON-mode generator (kept for reference, no longer called) ──────

export async function generateSiteContent(
  place: GooglePlaceData,
  vertical: Vertical
): Promise<SiteData> {
  const prompt = buildGenerationPrompt(place, vertical)
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: 'Eres un experto en marketing digital. Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones.',
    messages: [{ role: 'user', content: prompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(jsonText) as SiteData
  } catch {
    throw new Error(`AI returned invalid JSON: ${jsonText.slice(0, 200)}`)
  }
}

export async function generateSlug(name: string): Promise<string> {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

export async function generateEmailOutreach(businessName: string, demoUrl: string, vertical: Vertical): Promise<{ subject: string; html: string; text: string }> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Escribe un email de ventas corto y efectivo para ${businessName} (sector: ${vertical}).
Les hemos creado una demo de su web gratis: ${demoUrl}

Requisitos:
- Asunto atractivo, máx 60 chars
- Cuerpo en HTML simple, máx 150 palabras
- Tono cercano, no formal, no agresivo
- Destacar que la demo ya está lista y es gratis verla
- CTA claro para ver la demo
- Sin imágenes, texto puro con algunos <strong> y <br>

Responde con JSON: {"subject": "...", "html": "...", "text": "..."}`
    }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
  } catch {
    return {
      subject: `Hemos creado una web demo para ${businessName} — ¡gratis!`,
      html: `<p>Hola, hemos creado una demo gratuita para <strong>${businessName}</strong>.</p><p>Mírala aquí: <a href="${demoUrl}">${demoUrl}</a></p>`,
      text: `Hola, hemos creado una demo gratuita para ${businessName}. Mírala en: ${demoUrl}`,
    }
  }
}
