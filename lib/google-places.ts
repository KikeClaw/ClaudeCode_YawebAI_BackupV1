import type { GooglePlaceData, Vertical } from '@/types'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY!

// ── Places API (New) — v2 ─────────────────────────────────────────────────────
// Docs: https://developers.google.com/maps/documentation/places/web-service/op-overview
const PLACES_V2_BASE = 'https://places.googleapis.com/v1'

/**
 * Full field mask — extracts the maximum possible data from a single API call.
 * Covers: identity, hours, photos, reviews, service options, menu types,
 * amenities, accessibility, payment, parking.
 * NOTE: 'reviews' and 'photos' require the "Basic" data SKU.
 *       All attribute fields (dineIn, servesBeer, etc.) are free.
 */
/**
 * Maximum field mask — one API call, every useful field.
 *
 * SKU tiers (billed once per call, highest tier wins):
 *   Essentials  : id, name, photos, attributions, address*, location*, types*
 *   Pro         : displayName, primaryType, businessStatus, googleMapsUri,
 *                 timeZone, addressDescriptor, viewport
 *   Enterprise  : phone, website, rating, hours, priceLevel, priceRange,
 *                 regularSecondaryOpeningHours
 *   Ent+Atmos   : reviews, editorialSummary, generativeSummary, reviewSummary,
 *                 neighborhoodSummary, all boolean amenity/service fields,
 *                 accessibilityOptions, paymentOptions, parkingOptions
 *
 * Note: servesHighTea does NOT exist in Places API (New) — omitted.
 */
const FIELD_MASK = [
  // ── Essentials ───────────────────────────────────────────────────────────
  'id', 'displayName', 'formattedAddress', 'shortFormattedAddress',
  'addressComponents', 'addressDescriptor',
  'types', 'photos', 'attributions',
  // ── Pro ──────────────────────────────────────────────────────────────────
  'primaryType', 'primaryTypeDisplayName',
  'businessStatus', 'googleMapsUri', 'googleMapsLinks',
  'timeZone', 'viewport',
  'location',
  // ── Enterprise ───────────────────────────────────────────────────────────
  'nationalPhoneNumber', 'internationalPhoneNumber', 'websiteUri',
  'rating', 'userRatingCount', 'priceLevel', 'priceRange',
  'regularOpeningHours', 'currentOpeningHours',
  'regularSecondaryOpeningHours',      // delivery / happy-hour / etc.
  // ── Enterprise + Atmosphere ──────────────────────────────────────────────
  'reviews', 'reviewSummary',          // reviews + AI-aggregated insights
  'editorialSummary', 'generativeSummary', // curated + AI-generated descriptions
  'neighborhoodSummary',               // area / neighbourhood description
  // Service options
  'dineIn', 'takeout', 'delivery', 'curbsidePickup',
  'outdoorSeating', 'reservable', 'liveMusic',
  // What's served
  'servesBreakfast', 'servesBrunch', 'servesLunch', 'servesDinner',
  'servesBeer', 'servesWine', 'servesCocktails', 'servesCoffee',
  'servesDessert', 'servesVegetarianFood',
  // Amenities
  'goodForChildren', 'menuForChildren', 'goodForGroups',
  'goodForWatchingSports', 'allowsDogs', 'restroom',
  // Accessibility, payment, parking (structured objects)
  'accessibilityOptions', 'paymentOptions', 'parkingOptions',
].join(',')

// Price level mapping: v2 returns string enums
const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
}

// ── Internal mapper: v2 response → GooglePlaceData ───────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapV2(v2: Record<string, any>): GooglePlaceData {
  const openingHours = v2.regularOpeningHours
    ? {
        weekday_text: v2.regularOpeningHours.weekdayDescriptions ?? [],
        periods: v2.regularOpeningHours.periods ?? [],
      }
    : undefined

  // Secondary hours (delivery window, drive-through, happy hour, etc.)
  const secondaryHours = (v2.regularSecondaryOpeningHours ?? []).map(
    (h: { weekdayDescriptions?: string[]; secondaryHoursType?: string }) => ({
      type: h.secondaryHoursType ?? '',
      weekday_text: h.weekdayDescriptions ?? [],
    })
  )

  const photos = (v2.photos ?? []).map((p: { name: string }) => ({
    photo_reference: p.name, // resource name: "places/ChIJ.../photos/AXCi2y..."
  }))

  const reviews = (v2.reviews ?? []).map((r: {
    authorAttribution?: { displayName?: string }
    rating?: number
    text?: { text?: string }
    relativePublishTimeDescription?: string
    originalText?: { text?: string }
  }) => ({
    author_name: r.authorAttribution?.displayName ?? '',
    rating: r.rating ?? 0,
    text: r.text?.text ?? '',
    relative_time_description: r.relativePublishTimeDescription ?? '',
  }))

  const acc  = v2.accessibilityOptions ?? {}
  const pay  = v2.paymentOptions ?? {}
  const park = v2.parkingOptions ?? {}

  // Price range text (e.g. "10–30 €")
  const priceRange = (() => {
    const pr = v2.priceRange
    if (!pr) return undefined
    const start = pr.startPrice?.units ?? pr.startPrice?.nanos != null ? pr.startPrice?.units : null
    const end   = pr.endPrice?.units ?? pr.endPrice?.nanos != null ? pr.endPrice?.units : null
    const curr  = pr.startPrice?.currencyCode ?? ''
    if (start != null && end != null) return `${start}–${end} ${curr}`.trim()
    if (end != null) return `hasta ${end} ${curr}`.trim()
    return undefined
  })()

  // generativeSummary: { overview?: { text } } or { description?: { text } }
  const generativeSummaryText =
    v2.generativeSummary?.overview?.text ??
    v2.generativeSummary?.description?.text ??
    undefined

  // reviewSummary: { text?: { text } }
  const reviewSummaryText = v2.reviewSummary?.text?.text ?? undefined

  // neighborhoodSummary: { overview?: { text } }
  const neighborhoodSummaryText = v2.neighborhoodSummary?.overview?.text ?? undefined

  return {
    place_id: v2.id ?? '',
    name: v2.displayName?.text ?? '',
    formatted_address: v2.formattedAddress ?? '',
    formatted_phone_number: v2.nationalPhoneNumber ?? undefined,
    international_phone_number: v2.internationalPhoneNumber ?? undefined,
    website: v2.websiteUri ?? undefined,
    google_maps_uri: v2.googleMapsUri ?? undefined,

    rating: v2.rating ?? undefined,
    user_ratings_total: v2.userRatingCount ?? undefined,
    price_level: v2.priceLevel ? PRICE_LEVEL_MAP[v2.priceLevel] : undefined,
    price_range: priceRange,

    primary_type: v2.primaryType ?? undefined,
    primary_type_display_name: v2.primaryTypeDisplayName?.text ?? undefined,
    business_status: v2.businessStatus ?? undefined,
    time_zone: v2.timeZone?.id ?? undefined,

    editorial_summary: v2.editorialSummary?.text
      ? { overview: v2.editorialSummary.text }
      : undefined,
    generative_summary: generativeSummaryText,
    review_summary: reviewSummaryText,
    neighborhood_summary: neighborhoodSummaryText,

    opening_hours: openingHours,
    secondary_opening_hours: secondaryHours.length ? secondaryHours : undefined,
    photos,
    reviews,

    types: v2.types ?? [],
    geometry: v2.location
      ? { location: { lat: v2.location.latitude, lng: v2.location.longitude } }
      : undefined,

    // Service options
    dine_in:         v2.dineIn ?? undefined,
    takeout:         v2.takeout ?? undefined,
    delivery:        v2.delivery ?? undefined,
    curbside_pickup: v2.curbsidePickup ?? undefined,
    outdoor_seating: v2.outdoorSeating ?? undefined,
    reservable:      v2.reservable ?? undefined,
    live_music:      v2.liveMusic ?? undefined,

    // What's served
    serves_breakfast:       v2.servesBreakfast ?? undefined,
    serves_brunch:          v2.servesBrunch ?? undefined,
    serves_lunch:           v2.servesLunch ?? undefined,
    serves_dinner:          v2.servesDinner ?? undefined,
    serves_beer:            v2.servesBeer ?? undefined,
    serves_wine:            v2.servesWine ?? undefined,
    serves_cocktails:       v2.servesCocktails ?? undefined,
    serves_coffee:          v2.servesCoffee ?? undefined,
    serves_dessert:         v2.servesDessert ?? undefined,
    serves_vegetarian_food: v2.servesVegetarianFood ?? undefined,

    // Amenities
    good_for_children:        v2.goodForChildren ?? undefined,
    menu_for_children:        v2.menuForChildren ?? undefined,
    good_for_groups:          v2.goodForGroups ?? undefined,
    good_for_watching_sports: v2.goodForWatchingSports ?? undefined,
    allows_dogs:              v2.allowsDogs ?? undefined,
    restroom:                 v2.restroom ?? undefined,

    // Accessibility
    wheelchair_accessible_entrance: acc.wheelchairAccessibleEntrance ?? undefined,
    wheelchair_accessible_seating:  acc.wheelchairAccessibleSeating  ?? undefined,
    wheelchair_accessible_restroom: acc.wheelchairAccessibleRestroom  ?? undefined,
    wheelchair_accessible_parking:  acc.wheelchairAccessibleParking   ?? undefined,

    // Payment
    accepts_credit_cards: pay.acceptsCreditCards ?? undefined,
    accepts_debit_cards:  pay.acceptsDebitCards  ?? undefined,
    accepts_cash_only:    pay.acceptsCashOnly     ?? undefined,
    accepts_nfc:          pay.acceptsNfc          ?? undefined,

    // Parking
    free_parking_lot:    park.freeParkingLot    ?? undefined,
    free_street_parking: park.freeStreetParking ?? undefined,
    paid_parking_lot:    park.paidParkingLot    ?? undefined,
    valet_parking:       park.valetParking      ?? undefined,
    free_garage_parking: park.freeGarageParking ?? undefined,
    paid_garage_parking: park.paidGarageParking ?? undefined,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getPlaceFromUrl(url: string): Promise<GooglePlaceData | null> {
  let resolvedUrl = url

  // Expand short URLs (maps.app.goo.gl, goo.gl)
  if (url.includes('goo.gl') || url.includes('maps.app.goo')) {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      resolvedUrl = res.url
    } catch {
      resolvedUrl = url
    }
  }

  const placeId = extractPlaceId(resolvedUrl)
  if (placeId) return getPlaceById(placeId)
  const name = extractBusinessName(resolvedUrl)
  if (name) return searchPlace(name)
  return null
}

export async function getPlaceById(placeId: string): Promise<GooglePlaceData | null> {
  const res = await fetch(
    `${PLACES_V2_BASE}/places/${encodeURIComponent(placeId)}?languageCode=es`,
    {
      headers: {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': FIELD_MASK,
      },
    }
  )
  if (!res.ok) {
    console.error('[Places v2] getPlaceById error', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  return mapV2(data)
}

export async function searchPlace(query: string, city?: string): Promise<GooglePlaceData | null> {
  const textQuery = city ? `${query} ${city}` : query
  // Use minimal field mask for text search — not all FIELD_MASK fields are
  // supported by searchText (e.g. menuUri is getPlace-only). We fetch just
  // the place ID and then call getPlaceById for the full data set.
  const res = await fetch(`${PLACES_V2_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'places.id',
    },
    body: JSON.stringify({ textQuery, languageCode: 'es', maxResultCount: 1 }),
  })
  if (!res.ok) {
    console.error('[Places v2] searchPlace error', res.status, await res.text().catch(() => ''))
    return null
  }
  const data = await res.json()
  const placeId = data.places?.[0]?.id
  if (!placeId) return null
  // Fetch full details with the complete field mask
  return getPlaceById(placeId)
}

// ── Search options — all filters supported by Google Places API v2 Text Search ─

export interface SearchOptions {
  /** Only return businesses currently open right now */
  openNow?: boolean
  /** Minimum Google rating (0–5). E.g. 3.0 = filter out very low-rated. */
  minRating?: number
  /** Maximum Google rating (0–5). E.g. 4.0 to target businesses with room to improve. */
  maxRating?: number
  /** Price levels to include: 1=€ 2=€€ 3=€€€ 4=€€€€ */
  priceLevels?: (1 | 2 | 3 | 4)[]
  /** Maximum review count — proxy for "new / small" business (few reviews = recently opened) */
  maxReviews?: number
  /** Minimum review count — proxy for "established" business */
  minReviews?: number
  /** Only return businesses WITHOUT a website (the #1 signal they need one) */
  noWebsite?: boolean
  /** Sort by distance from city centre instead of relevance */
  rankByDistance?: boolean
  /** Extra keyword appended to the search query (e.g. "italiano", "24 horas") */
  keyword?: string
  /** How many results to fetch. API cap is 20 per page; use pageToken for more. */
  maxResults?: number
  /** Pagination token from a previous response — fetches the next page */
  pageToken?: string
  /** Filter to a specific Google place primary type (e.g. 'restaurant', 'beauty_salon') */
  placeType?: string
}

// Price level enum mapping for the API
const PRICE_LEVEL_ENUM: Record<number, string> = {
  1: 'PRICE_LEVEL_INEXPENSIVE',
  2: 'PRICE_LEVEL_MODERATE',
  3: 'PRICE_LEVEL_EXPENSIVE',
  4: 'PRICE_LEVEL_VERY_EXPENSIVE',
}

export interface SearchBusinessesResult {
  places: GooglePlaceData[]
  nextPageToken?: string
  total: number
}

/**
 * Search for local businesses using Google Places API v2 Text Search.
 * Supports native API filters (openNow, minRating, priceLevels, rankByDistance)
 * and client-side post-filters (noWebsite, maxReviews, maxRating).
 */
export async function searchBusinesses(
  query: string,
  city: string,
  type?: string,
  options: SearchOptions = {},
): Promise<SearchBusinessesResult> {
  const {
    openNow, minRating, maxRating, priceLevels, maxReviews, minReviews,
    noWebsite, rankByDistance, keyword, maxResults = 20, pageToken, placeType,
  } = options

  // Build the text query — city + vertical + optional keyword
  const kw = keyword?.trim() ? ` ${keyword.trim()}` : ''
  const textQuery = type
    ? `${query} ${type}${kw} en ${city}`
    : `${query}${kw} en ${city}`

  // Build API request body
  const body: Record<string, unknown> = {
    textQuery,
    languageCode: 'es',
    maxResultCount: Math.min(maxResults, 20), // API max is 20 per page
  }

  // Native API filters
  if (openNow)                   body.openNow          = true
  if (minRating)                 body.minRating        = minRating
  if (priceLevels?.length)       body.priceLevels      = priceLevels.map(l => PRICE_LEVEL_ENUM[l]).filter(Boolean)
  if (rankByDistance)            body.rankPreference   = 'DISTANCE'
  if (pageToken)                 body.pageToken        = pageToken
  if (placeType)                 body.includedType     = placeType

  const res = await fetch(`${PLACES_V2_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.nationalPhoneNumber', 'places.internationalPhoneNumber',
        'places.websiteUri', 'places.rating', 'places.userRatingCount',
        'places.types', 'places.primaryType', 'places.primaryTypeDisplayName',
        'places.location', 'places.photos', 'places.businessStatus',
        'places.priceLevel',
        'nextPageToken',
      ].join(','),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.error('[Places v2] searchBusinesses error', res.status, await res.text().catch(() => ''))
    return { places: [], total: 0 }
  }

  const data = await res.json()
  let places: GooglePlaceData[] = (data.places ?? []).map(mapV2)

  // ── Client-side post-filters ─────────────────────────────────────────────
  if (noWebsite)               places = places.filter(p => !p.website)
  if (maxReviews !== undefined) places = places.filter(p => (p.user_ratings_total ?? 0) <= maxReviews)
  if (minReviews !== undefined) places = places.filter(p => (p.user_ratings_total ?? 0) >= minReviews)
  if (maxRating  !== undefined) places = places.filter(p => !p.rating || p.rating <= maxRating)

  return {
    places,
    nextPageToken: data.nextPageToken ?? undefined,
    total: places.length,
  }
}

/** Photo URL — handles both old (photo_reference string) and new (places/.../photos/... resource name) */
export function getPhotoUrl(photoReference: string, maxWidth = 800): string {
  // New Places v2: resource name like "places/ChIJ.../photos/AXCi2y..."
  if (photoReference.startsWith('places/')) {
    return `/api/photo?ref=${encodeURIComponent(photoReference)}&w=${maxWidth}`
  }
  // Old Places v1: raw photo_reference string
  return `/api/photo?ref=${encodeURIComponent(photoReference)}&w=${maxWidth}`
}

export function detectVertical(types: string[]): Vertical {
  const t = types.join(',').toLowerCase()
  if (t.includes('restaurant') || t.includes('meal_takeaway') || t.includes('meal_delivery')) return 'restaurant'
  if (t.includes('cafe') || t.includes('bakery') || t.includes('coffee_shop')) return 'restaurant'
  if (t.includes('bar') || t.includes('night_club') || t.includes('liquor_store')) return 'bar'
  if (t.includes('beauty_salon') || t.includes('hair_care') || t.includes('spa') || t.includes('nail_salon')) return 'salon'
  if (t.includes('pharmacy') || t.includes('drugstore')) return 'pharmacy'
  if (t.includes('doctor') || t.includes('dentist') || t.includes('health') || t.includes('physiotherap') || t.includes('hospital') || t.includes('medical_clinic')) return 'clinic'
  if (t.includes('gym') || t.includes('fitness') || t.includes('yoga') || t.includes('sports_complex')) return 'gym'
  if (t.includes('lawyer') || t.includes('legal') || t.includes('attorney') || t.includes('law_firm')) return 'lawyer'
  if (t.includes('lodging') || t.includes('hotel') || t.includes('hostel') || t.includes('motel') || t.includes('resort_hotel')) return 'hotel'
  if (t.includes('school') || t.includes('university') || t.includes('education') || t.includes('training')) return 'academy'
  if (t.includes('food')) return 'restaurant'
  if (t.includes('clothing') || t.includes('store') || t.includes('shop') || t.includes('supermarket')) return 'shop'
  if (t.includes('car_repair') || t.includes('plumber') || t.includes('electrician') || t.includes('locksmith') || t.includes('painter') || t.includes('roofing_contractor')) return 'workshop'
  return 'generic'
}

export function parseOpeningHours(place: GooglePlaceData) {
  if (!place.opening_hours?.weekday_text) return []
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  return place.opening_hours.weekday_text.map((text, i) => {
    const closed = text.toLowerCase().includes('cerrado') || text.toLowerCase().includes('closed')
    const parts = text.split(': ')
    const hours = parts[1] || ''
    const [open, close] = hours.split('–').map(h => h?.trim() || '')
    return { day: days[i], open: closed ? '' : open, close: closed ? '' : close, closed }
  })
}

// ── Social media detection ────────────────────────────────────────────────────

/**
 * If a business has set a social media URL as their "website" in Google Business Profile,
 * this function detects it and returns structured social handles.
 * Returns null if the URL is a regular (non-social) website.
 */
export function extractSocialFromUrl(url: string): {
  instagram?: string
  facebook?: string
  tiktok?: string
  youtube?: string
} | null {
  if (!url) return null
  try {
    const fullUrl = url.startsWith('http') ? url : `https://${url}`
    const u = new URL(fullUrl)
    const host = u.hostname.toLowerCase().replace(/^www\./, '')
    const path = u.pathname.replace(/^\//, '').replace(/\/$/, '')

    if (host === 'instagram.com' || host === 'instagr.am') {
      const handle = path.split('/')[0]
      // Skip internal paths like /p/ /reel/ /explore/
      if (handle && !['p', 'reel', 'explore', 'stories', 'reels', 'tv'].includes(handle)) {
        return { instagram: handle }
      }
    }

    if (host === 'facebook.com' || host === 'fb.com' || host === 'fb.me') {
      const handle = path.split('/')[0]
      if (handle && !['pages', 'groups', 'events', 'watch', 'video', 'photo', 'profile.php', 'sharer'].includes(handle)) {
        return { facebook: fullUrl }
      }
    }

    if (host === 'tiktok.com') {
      const handle = path.replace(/^@/, '')
      if (handle) return { tiktok: handle }
    }

    if (host === 'youtube.com' || host === 'youtu.be') {
      const handle = path.replace(/^@/, '')
      if (handle && path.startsWith('@')) return { youtube: handle }
    }

    return null
  } catch {
    return null
  }
}

/** Returns true if the URL is a known social media domain — use to skip website scraping */
export function isSocialMediaUrl(url: string): boolean {
  if (!url) return false
  try {
    const host = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, '')
    return ['instagram.com', 'instagr.am', 'facebook.com', 'fb.com', 'fb.me', 'tiktok.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'linkedin.com'].includes(host)
  } catch { return false }
}

// ── URL parsers ───────────────────────────────────────────────────────────────

function extractPlaceId(url: string): string | null {
  const match = url.match(/place_id[=:]([A-Za-z0-9_-]+)/)
  if (match) return match[1]
  const dataMatch = url.match(/!1s(ChIJ[A-Za-z0-9_-]{10,})/)
  if (dataMatch) return dataMatch[1]
  const ftidMatch = url.match(/ftid=([^&]+)/)
  if (ftidMatch) return decodeURIComponent(ftidMatch[1])
  return null
}

function extractBusinessName(url: string): string | null {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/maps\/place\/([^/@]+)/)
    if (match) return match[1].replace(/\+/g, ' ')
  } catch {}
  return null
}
