import { NextRequest, NextResponse } from 'next/server'
import { searchBusinesses, detectVertical } from '@/lib/google-places'
import { getLeads } from '@/lib/db/leads'
import type { SearchOptions } from '@/lib/google-places'

const VERTICAL_QUERIES: Record<string, string> = {
  restaurant: 'restaurantes',
  bar:        'bares cafeterías',
  salon:      'peluquerías salones de belleza',
  clinic:     'clínicas médicas dentistas',
  gym:        'gimnasios',
  lawyer:     'despachos de abogados',
  hotel:      'hoteles',
  pharmacy:   'farmacias',
  academy:    'academias',
  shop:       'tiendas',
  workshop:   'talleres',
  generic:    'negocios locales',
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const city     = p.get('city')
  const vertical = p.get('vertical') || ''

  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 })

  // ── Advanced filter params ─────────────────────────────────────────────────
  const noWebsite      = p.get('noWebsite')      === 'true'
  const excludeKnown   = p.get('excludeKnown')   === 'true'
  const openNow        = p.get('openNow')         === 'true'
  const rankByDistance = p.get('rankByDistance')  === 'true'
  const keyword        = p.get('keyword')         || undefined
  const pageToken      = p.get('pageToken')       || undefined
  const maxResults     = Math.min(parseInt(p.get('maxResults') || '20', 10) || 20, 60)
  const minRating      = parseFloat(p.get('minRating') || '') || undefined
  const maxRating      = parseFloat(p.get('maxRating') || '') || undefined
  const minReviews     = parseInt(p.get('minReviews') || '', 10) || undefined
  const maxReviews     = parseInt(p.get('maxReviews') || '', 10) || undefined
  const priceLevels    = p.get('priceLevels')
    ? p.get('priceLevels')!.split(',').map(Number).filter(n => n >= 1 && n <= 4) as (1|2|3|4)[]
    : undefined

  const options: SearchOptions = {
    openNow, noWebsite, // excludeKnown is handled below after the API call
    rankByDistance, keyword, pageToken,
    maxResults: Math.min(maxResults, 20), // first page
    minRating, maxRating, minReviews, maxReviews,
    ...(priceLevels?.length ? { priceLevels } : {}),
  }

  const query = VERTICAL_QUERIES[vertical] || 'negocios locales'

  try {
    const result = await searchBusinesses(query, city, undefined, options)

    // ── Exclude place_ids already in the leads DB ────────────────────────────
    let places = result.places
    if (excludeKnown) {
      const existingLeads = await getLeads({}).catch(() => [])
      const knownIds = new Set(existingLeads.map((l: { google_place_id?: string }) => l.google_place_id).filter(Boolean))
      places = places.filter(p => !knownIds.has(p.place_id))
    }

    const candidates = places.map(place => ({
      place_id:     place.place_id,
      name:         place.name,
      address:      place.formatted_address,
      rating:       place.rating    ?? null,
      review_count: place.user_ratings_total ?? null,
      vertical:     detectVertical(place.types || []),
      has_website:  !!place.website,
      website:      place.website   ?? null,
      price_level:  place.price_level ?? null,
    }))

    return NextResponse.json({
      candidates,
      nextPageToken: result.nextPageToken ?? null,
      total: candidates.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
