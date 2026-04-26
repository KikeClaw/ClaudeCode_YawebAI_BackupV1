import { NextRequest, NextResponse } from 'next/server'
import { getSiteVersions, saveSiteContent } from '@/lib/db/clients'

/**
 * Detect the actual brand/accent CSS custom properties declared in :root.
 * Returns variable names (without --) that represent the brand color.
 * Falls back to a standard set if none are found.
 */
function detectBrandVars(html: string): string[] {
  // Extract the first :root { ... } block from the CSS
  const rootBlock = html.match(/:root\s*\{([^}]*)\}/)?.[1] ?? ''
  if (!rootBlock) return ['accent', 'primary', 'color-primary', 'color-accent', 'brand', 'brand-color']

  const all: string[] = []
  const re = /--([\w-]+)\s*:\s*#[0-9a-fA-F]{3,8}/g
  let m
  while ((m = re.exec(rootBlock)) !== null) all.push(m[1])

  if (all.length === 0) return ['accent', 'primary', 'color-primary', 'color-accent', 'brand', 'brand-color']

  // Prefer variables whose names suggest "brand/accent" semantics
  const branded = all.filter(v =>
    /accent|primary|brand|main|highlight|cta|action|theme-color/.test(v) &&
    !/bg|background|text|fore|muted|surface|border|shadow|grey|gray|dark|light|secondary|neutral|base/.test(v)
  )

  return branded.length > 0
    ? branded
    : ['accent', 'primary', 'color-primary', 'color-accent', 'brand', 'brand-color']
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { color } = await req.json()

  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json({ error: 'Invalid color — must be 6-digit hex' }, { status: 400 })
  }

  const versions = await getSiteVersions(id)
  const latest = versions[0]
  const html = (latest?.content as { html?: string })?.html
  if (!html) return NextResponse.json({ error: 'No HTML found for this client' }, { status: 404 })

  // Detect which CSS variables the AI actually used for the brand color
  const varsToOverride = detectBrandVars(html)
  const declarations = varsToOverride.map(v => `--${v}:${color}`).join(';')
  const override = `<style id="yw-color-override">:root{${declarations}}</style>`

  const updated = html.includes('id="yw-color-override"')
    ? html.replace(/<style id="yw-color-override">[\s\S]*?<\/style>/, override)
    : html.replace('</head>', override + '\n</head>')

  await saveSiteContent(id, { _type: 'html', html: updated }, 'html')
  return NextResponse.json({ ok: true, vars: varsToOverride })
}
