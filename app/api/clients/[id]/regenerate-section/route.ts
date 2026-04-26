import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { getClientById, getSiteVersions, saveSiteContent } from '@/lib/db/clients'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SECTION_IDS: Record<string, string[]> = {
  hero:      ['hero'],
  nosotros:  ['nosotros', 'about'],
  servicios: ['servicios', 'services', 'carta', 'menu'],
  reseñas:   ['reseñas', 'reviews', 'testimonios'],
  contacto:  ['contacto', 'contact'],
}

/**
 * Extract a complete HTML element (including nested children) by tag + id.
 * Uses a depth counter instead of lazy regex so nested tags are handled correctly.
 */
function extractNestedElement(html: string, tagName: string, id: string): string | null {
  const tag = tagName.toLowerCase()
  const openStr = `<${tag}`
  const closeStr = `</${tag}>`
  const lower = html.toLowerCase()

  // Find the opening tag that has this id
  const startRe = new RegExp(`<${tag}[^>]+id=["']${id}["'][^>]*>`, 'i')
  const startMatch = startRe.exec(html)
  if (!startMatch) return null

  const startIdx = startMatch.index
  let pos = startIdx
  let depth = 0

  while (pos < html.length) {
    const nextOpen = lower.indexOf(openStr, pos)
    const nextClose = lower.indexOf(closeStr, pos)

    if (nextClose === -1) return null // malformed HTML

    // Only count as an open if followed by '>' or whitespace (not e.g. <divider>)
    const validOpen =
      nextOpen !== -1 &&
      nextOpen < nextClose &&
      /[\s>]/.test(html[nextOpen + openStr.length] ?? '')

    if (validOpen) {
      depth++
      pos = nextOpen + openStr.length
    } else {
      depth--
      if (depth === 0) {
        return html.slice(startIdx, nextClose + closeStr.length)
      }
      pos = nextClose + closeStr.length
    }
  }
  return null
}

function extractSection(html: string, ids: string[]): { match: string; id: string } | null {
  for (const id of ids) {
    const sectionResult = extractNestedElement(html, 'section', id)
    if (sectionResult) return { match: sectionResult, id }
    const divResult = extractNestedElement(html, 'div', id)
    if (divResult) return { match: divResult, id }
  }
  return null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { section } = await req.json()

  const ids = SECTION_IDS[section]
  if (!ids) return NextResponse.json({ error: 'Unknown section' }, { status: 400 })

  const [client, versions] = await Promise.all([getClientById(id), getSiteVersions(id)])
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const latest = versions[0]
  const html = (latest?.content as { html?: string })?.html
  if (!html) return NextResponse.json({ error: 'No HTML found' }, { status: 404 })

  const found = extractSection(html, ids)
  if (!found) return NextResponse.json({ error: `Section "${section}" not found in HTML` }, { status: 404 })

  const prompt = `You are regenerating the "${section}" section of a website for "${client.name}" (${client.vertical}).

Current section HTML:
${found.match.slice(0, 3000)}

Generate a FRESH version of this section with different copy and layout variation. RULES:
- Keep id="${found.id}" on the outer element
- Keep the same CSS class structure — do NOT add new CSS
- Write real, specific copy for ${client.name} — no placeholder text
- Output ONLY the section HTML, nothing else
- No <style> tags, no <script> tags, no surrounding HTML`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  })

  const newSection = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  if (!newSection) return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 })

  const updatedHtml = html.replace(found.match, newSection)
  await saveSiteContent(id, { _type: 'html', html: updatedHtml }, 'html')

  return NextResponse.json({ ok: true })
}
