import { NextRequest, NextResponse } from 'next/server'
import { searchBusinesses, detectVertical } from '@/lib/google-places'
import { createLeads, getLeads } from '@/lib/db/leads'
import type { Vertical } from '@/types'
import type { SearchOptions } from '@/lib/google-places'

const VERTICAL_QUERIES: Record<string, string> = {
  restaurant: 'restaurante',
  bar:        'bar cafetería',
  salon:      'peluquería salón de belleza',
  clinic:     'clínica médico dentista',
  gym:        'gimnasio fitness',
  lawyer:     'abogado despacho',
  hotel:      'hotel',
  pharmacy:   'farmacia',
  academy:    'academia',
  shop:       'tienda comercio',
  workshop:   'taller mecánico fontanero electricista',
  generic:    'negocio comercio local',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      city, vertical,
      limit        = 20,
      noWebsite    = false,
      excludeKnown = false,
      openNow      = false,
      minRating,
      maxRating,
      minReviews,
      maxReviews,
      priceLevels,
      keyword,
      rankByDistance = false,
    } = body

    if (!city) return NextResponse.json({ error: 'city is required' }, { status: 400 })

    const query = VERTICAL_QUERIES[vertical as string] || VERTICAL_QUERIES.generic

    const options: SearchOptions = {
      noWebsite, openNow, rankByDistance, keyword,
      maxResults: Math.min(limit, 20),
      ...(minRating    !== undefined ? { minRating }    : {}),
      ...(maxRating    !== undefined ? { maxRating }    : {}),
      ...(minReviews   !== undefined ? { minReviews }   : {}),
      ...(maxReviews   !== undefined ? { maxReviews }   : {}),
      ...(priceLevels?.length        ? { priceLevels }  : {}),
    }

    const result = await searchBusinesses(query, city, vertical, options)
    let places = result.places

    // Exclude place_ids already in leads DB
    if (excludeKnown) {
      const existingLeads = await getLeads({}).catch(() => [])
      const knownIds = new Set(existingLeads.map((l: { google_place_id?: string }) => l.google_place_id).filter(Boolean))
      places = places.filter(p => !knownIds.has(p.place_id))
    }

    const leads = places.slice(0, limit).map(place => ({
      business_name:        place.name,
      google_business_url:  `https://maps.google.com/?place_id=${place.place_id}`,
      google_place_id:      place.place_id,
      phone:                place.formatted_phone_number,
      address:              place.formatted_address,
      city,
      vertical:             detectVertical(place.types || []) as Vertical,
      has_website:          !!place.website,
      existing_website:     place.website,
      demo_slug:            undefined,
      demo_generated_at:    undefined,
      email_sent_at:        undefined,
      email_opened_at:      undefined,
      demo_visited_at:      undefined,
      converted_at:         undefined,
      campaign_id:          undefined,
    }))

    const saved = await createLeads(leads)

    return NextResponse.json({
      success: true,
      count:   saved.length,
      leads:   saved,
      filters: { noWebsite, excludeKnown, openNow, minRating, maxRating, minReviews, maxReviews },
    })
  } catch (err) {
    console.error('Scrape error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
