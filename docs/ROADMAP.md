# yaweb.ai — Roadmap

Status legend: ✅ Done · 🔄 In progress · 🟡 Backlog · 💎 Premium · ❌ Won't do

---

## Core platform

| Feature | Status | Notes |
|---|---|---|
| AI HTML generation (Claude/GPT/Gemini) | ✅ | 6 models supported |
| 2-pass enrichment (Haiku → main model) | ✅ | Always runs, improves copy quality |
| Post-processing pipeline (7 steps) | ✅ | Observer, preconnect, hamburger, hours, JSON-LD, WA float, GDPR |
| Job queue (async, poll-based) | ✅ | In-memory — lost on restart (see persistence below) |
| Google Places integration | ✅ | URL + Place ID lookup |
| Vertical detection (12 types) | ✅ | Auto from Places types |
| WhatsApp floating button | ✅ | Auto-injected in post-processing |
| GDPR cookie banner | ✅ | Auto-injected |
| Local Business JSON-LD schema | ✅ | Auto-injected from Places data |
| Multi-language output (ES/EN/DE/FR) | ✅ | Prompt override per language |
| A/B style variants | ✅ | Parallel generation |
| **Dual-theme toggle (light/dark)** | ✅ | Single generation, CSS vars, sun/moon button auto-injected |

---

## Admin dashboard

| Feature | Status | Notes |
|---|---|---|
| Client list + demo preview | ✅ | |
| Inline HTML editor | ✅ | |
| Section regeneration | ✅ | Per-section with depth-counter extraction |
| Color editor (CSS var override) | ✅ | Smart var detection from :root |
| Version history (restore) | ✅ | |
| Lead management + pipeline | ✅ | 5 stages |
| Bulk prospecting (Places search) | ✅ | |
| WhatsApp outreach module | ✅ | Haiku-generated messages, wa.me links |
| Email campaigns (Resend) | ✅ | AI personalisation per lead |
| **Selectable palette chips** | ✅ | Admin form — 2 curated palettes per vertical, overrides AI color choice |
| **Language selector (ES/EN/DE/FR)** | ✅ | Admin form |
| **Vertical hint selector** | ✅ | 12 categories, fallback when no Google URL |
| **Quick-fill example presets** | ✅ | 5 verticals |
| **Context history (localStorage)** | ✅ | Save/load up to 10 contexts |
| Historial mejorado (params + regen button) | 🟡 | Show generation params per site; "Regen with these params" button |

---

## Landing page

| Feature | Status | Notes |
|---|---|---|
| Public generator form | ✅ | |
| Auto-preview email on done | ✅ | Resend |
| **GBP Audit tool (auto-triggered)** | ✅ | 8 checks, 0-100 score, Haiku recs, email capture → Supabase lead |
| Language selector | 💎 | Basic = ES only; Multi-language = Premium |
| Vertical hint on landing | 🟡 | Low priority — landing relies on Google URL |

---

## Pending / Backlog

### 🟡 Near-term

| Item | Effort | Notes |
|---|---|---|
| Job store persistence (Supabase) | M | Currently in-memory — jobs lost on server restart. Use Supabase `jobs` table |
| Historial: show generation params per site | S | Store params JSON in `site_content.metadata` at generation time |
| Historial: "Regenerar con estos params" button | S | Pre-fills admin form from stored params |
| Stripe payment flow | L | Gates Basic (99€/año) plan on landing. Phase 2 |
| Parameter preview (static mockups) | M | Show sample section screenshots per style/tone combo. Needs real generation examples first |

### 💎 Premium plan features

| Item | Notes |
|---|---|
| Multi-language sites (EN+ES toggle widget) | 2 sibling slugs generated, toggle widget injected. Basic = 1 lang, Premium = multi |
| Custom domain / subdomain | DNS + Vercel/Nginx config per client |
| Dark/light theme toggle visible to site visitors | Currently toggle is generated, but gating visitor-visible toggle behind Premium makes sense |
| Clone web (use existing as style base) | Extract CSS vars from existing HTML, inject as palette constraint. Premium only |
| Portal de cliente (login) | Client self-service dashboard |
| Carta/menú dinámica editable | CMS-like menu editor |
| Múltiples páginas (/servicios, /equipo…) | Multi-page site generation |
| Analítica de visitas | Simple pixel or Plausible embed |
| Logo upload | Image hosting + prompt injection. Formatting risk on auto-fit |
| Follow-up automático de leads | Scheduled email sequences via Resend |

### ❌ Won't do (basic plan)

| Item | Reason |
|---|---|
| Vista previa en tiempo real mientras escribes | Too expensive — API call per keystroke |
| Booking / reservation system | Out of scope — contact-only is the model |
| Full color picker (free hex input) | Users pick bad combos — curated palettes only |

---

## Architecture decisions

| Decision | Rationale |
|---|---|
| Single HTML file per site | Simplest deploy, no CMS dependency, fully portable |
| CSS custom properties for theming | Enables dual-theme with zero extra generation cost |
| In-memory job store | Simple for MVP; migrate to Supabase when multi-instance needed |
| Haiku for enrichment + secondary tasks | 20x cheaper than Sonnet for structured extraction |
| No booking CTAs in generated sites | Keeps product scope clean; avoids calendar integration complexity |
| Basic = 1 language, Premium = multi | Keeps Basic simple; multi-lang is a real differentiator worth paying for |
