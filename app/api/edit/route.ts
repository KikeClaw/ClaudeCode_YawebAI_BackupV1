import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getClientById, saveSiteContent } from '@/lib/db/clients'
import { verifyAdminJwt } from '@/lib/auth'
import type { HtmlContent, SiteContent } from '@/types'

const anthropic = new Anthropic()

// ── Types ─────────────────────────────────────────────────────────────────────

interface AttachedImage {
  data: string       // pure base64, no data-URI prefix
  mediaType: string  // image/jpeg | image/png | image/webp | image/gif
}

// ── Complexity detection → model selection ────────────────────────────────────

const MEDIUM_WORDS = [
  'sección', 'section', 'párrafo', 'paragraph', 'lista', 'list',
  'imagen', 'image', 'foto', 'photo', 'enlace', 'link', 'botón', 'button',
  'título', 'title', 'heading', 'icono', 'icon', 'reescribir', 'rewrite',
  'cambiar el texto', 'change text', 'eliminar', 'remove', 'borrar', 'delete',
  'mover', 'move', 'reorganizar', 'rearrange', 'añadir texto', 'add text',
]

function detectComplexity(instruction: string, hasImages: boolean): {
  model: string
  label: string
  costEur: number
} {
  const lower = instruction.toLowerCase()
  if (MEDIUM_WORDS.some(w => lower.includes(w))) {
    return { model: 'claude-sonnet-4-6', label: 'Sonnet', costEur: 0.05 }
  }
  // Images add token cost — bump estimate slightly
  return {
    model: 'claude-haiku-4-5-20251001',
    label: hasImages ? 'Haiku + Visión' : 'Haiku',
    costEur: hasImages ? 0.02 : 0.01,
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────

const EDIT_SYSTEM = `You are an expert HTML/CSS editor. You receive a complete single-file HTML website and a specific change instruction.
${''/* vision context added inline when images present */}
CRITICAL RULES:
1. Return the COMPLETE modified HTML — never truncate, never summarize, never use placeholders
2. Make ONLY the requested change — do not modify anything else
3. Preserve all existing classes, IDs, data attributes, scripts, and structure
4. For CSS changes: modify the existing <style> block or add targeted inline styles
5. Output raw HTML only — no markdown, no code fences, no explanation
6. If the instruction is ambiguous, apply the most reasonable interpretation
7. If screenshots are provided, use them to understand the visual context and identify what needs to be fixed`

// ── POST /api/edit ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.cookies.get('admin_auth')?.value ?? ''
  const jwtUser = await verifyAdminJwt(token)
  if (!jwtUser) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { client_id, instruction, images } = await req.json() as {
    client_id: string
    instruction: string
    images?: AttachedImage[]
  }

  if (!client_id || !instruction?.trim()) {
    return NextResponse.json({ error: 'client_id e instruction son requeridos' }, { status: 400 })
  }

  // Validate images
  const validImages = (images ?? []).filter(img =>
    img?.data && img?.mediaType &&
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(img.mediaType)
  ).slice(0, 3) // max 3 images

  // Fetch client + active HTML
  const client = await getClientById(client_id)
  if (!client) return NextResponse.json({ error: 'Web no encontrada' }, { status: 404 })

  const activeContent = (client.site_content as SiteContent[] | undefined)
    ?.find((c: SiteContent) => c.is_active)
  const existingHtml = (activeContent?.content as HtmlContent | undefined)?.html

  if (!existingHtml) {
    return NextResponse.json({ error: 'Esta web no tiene HTML guardado' }, { status: 404 })
  }

  const { model, label, costEur } = detectComplexity(instruction, validImages.length > 0)

  // Build user message content — images first (Anthropic convention), then text + HTML
  type ImageBlock = {
    type: 'image'
    source: { type: 'base64'; media_type: Anthropic.Base64ImageSource['media_type']; data: string }
  }
  type TextBlock = { type: 'text'; text: string }
  type ContentBlock = ImageBlock | TextBlock

  const userContent: ContentBlock[] = [
    ...validImages.map(img => ({
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: img.mediaType as Anthropic.Base64ImageSource['media_type'],
        data: img.data,
      },
    })),
    {
      type: 'text' as const,
      text: validImages.length > 0
        ? `The ${validImages.length} screenshot(s) above show the current visual state of the site. Use them to understand the issue described.\n\nINSTRUCTION: ${instruction.trim()}\n\n---\n\n${existingHtml}`
        : `INSTRUCTION: ${instruction.trim()}\n\n---\n\n${existingHtml}`,
    },
  ]

  try {
    // Use streaming internally to avoid the SDK's 10-min non-streaming timeout.
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 32000,
      system: EDIT_SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })

    const response = await stream.finalMessage()

    const newHtml = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('')
      .trim()

    if (!newHtml || newHtml.length < 500) {
      return NextResponse.json({ error: 'El modelo devolvió una respuesta inválida' }, { status: 500 })
    }

    await saveSiteContent(client_id, { _type: 'html', html: newHtml }, 'html')

    const usage = response.usage
    return NextResponse.json({
      ok: true,
      newHtml,
      model: label,
      costEur,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      demoUrl: `${process.env.NEXT_PUBLIC_APP_URL}/demo/${client.slug}`,
    })
  } catch (err) {
    console.error('[edit] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
