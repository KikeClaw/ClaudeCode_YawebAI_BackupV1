import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy for Google Places photos — keeps API key out of public HTML.
 *
 * Places API (New) v2: photo_reference = resource name "places/.../photos/..."
 *   Endpoint: GET https://places.googleapis.com/v1/{name}/media?maxWidthPx=N&key=K
 *   Response: image/jpeg directly (follows redirect internally)
 *   Alt:      add skipHttpRedirect=true → JSON { photoUri: "https://lh3..." }
 *
 * Places API (Legacy) v1: photo_reference = raw opaque string
 *   Endpoint: GET https://maps.googleapis.com/maps/api/place/photo?photo_reference=...
 */
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const w   = req.nextUrl.searchParams.get('w') ?? '800'

  if (!ref) return new NextResponse('Missing ref', { status: 400 })

  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return new NextResponse('Misconfigured', { status: 500 })

  // Detect v2 resource names (start with "places/")
  const isV2 = ref.startsWith('places/')

  const url = isV2
    ? `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=${w}&skipHttpRedirect=true&key=${key}`
    : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${w}&photo_reference=${encodeURIComponent(ref)}&key=${key}`

  try {
    const upstream = await fetch(url, { redirect: 'follow' })
    if (!upstream.ok) return new NextResponse('Photo not found', { status: 404 })

    const contentType = upstream.headers.get('content-type') ?? ''

    // v2 with skipHttpRedirect=true returns JSON { name, photoUri }
    if (isV2 && contentType.includes('application/json')) {
      const json = await upstream.json() as { photoUri?: string }
      if (!json.photoUri) return new NextResponse('No photo URI', { status: 404 })

      const imgRes = await fetch(json.photoUri, { redirect: 'follow' })
      if (!imgRes.ok) return new NextResponse('Photo upstream error', { status: 502 })

      return new NextResponse(await imgRes.arrayBuffer(), {
        headers: {
          'Content-Type': imgRes.headers.get('content-type') ?? 'image/jpeg',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      })
    }

    // Legacy v1 or v2 image redirect already followed — binary body
    return new NextResponse(await upstream.arrayBuffer(), {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    })
  } catch {
    return new NextResponse('Upstream error', { status: 502 })
  }
}
