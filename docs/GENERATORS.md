# yaweb.ai — Web Generators

There are **two independent form UIs** that both call the same `/api/generate` endpoint. They serve different audiences and have intentionally different feature sets.

---

## Overview

| | Landing (`/`) | Admin (`/admin/clients/new`) |
|---|---|---|
| **Audience** | Public — business owners trying the product, or operator sharing with a prospect | Internal operator only |
| **Goal** | Frictionless first impression. Minimum input, maximum magic. | Power-user control. Every param exposed. |
| **Auth** | None | Admin session required |
| **After generation** | Shows external link to demo | Shows iframe preview inside admin, then saves to CRM |
| **Email trigger** | Auto-sends preview email to the entered address | No email — goes to client list |
| **Job key** | `yaweb_pub` (localStorage) | `yaweb_job` (localStorage) |

---

## Feature Comparison

### Input fields

| Feature | Landing | Admin |
|---|---|---|
| Google Business URL | ✅ | ✅ |
| Extra context (free text) | ✅ 2000 chars | ✅ 3000 chars |
| WhatsApp | ✅ | ✅ |
| Email | ✅ (client record + preview send) | ✅ (client record only, no preview send) |
| Phone | ❌ | ✅ |
| Contact email (separate from record email) | ❌ bug: uses `email` for both | ✅ sends `contact_email` separately |
| Menu / Carta | ✅ (advanced) 3000 chars | ✅ (advanced) |
| Vertical hint (tipo de negocio) | ❌ | ✅ 12 categories |

### Generation parameters

| Feature | Landing | Admin |
|---|---|---|
| AI model selector | ✅ dropdown (5 models) | ✅ icon cards with cost estimates (6 models) |
| Theme (light / dark) | ✅ (advanced) | ✅ |
| Style preset (modern / classic) | ✅ (advanced) | ✅ |
| Tone (friendly / formal) | ✅ (advanced) | ✅ |
| Density (full / minimal) | ✅ (advanced) | ✅ |
| Language (ES / EN / DE / FR) | ❌ defaults to ES | ✅ |
| Variants A/B | ✅ (advanced, checkbox) | ✅ (advanced, toggle) |

### UX helpers

| Feature | Landing | Admin |
|---|---|---|
| Progress bar with stage labels | ✅ inline in form | ✅ full-screen view |
| Step indicators (5 dots) | ❌ | ✅ |
| Resume in-progress job on reload | ✅ | ✅ |
| Quick-fill example presets | ❌ | ✅ 5 verticals |
| Context history (localStorage) | ❌ | ✅ saves up to 10 |
| Palette chips preview | ❌ | ✅ per vertical |
| Advanced options collapsible | ✅ | ✅ |
| Post-generation preview | External link only | Iframe inside admin |

---

## API Parameters — `/api/generate` (POST)

Both UIs call the same endpoint. Here's every param it accepts:

```ts
{
  // Input sources (at least one required)
  google_url?: string          // Google Maps / Business URL
  google_place_id?: string     // Direct place ID (admin bulk mode)
  extra_context?: string       // Free-text business description

  // Contact info (embedded in generated site)
  email?: string               // Goes to client record
  contact_email?: string       // Injected into site HTML (contact form, footer)
  phone?: string               // Stored in client record
  whatsapp?: string            // Injected as floating WA button

  // Content
  menu_text?: string           // Carta/menú — rendered as section in site

  // Generation params
  model?: string               // Default: 'claude-sonnet-4-6'
  site_theme?: 'light'|'dark'  // Default: 'light'
  style_preset?: 'modern'|'classic'   // Default: 'modern'
  tone?: 'friendly'|'formal'          // Default: 'friendly'
  density?: 'full'|'minimal'          // Default: 'full'
  language?: 'es'|'en'|'de'|'fr'     // Default: 'es'
  variants?: boolean                   // Default: false — generates A+B in parallel
  vertical_hint?: string       // Fallback vertical when no Google data
}
```

**Response:** `{ job_id: string }` — poll `/api/generate/[jobId]` for status.

**Job status shape:**
```ts
{
  status: 'pending' | 'done' | 'error'
  // on done:
  clientId: string
  slug: string
  demoUrl: string
  businessName: string
  vertical: string
  // if variants=true, also:
  altSlug: string
  altDemoUrl: string
  // on error:
  error: string
}
```

---

## Backend Pipeline

Both generators go through the same pipeline in `src/lib/ai/generator.ts`:

```
1. Google Places lookup (getPlaceById or getPlaceFromUrl)
2. vertical detection (detectVertical) — or use verticalHint fallback
3. Pass 1 — Haiku enrichment (enrichBusinessData): extracts tagline, USPs, services from reviews
4. Pass 2 — Main model generates full HTML (buildHtmlGenerationPrompt)
5. Post-processing (7 steps):
   a. IntersectionObserver fade-in script injection
   b. Google Fonts preconnect
   c. Mobile hamburger menu
   d. Today's hours highlight script
   e. JSON-LD LocalBusiness schema
   f. WhatsApp floating button
   g. GDPR cookie banner
6. Save to Supabase (createClient + saveSiteContent)
7. jobStore.update({ status: 'done', ... })
```

The `language` parameter controls `buildHtmlGenerationPrompt` → adds a `LANGUAGE:` directive override. All copy (CTAs, navigation, legal, headings) is generated in the target language.

---

## Known Bugs / Gaps to Fix

### 🔴 Critical

| Bug | File | Fix |
|---|---|---|
| Landing sends `email` but not `contact_email` — generated site has no contact email | `src/app/page.tsx` L149 | Add `contact_email: email.trim() \|\| undefined` to the fetch body |
| Landing Haiku model ID is `claude-haiku-4-5` — not in `VALID_MODELS` — silently falls back to Sonnet | `src/app/page.tsx` L42 | Change to `claude-haiku-4-5-20251001` |

### 🟡 Intentional gaps (landing is simplified by design)

| Missing from landing | Rationale |
|---|---|
| Language selector | Landing is Spanish-only for now. Add when public multi-language is launched. |
| Vertical hint | Landing relies on Google data. Add as optional if no URL is present. |
| Phone field | Landing is meant to be filled by the business owner from their phone — they know their number. Add if needed. |
| Example presets | Too noisy for a public landing. Keep in admin only. |
| Context history | Not needed for occasional public use. Keep in admin only. |
| Palette chips | Visual noise for public. Keep in admin only. |
| Iframe preview | Public users see the demo on a separate URL — intentional clean break. |

---

## Design Rules

### Landing generator — keep it simple
- Maximum **3 required fields visible** above the fold
- Everything else behind "Opciones avanzadas"
- Focus on one primary CTA: "Generar mi web gratis →"
- No jargon (no "vertical", no "density")

### Admin generator — expose everything
- Power user: operator who generates sites all day
- Show costs per model
- Expose all 7 params + advanced options
- Add helpers that save time: presets, history, palette preview
- Full-screen iframe preview before saving

---

## File Map

```
src/app/page.tsx                          ← Landing public generator
src/app/admin/clients/new/page.tsx        ← Admin internal generator
src/app/api/generate/route.ts             ← Shared API endpoint (POST + job polling)
src/app/api/generate/[jobId]/route.ts     ← Job status polling
src/lib/ai/generator.ts                   ← Core: enrichment, generation, post-processing
src/lib/ai/prompts.ts                     ← Prompt builders (buildHtmlGenerationPrompt)
src/lib/google-places.ts                  ← Google Places API helpers
src/lib/jobStore.ts                       ← In-memory job state (lost on restart)
```

---

## GBP Audit Tool (landing page)

Auto-triggered when the user pastes a Google Business URL. Runs in background while they fill the rest of the form.

**Flow:** URL typed → 900ms debounce → `POST /api/audit` → card appears below URL field  
**Cost:** ~$0.018 (Places API) + ~$0.001 (Haiku) = **≈$0.02 per audit**

**8 checkpoints scored:**

| Check | Points | Pass condition |
|---|---|---|
| Descripción editorial | 20 | `editorial_summary` present |
| Reseñas y valoración | 20 | ≥20 reviews AND ≥4.0 rating |
| Fotos | 15 | ≥10 photos |
| Horario | 15 | All 7 days configured |
| Teléfono | 10 | `formatted_phone_number` present |
| Web propia | 10 | `website` present |
| Rango de precios | 5 | `price_level` set |
| Categorías | 5 | ≥2 non-generic types |

**Score thresholds:** 75+ = optimized (green), 50-74 = needs work (amber), <50 = incomplete (red)

**AI recommendations:** Haiku generates 3 personalized tips based on failing checks. Fallback to hardcoded tips if JSON parsing fails.

**Email capture (soft, no gate):** Optional field "Envíame el informe" at bottom of audit card. On submit: sends Resend email with full HTML report AND upserts lead into Supabase `leads` table.

**Files:**
```
src/app/api/audit/route.ts          ← audit engine + scoring + Haiku recs
src/app/api/audit/send/route.ts     ← email the report (Resend) + save lead
```

---

## Planned Features (not yet built)

| Feature | Target | Notes |
|---|---|---|
| Language selector on landing | Landing | Gate to Premium plan |
| Multi-language sites (EN+ES toggle) | Both | Premium only — sibling slugs pattern |
| Logo upload | Admin | Needs image hosting + prompt injection |
| Custom domain (subdomain) | Admin | Phase 2 |
| Job store persistence (Supabase) | Both | Currently in-memory — lost on server restart |
| Stripe payment flow | Landing | Phase 2 — gates Basic plan |
