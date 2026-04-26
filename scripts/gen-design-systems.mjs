/**
 * Calls Opus 4.7 to generate premium CSS Design Systems for all 11 style presets.
 * Run: node scripts/gen-design-systems.mjs
 * Output: scripts/design-systems-output.json
 */

import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Read API key from .env.local
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const apiKeyMatch = envContent.match(/ANTHROPIC_API_KEY=([^\n\r]+)/)
const apiKey = apiKeyMatch?.[1]?.trim()
if (!apiKey) throw new Error('ANTHROPIC_API_KEY not found in .env.local')

const anthropic = new Anthropic({ apiKey })

// ── Standardised HTML class vocabulary ──────────────────────────────────────
// ALL presets style these same class names. The AI HTML generator is instructed
// to use exactly these classes — our CSS then guarantees the visual result.

const CLASS_VOCAB = `
STANDARDISED CLASS VOCABULARY (style ALL of these):
- Navigation: .nav, .nav-logo, .nav-links li a, .nav-cta, .nav-hamburger
- Hero section: .hero, .hero-inner, .hero-eyebrow, .hero h1 (hero title), .hero-sub, .hero-btns
- Buttons: .btn-primary, .btn-secondary, .btn-outline
- Section headings: .section-heading (contains h2), .section-sub (subtitle below heading)
- About: .about, .about-inner, .about-text, .about-text h2, .about-img, .about-highlight
- Services: .cards-grid (3-col grid), .card, .card-icon, .card-title, .card-desc, .card-price
- Features: .feats-grid (2-col grid), .feat, .feat-icon, .feat-title, .feat-text
- Reviews: .reviews-grid (3-col), .review-card, .review-stars, .review-text, .review-author
- FAQ: .faq-list, .faq-item (details element), .faq-q (summary), .faq-a
- CTA band: .cta-band, .cta-band h2, .cta-band p, .cta-band .btn-cream
- Contact: .contact-grid (2-col), .contact-info, .contact-form, .form-group, .form-group label, .form-group input, .form-group textarea, .form-submit
- Footer: footer, .footer-inner, .footer-top, .footer-brand, .footer-name, .footer-links a, .footer-bottom
- Utilities: .fade-in (opacity:0 → opacity:1 on scroll), .map-embed (Google Maps iframe)
`

// ── Preset definitions ───────────────────────────────────────────────────────

const PRESETS = [
  {
    key: 'clasico',
    name: 'Clásico',
    brief: `Timeless professional elegance for law firms, notaries, financial advisors, consultancies.
PERSONALITY: Established institution energy. Formal, trustworthy, authoritative but approachable.
COLORS: Navy blue primary #1a3a5c, gold accent #c9a96e, warm off-white background #f8f7f4, body text #1a1a1a, surface white #ffffff.
TYPOGRAPHY: Serif headings — Playfair Display (weights 400, 700). Body — Inter (400, 500).
CARDS: Subtle, understated. White bg, 1px solid #e5e0d8 border, border-radius 6px, light shadow (0 1px 6px rgba(0,0,0,.07)).
BUTTONS: Rectangular, border-radius 6px. Primary: #1a3a5c solid. Outline: 1px solid #1a3a5c.
HERO: Full-bleed photo with dark overlay (rgba 0.55). Centered Playfair Display headline in white. Gold CTA button.
SECTIONS: Alternating #f8f7f4 / white. Thin gold horizontal rule (60px wide, 1px, #c9a96e) below section headings. Generous 100-120px vertical padding.
DETAILS: Gold underline on hover for nav links. No harsh shadows. Classic proportions.`,
  },
  {
    key: 'mediterraneo',
    name: 'Mediterráneo',
    brief: `Warm artisan hospitality for restaurants, bakeries, rural hotels, tapas bars, artisan shops.
PERSONALITY: Family warmth, handcrafted quality, southern European sun. Welcoming and genuine.
COLORS: Terracotta primary #c1440e, sandy accent #e8a87c, warm cream background #faf6f0, text #2d1f13, dark footer #1a0f08.
TYPOGRAPHY: Serif headings — Lora (weights 400, 600). Body — Inter (400, 500).
CARDS: White bg, border-radius 16px, warm shadow (0 4px 24px rgba(193,68,14,.10)), subtle border rgba(193,68,14,.08). Hover: translateY(-4px).
BUTTONS: Pill-shaped (border-radius 50px). Primary: #c1440e with warm glow shadow. Generous padding 14px 32px.
HERO: Full-bleed warm photo with amber overlay (rgba(193,68,14,0.40)). Centered Lora headline. Pill CTA.
SECTIONS: SVG wave dividers between sections. Alternating #faf6f0 / white. Slightly rounded section transitions.
DETAILS: Warm amber accents on hover. Card icons in terracotta. Footer dark and cosy (#1a0f08).`,
  },
  {
    key: 'minimal',
    name: 'Minimal',
    brief: `Pure editorial minimalism for premium salons, architects, design studios, luxury retail, photography.
PERSONALITY: Confidence through restraint. Every element earns its place. Maximum whitespace.
COLORS: Near-black #111111 on pure white #ffffff. ONE optional accent (#111 default). Zero pastels. Cool gray #f5f5f5 for subtle surfaces.
TYPOGRAPHY: Inter exclusively (weights 300, 400, 700, 900). Headings: weight 900, letter-spacing -0.04em. Body: weight 400, line-height 1.75.
CARDS: Flat — white bg, 1px solid #e5e5e5 border, border-radius 4px, NO shadows. Or truly borderless with only spacing.
BUTTONS: Sharp rectangular, border-radius 4px. Primary: #111 solid, white text. Hover: invert (white bg, black border). Letter-spacing 0.06em, text-transform uppercase, font-size 0.85rem.
HERO: TYPE-ONLY hero — massive Inter 900 headline fills the space, no image OR full-bleed B&W photo, zero gradient overlays.
SECTIONS: ALL white background (no color alternation). 140-160px vertical padding. Thin 1px #e5e5e5 dividers between sections.
DETAILS: No decorative elements whatsoever. Hover is a simple underline or border-color change.`,
  },
  {
    key: 'vibrante',
    name: 'Vibrante',
    brief: `Bold kinetic energy for gyms, fitness studios, dance academies, sport brands, youth-oriented businesses.
PERSONALITY: High voltage, zero compromise. Forward momentum. Speaks to ambition and action.
COLORS: Electric purple primary #7c3aed, amber accent #f59e0b, background #fafafa, text #111111, gradient: linear-gradient(135deg, #7c3aed, #9333ea).
TYPOGRAPHY: Outfit (weights 400, 800, 900). Headings: weight 900, letter-spacing -0.04em, huge scale (clamp 3rem–6rem for hero). Body: weight 400.
CARDS: Bold — white bg, border-radius 20px, strong shadow (0 8px 32px rgba(124,58,237,.18)), hover scale(1.03). Purple left-border accent (4px solid #7c3aed).
BUTTONS: Pill (border-radius 50px). Primary: gradient #7c3aed→#9333ea, white text, strong box-shadow. Hover: brighter gradient + scale(1.04).
HERO: Full-width gradient background (#7c3aed → #4c1d95). Oversized Outfit 900 headline in white. Amber accent on a word. Pill CTA with amber glow.
SECTIONS: Diagonal clip-path between hero and first section (skewY -3deg). Vivid purple band for CTA. High-contrast alternating sections.
DETAILS: Gradient underlines on hover. Amber accent for prices and highlights. Purple glow on focused form inputs.`,
  },
  {
    key: 'lujo',
    name: 'Lujo',
    brief: `Dark luxury aesthetics for high-end restaurants, boutique hotels, premium spas, champagne bars, exclusive private clubs.
PERSONALITY: Understated opulence. Whispered exclusivity. The kind of place that doesn't need to shout.
COLORS: Deep near-black background #0f0f0f, section surface #1a1a1a, gold primary #c9a96e, cream text #f5f0e8, muted text rgba(245,240,232,.6).
TYPOGRAPHY: Cormorant Garamond headings (weights 300, 400, 600). Body: Inter Light (300). Generous line-height 1.85.
CARDS: Dark luxury — background #1a1a1a, gold border 1px solid rgba(201,169,110,.25), border-radius 8px, gold glow (0 0 30px rgba(201,169,110,.06)). Hover: gold border opacity increases.
BUTTONS: Outlined gold — border 1px solid #c9a96e, color #c9a96e, transparent bg, border-radius 4px. Hover: fill with #c9a96e, text #0f0f0f. Letter-spacing 0.14em, uppercase, tiny font.
HERO: Full-bleed photo, heavy dark overlay (rgba 0.72). Centered Cormorant 300 headline in cream. Minimal gold outline CTA.
SECTIONS: ALL dark (#0f0f0f / #1a1a1a alternating). Thin gold 1px horizontal line as divider. Star/diamond separator icons in gold.
DETAILS: Subtle grain texture via CSS. No bright elements whatsoever. Footer matches the deep dark aesthetic.`,
  },
  {
    key: 'fresco',
    name: 'Fresco',
    brief: `Clean trustworthy wellness design for clinics, dental practices, pharmacies, nutritionists, psychologists, physiotherapists.
PERSONALITY: Clinical cleanliness meets natural warmth. Trusted. Calm. Reassuring.
COLORS: Forest green primary #0d7a5f, teal accent #38b2a0, mint background #f0f9f6, text #0f2922, surface white #ffffff.
TYPOGRAPHY: Plus Jakarta Sans (weights 400, 600, 700). Headings: weight 700. Body: weight 400. Line-height 1.7.
CARDS: Light and clean — white bg, border-radius 12px, border 1px solid #d1fae5, soft shadow (0 2px 12px rgba(13,122,95,.08)). Icon in teal circle.
BUTTONS: Rounded — border-radius 10px. Primary: #0d7a5f solid, white text. Secondary: teal outline. Padding 12px 28px.
HERO: Light image with subtle mint-green overlay (rgba(13,122,95,.25)). Dark green headline. White pill CTA button with green border.
SECTIONS: Alternating white / #f0f9f6. Clean horizontal teal gradient line (3px) as section divider. Icon-forward layout.
DETAILS: Teal focus ring on form inputs. Green checkmark bullets for feature lists. Trust badges prominently styled.`,
  },
  {
    key: 'urbano',
    name: 'Urbano',
    brief: `Contemporary urban lifestyle for modern cafés, barbershops, co-working spaces, urban restaurants, lifestyle retail.
PERSONALITY: Confident city energy. Polished but accessible. Global sensibility, local soul.
COLORS: Steel blue primary #0f4c81, slate accent #64748b, cool gray background #f5f7fa, text #1a2332, surface white #ffffff.
TYPOGRAPHY: Inter (weights 400, 600, 800). Headings: weight 800, letter-spacing -0.025em. Body: 400.
CARDS: Modern — white bg, border-radius 12px, shadow (0 4px 16px rgba(15,76,129,.10)), border 1px solid #e2e8f0. Hover: shadow increase + slight lift.
BUTTONS: Rounded — border-radius 8px. Primary: #0f4c81 solid. Hover: darken + lift shadow. Padding 13px 28px.
HERO: Full-bleed photo, blue overlay (rgba(15,76,129,.60)). Bold Inter 800 headline. Clean rectangular CTA.
SECTIONS: Alternating #f5f7fa / white. Thin #e2e8f0 dividers. Card-forward layout with clear grid structure.
DETAILS: Blue underline accent on active nav. Slightly desaturated photo treatment via CSS filter. Structured, grid-based feel.`,
  },
  {
    key: 'natural',
    name: 'Natural',
    brief: `Organic earth-connected design for yoga studios, organic food shops, eco-businesses, herbalists, sustainable brands, wellness retreats.
PERSONALITY: Grounded. Authentic. In harmony with nature. Zero artificiality. Like breathing fresh air.
COLORS: Sage green primary #5a7a52, warm earth accent #a67c5b, parchment background #f7f3ed, text #2d2318, soft surface #fdf9f4.
TYPOGRAPHY: Libre Baskerville headings (weights 400, 700) — organic serif feel. Body — Source Sans 3 (400, 600).
CARDS: Organic — parchment bg #fdf9f4, border-radius 14px, earthy border 1px solid rgba(90,122,82,.2), gentle shadow (0 3px 16px rgba(90,122,82,.08)). Slight texture feel.
BUTTONS: Soft pill (border-radius 50px). Primary: #5a7a52 solid, cream text. Hover: earthy darken. Natural padding.
HERO: Soft nature photo with warm parchment overlay (rgba(247,243,237,.45)). Serif headline in dark earth tone. Understated pill CTA.
SECTIONS: Warm parchment / white alternating. Botanical SVG leaf/branch separator elements. Generous breathing room.
DETAILS: Earth-toned icon accents. Handwritten-feel section labels (font-style: italic on eyebrow text). No harsh lines.`,
  },
  {
    key: 'nordico',
    name: 'Nórdico',
    brief: `Scandinavian functional minimalism for design studios, tech offices, architects, modern consultancies, premium co-working, forward-thinking brands.
PERSONALITY: Functional beauty. Nothing superfluous. Clarity as a design value. Cool, precise, quietly confident.
COLORS: Cool white primary #f8fafc, blue-gray accent #4a6fa5, slate text #1e293b, light surface #f1f5f9, border #e2e8f0, dark sections #1e293b.
TYPOGRAPHY: DM Sans (weights 300, 400, 700). Headings: weight 700, letter-spacing -0.02em. Body: 400. Generous line-height 1.8.
CARDS: Borderless or minimal — white bg, border-radius 8px, very subtle shadow (0 2px 8px rgba(0,0,0,.06)), or just 1px solid #e2e8f0 with no shadow. Clean and spacious padding.
BUTTONS: Slightly rounded — border-radius 8px. Primary: #1e293b solid, white text. Secondary: outline #4a6fa5. Simple, no gradients.
HERO: Two-tone layout — large left white area with oversized headline, right side slate dark panel (#1e293b) with feature image. OR full-width light photo.
SECTIONS: Mostly white with one accent dark section (#1e293b with white text) for CTA. Asymmetric layouts. Grid-based.
DETAILS: Blue-gray accent sparingly. Monochromatic feel with one blue note. No decorative elements — functional icons only.`,
  },
  {
    key: 'festivo',
    name: 'Festivo',
    brief: `Cheerful celebratory design for pastry shops, flower shops, event planners, children's activities, gift shops, celebration venues, confectionery.
PERSONALITY: Pure joy. Warm optimism. Occasions and celebrations. Makes you smile the moment you land.
COLORS: Coral primary #f4845f, warm yellow accent #fbbf24, soft pink background #fff8f6, text #3d1a0e, white surfaces #ffffff.
TYPOGRAPHY: Nunito (weights 400, 700, 800) — friendly rounded letterforms. Body: Nunito 400.
CARDS: Rounded and playful — white bg, border-radius 20px, warm shadow (0 4px 20px rgba(244,132,95,.15)), soft coral border-top 3px solid #f4845f.
BUTTONS: Extra-rounded pill (border-radius 50px). Primary: coral #f4845f, white text, warm glow shadow. Hover: brighter + bounce animation. Generous and tappable.
HERO: Bright, warm photography with very light coral overlay (rgba(244,132,95,.15)). Large friendly Nunito 800 headline. Cheerful pill CTA.
SECTIONS: Alternating #fff8f6 / white. Subtle confetti-dot pattern on CTA band (CSS radial-gradient). Rounded section transitions.
DETAILS: Yellow accent for prices and highlights. Rounded badges everywhere. No sharp angles anywhere. Bouncy micro-animations.`,
  },
  {
    key: 'industrial',
    name: 'Industrial',
    brief: `Raw industrial aesthetic for craft breweries, barbershops, tattoo studios, mechanics, vintage workshops, artisan makers, masculine lifestyle brands.
PERSONALITY: Authentic. Gritty. No-nonsense. Built to last. Respect for craft and process.
COLORS: Near-black background #141414, rust/oxide accent #b5451b, warm off-white text #f0ece4, medium dark surface #1f1f1f, muted #8a8277.
TYPOGRAPHY: Oswald headings (weights 400, 600, 700) — strong condensed industrial look. Body — Inter (400) in off-white.
CARDS: Dark industrial — background #1f1f1f, border-radius 4px (almost square), rust left-border 3px solid #b5451b, subtle texture. NO rounded corners. Hard edges.
BUTTONS: Sharp rectangular (border-radius 4px). Primary: rust #b5451b, off-white text. Outline: 2px solid #b5451b, transparent bg. Uppercase, letter-spacing 0.1em.
HERO: Dark gritty full-bleed photo, heavy black overlay (rgba 0.70). Condensed Oswald uppercase headline. Bold rust CTA button.
SECTIONS: ALL dark (#141414 / #1f1f1f alternating). Rust accent lines as dividers. Industrial steel-plate texture via CSS repeating-linear-gradient.
DETAILS: Rust hover highlights. Monochrome photography treatment. No softness anywhere — this aesthetic is honest and tough.`,
  },
]

// ── The Opus prompt template ─────────────────────────────────────────────────

function buildOpusPrompt(preset) {
  return `You are a world-class CSS designer and front-end developer.
Your task: create a COMPLETE, PRODUCTION-READY CSS design system for a Spanish local business website generator.

PRESET: ${preset.name}
DESIGN BRIEF:
${preset.brief}

${CLASS_VOCAB}

REQUIREMENTS:
1. Write 450-600 lines of CSS covering EVERY class in the vocabulary above
2. Start with: @import for Google Fonts (choose the best font for this preset from the brief)
3. Include :root with CSS custom properties (--primary, --accent, --bg, --text, --surface, --radius-card, --radius-btn, --shadow, --font-heading, --font-body)
4. Include: hover states, focus states, active states for interactive elements
5. Include: responsive breakpoints (max-width: 768px mobile, max-width: 1024px tablet)
6. Include: .fade-in class (opacity:0 transform:translateY(20px) → .visible opacity:1 transform:none, transition .6s ease)
7. All cards MUST have hover lift effect (transform: translateY(-4px) + enhanced shadow)
8. All buttons MUST have hover effect matching the preset personality
9. Nav must be sticky (position:fixed), transparent initially, white/dark on .scrolled class
10. Hero must be min-height: 100vh, flexbox centered
11. Include a subtle CSS animation for the hero CTA button (e.g. pulse on Vibrante, none on Minimal)
12. .cards-grid: 3 columns on desktop, 2 on tablet, 1 on mobile
13. .feats-grid: 2 columns on desktop, 1 on mobile
14. contact-grid: 2 columns on desktop, 1 on mobile
15. Form inputs must have smooth focus transitions with the preset's accent color

Also write a PROMPT DIRECTIVE: a paragraph (200-300 words) that instructs the AI HTML generator to:
- Use these EXACT class names from the vocabulary (stress this is mandatory)
- Request the specific Google Font by name in a <link> tag
- Follow the color palette with specific hex values
- Follow the layout personality (card styles, button shapes, section structure)
- Adapt content naturally for the business type

Use EXACTLY this output format with these delimiters (no JSON, no markdown):

===GOOGLE_FONT===
[Font name + weights, e.g.: Playfair Display:wght@400;700]
===PROMPT_DIRECTIVE===
[200-300 word directive paragraph]
===CSS_INJECT===
[complete CSS — all 450-600 lines]
===END===`
}

// ── Call Opus for one preset ─────────────────────────────────────────────────

function extractSection(raw, start, end) {
  const startIdx = raw.indexOf(start)
  if (startIdx === -1) return ''
  const contentStart = startIdx + start.length
  const endIdx = end ? raw.indexOf(end, contentStart) : raw.length
  return raw.slice(contentStart, endIdx === -1 ? raw.length : endIdx).trim()
}

async function generatePreset(preset) {
  console.log(`⏳ Generating: ${preset.name}...`)
  const start = Date.now()

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    messages: [{ role: 'user', content: buildOpusPrompt(preset) }],
  })

  const raw = message.content.filter(b => b.type === 'text').map(b => b.text).join('')

  const googleFont     = extractSection(raw, '===GOOGLE_FONT===',      '===PROMPT_DIRECTIVE===')
  const promptDirective = extractSection(raw, '===PROMPT_DIRECTIVE===', '===CSS_INJECT===')
  const cssInject       = extractSection(raw, '===CSS_INJECT===',       '===END===')

  if (!cssInject) throw new Error(`No CSS found for ${preset.name}. Raw length: ${raw.length}`)

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  console.log(`✅ ${preset.name} — ${elapsed}s | in:${message.usage.input_tokens} out:${message.usage.output_tokens} | CSS: ${cssInject.length} chars`)

  return {
    key: preset.key,
    name: preset.name,
    googleFont,
    promptDirective,
    cssInject,
    tokens: { in: message.usage.input_tokens, out: message.usage.output_tokens },
  }
}

// ── Main — run in batches of 3 to avoid rate limits ─────────────────────────

async function main() {
  console.log(`\n🎨 Generating ${PRESETS.length} CSS Design Systems via Opus 4.7\n`)

  const results = []
  const batchSize = 3

  for (let i = 0; i < PRESETS.length; i += batchSize) {
    const batch = PRESETS.slice(i, i + batchSize)
    console.log(`\n── Batch ${Math.floor(i/batchSize)+1}/${Math.ceil(PRESETS.length/batchSize)} ──`)
    const batchResults = await Promise.all(batch.map(p =>
      generatePreset(p).catch(err => { console.error(`❌ ${p.name}: ${err.message}`); return null })
    ))
    results.push(...batchResults.filter(Boolean))

    // Small pause between batches
    if (i + batchSize < PRESETS.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // Write output
  const outputPath = join(__dir, 'design-systems-output.json')
  writeFileSync(outputPath, JSON.stringify(results, null, 2))

  const totalIn  = results.reduce((s, r) => s + r.tokens.in,  0)
  const totalOut = results.reduce((s, r) => s + r.tokens.out, 0)
  const costUsd  = (totalIn * 15 / 1_000_000 + totalOut * 75 / 1_000_000).toFixed(2)

  console.log(`\n✨ Done! Results saved to scripts/design-systems-output.json`)
  console.log(`📊 Total tokens: ${totalIn.toLocaleString()} in / ${totalOut.toLocaleString()} out`)
  console.log(`💰 Estimated cost: $${costUsd}`)
}

main().catch(err => { console.error('❌', err); process.exit(1) })
