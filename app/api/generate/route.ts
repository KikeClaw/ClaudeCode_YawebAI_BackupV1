import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPlaceFromUrl, getPlaceById, detectVertical, isSocialMediaUrl } from '@/lib/google-places'
import { buildSite, generateSlug, VALID_MODELS, type GenerationModel } from '@/lib/ai/generator'
import { createClient, saveSiteContent } from '@/lib/db/clients'
import { jobStore } from '@/lib/jobStore'
import { verifyAdminJwt } from '@/lib/auth'
import { STYLE_PRESET_KEYS, type StylePresetKey } from '@/lib/style-presets'

// Rate limiter: max 10 generations per IP per hour
const rateLimits = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimits.get(ip)
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Demasiadas solicitudes. Máximo 10 generaciones por hora.' }, { status: 429 })
    }

    const {
      google_url, google_place_id, email, phone, whatsapp, contact_email,
      extra_context, menu_text, model, site_theme, variants, style_preset,
      tone, density, language, vertical_hint, palette, channel, is_internal,
      read_website, inspiration_url, instagram, facebook, tiktok,
      cta_type, value_prop, services_text, hero_photo_url, booking_url,
    } = await req.json()

    if (!google_url && !google_place_id && !extra_context) {
      return NextResponse.json({ error: 'Proporciona una URL de Google Business o contexto adicional' }, { status: 400 })
    }

    const safeModel: GenerationModel  = VALID_MODELS.includes(model) ? model : 'claude-sonnet-4-6'
    const safeTheme: 'light' | 'dark' = site_theme === 'dark' ? 'dark' : 'light'
    const safeStyle: StylePresetKey = STYLE_PRESET_KEYS.includes(style_preset) ? style_preset as StylePresetKey : 'auto'
    const safeTone: 'friendly' | 'formal' = tone === 'formal' ? 'formal' : 'friendly'
    const safeDensity: 'full' | 'minimal' = density === 'minimal' ? 'minimal' : 'full'
    const safeLang = (['es','en','de','fr'] as const).includes(language) ? language as 'es'|'en'|'de'|'fr' : 'es'
    const safeCta = (['phone','whatsapp','email','quote'] as const).includes(cta_type)
      ? cta_type as 'phone'|'whatsapp'|'email'|'quote'
      : undefined

    const token = req.cookies.get('admin_auth')?.value ?? ''
    const jwtUser = await verifyAdminJwt(token)
    const createdBy = jwtUser?.sub

    const jobId = randomUUID()
    jobStore.create(jobId)

    // Fire generation in background — response returns immediately with jobId
    runGeneration({
      jobId,
      google_url, google_place_id, email, phone,
      whatsapp, contactEmail: contact_email, extra_context,
      model: safeModel, siteTheme: safeTheme,
      variants: variants === true,
      stylePreset: safeStyle, tone: safeTone, density: safeDensity, language: safeLang,
      verticalHint: vertical_hint,
      palette: Array.isArray(palette) ? palette : undefined,
      channel: channel === 'landing' ? 'landing' : 'admin',
      isInternal: is_internal === true,
      readWebsite: read_website !== false,
      inspirationUrl: inspiration_url,
      social: (instagram || facebook || tiktok)
        ? { instagram: instagram || undefined, facebook: facebook || undefined, tiktok: tiktok || undefined }
        : undefined,
      ctaType: safeCta,
      menuText: menu_text || undefined,
      valueProp: value_prop || undefined,
      servicesText: services_text || undefined,
      heroPhotoOverride: hero_photo_url || undefined,
      bookingUrl: booking_url || undefined,
      createdBy,
    })

    return NextResponse.json({ job_id: jobId })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function runGeneration({
  jobId, google_url, google_place_id, email, phone, whatsapp, contactEmail,
  extra_context, menuText, model, siteTheme, variants, stylePreset, tone,
  density, language, verticalHint, palette, channel, isInternal, readWebsite,
  inspirationUrl, social, ctaType, valueProp, servicesText, heroPhotoOverride, bookingUrl, createdBy,
}: {
  jobId: string
  google_url?: string
  google_place_id?: string
  email?: string
  phone?: string
  whatsapp?: string
  contactEmail?: string
  extra_context?: string
  menuText?: string
  model: GenerationModel
  siteTheme: 'light' | 'dark'
  variants?: boolean
  stylePreset: StylePresetKey
  tone: 'friendly' | 'formal'
  density: 'full' | 'minimal'
  language: 'es' | 'en' | 'de' | 'fr'
  verticalHint?: string
  palette?: string[]
  channel?: 'admin' | 'landing' | 'api'
  isInternal?: boolean
  readWebsite?: boolean
  inspirationUrl?: string
  social?: { instagram?: string; facebook?: string; tiktok?: string }
  ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote'
  valueProp?: string
  servicesText?: string
  heroPhotoOverride?: string
  bookingUrl?: string
  createdBy?: string
}) {
  try {
    // ── Resolve place + vertical ──────────────────────────────────────────────
    jobStore.update(jobId, { message: 'Buscando información del negocio…' })
    let place = null
    let vertical: ReturnType<typeof detectVertical> = 'generic'

    if (google_place_id) {
      place = await getPlaceById(google_place_id)
      if (place) vertical = detectVertical(place.types || [])
      else if (verticalHint) vertical = verticalHint as ReturnType<typeof detectVertical>
    } else if (google_url) {
      place = await getPlaceFromUrl(google_url)
      if (!place && !extra_context) {
        jobStore.update(jobId, { status: 'error', error: 'No se encontró el negocio en Google' })
        return
      }
      if (place) vertical = detectVertical(place.types || [])
      else if (verticalHint) vertical = verticalHint as ReturnType<typeof detectVertical>
    } else if (verticalHint) {
      vertical = verticalHint as ReturnType<typeof detectVertical>
    }

    const businessName = place?.name ?? (extra_context?.split('\n')[0]?.slice(0, 60) ?? 'negocio')
    const baseSlug     = await generateSlug(businessName)
    const id36         = Date.now().toString(36)

    // ── Run shared pipeline (social, scraping, menu, generation) ─────────────
    jobStore.update(jobId, { message: 'Generando el sitio web con IA…' })
    const result = await buildSite(place, vertical, {
      model, siteTheme, whatsapp, contactEmail,
      extraContext: extra_context,
      menuText, stylePreset, tone, density, language, palette,
      social, ctaType, valueProp, servicesText, heroPhotoOverride,
      inspirationUrl, readWebsite, variants, bookingUrl,
    })

    // ── Persist + notify job ──────────────────────────────────────────────────
    jobStore.update(jobId, { message: 'Guardando la web…' })
    const safeEmail = email || (place?.website && !isSocialMediaUrl(place.website) ? place.website : undefined)
    const safePhone = phone || place?.formatted_phone_number

    const clientBase = {
      name: businessName, vertical,
      google_business_url: google_url || undefined,
      google_place_id: place?.place_id,
      email: safeEmail, phone: safePhone,
      channel: channel ?? 'admin',
      model, is_internal: isInternal ?? false, created_by: createdBy,
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (variants && result.htmlB) {
      const slugA = `${baseSlug}-${id36}-a`
      const slugB = `${baseSlug}-${id36}-b`
      const tokens = { input_tokens: result.inputTokens, output_tokens: result.outputTokens, cost_usd: result.costUsd }
      const [clientA, clientB] = await Promise.all([
        createClient({ ...clientBase, slug: slugA, ...tokens }),
        createClient({ ...clientBase, slug: slugB, ...tokens }),
      ])
      await Promise.all([
        saveSiteContent(clientA.id, { _type: 'html', html: result.html  }, 'html'),
        saveSiteContent(clientB.id, { _type: 'html', html: result.htmlB }, 'html'),
      ])
      jobStore.update(jobId, {
        status: 'done',
        clientId: clientA.id, slug: slugA, demoUrl: `${appUrl}/demo/${slugA}`,
        altSlug: slugB,       altDemoUrl: `${appUrl}/demo/${slugB}`,
        businessName, vertical,
        inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: result.costUsd,
        validationWarning: result.validationWarning,
        aiValidationIssues: result.aiValidationIssues,
        buildReport: result.buildReport,
        cacheReadTokens: result.cacheReadTokens,
        cacheWriteTokens: result.cacheWriteTokens,
      })
    } else {
      const slug = `${baseSlug}-${id36}`
      const client = await createClient({
        ...clientBase, slug,
        input_tokens: result.inputTokens, output_tokens: result.outputTokens, cost_usd: result.costUsd,
      })
      await saveSiteContent(client.id, { _type: 'html', html: result.html }, 'html')
      jobStore.update(jobId, {
        status: 'done', clientId: client.id, slug,
        demoUrl: `${appUrl}/demo/${slug}`,
        businessName, vertical,
        inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: result.costUsd,
        truncated: result.truncated,
        validationWarning: result.validationWarning,
        aiValidationIssues: result.aiValidationIssues,
        buildReport: result.buildReport,
        cacheReadTokens: result.cacheReadTokens,
        cacheWriteTokens: result.cacheWriteTokens,
      })
    }
  } catch (err) {
    console.error('[generate] error:', err)
    const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err)
    const stack = err instanceof Error ? (err.stack ?? '') : ''
    // Build a structured, copiable error log for faster debugging
    const errorLog = [
      `=== yaweb.ai Error Log ===`,
      `Time:      ${new Date().toISOString()}`,
      `Job ID:    ${jobId}`,
      `Model:     ${model}`,
      `Preset:    ${stylePreset}`,
      `Tone:      ${tone} / ${density} / ${language}`,
      `Variants:  ${variants ?? false}`,
      `URL:       ${google_url ?? google_place_id ?? '(no URL)'}`,
      `Extra ctx: ${extra_context ? extra_context.slice(0, 120) : '—'}`,
      ``,
      `Error: ${msg}`,
      ``,
      stack ? `Stack:\n${stack}` : '(no stack trace)',
    ].join('\n')
    jobStore.update(jobId, { status: 'error', error: msg, errorLog })
  }
}
