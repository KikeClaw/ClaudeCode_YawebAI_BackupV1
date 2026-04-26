# yaweb.ai — Integrations & Services Reference

> This document lists every external service the platform depends on, with configuration notes, dashboard URLs, and the environment variable names used in code.
> **⚠️ Never commit actual secret values here.** Store secrets in Railway variables (production) and `.env.local` (local dev).

---

## Deployment

### Railway
- **Purpose:** Hosting / PaaS for the Next.js app (production)
- **Dashboard:** https://railway.app/dashboard
- **Production URL:** `https://yawebai-production.up.railway.app`
- **Custom domain (future):** `https://yaweb.ai`
- **Region:** us-west1 (consider migrating to `europe-west4` for latency)
- **Variables to set in Railway:** all env vars listed in sections below
- **Notes:** Next.js runs via `next start`. Build command: `next build`. No Dockerfile needed.

---

## Database

### Supabase
- **Purpose:** PostgreSQL database (clients, leads, campaigns, admin_users, site_content)
- **Dashboard:** https://app.supabase.com
- **Project URL:** stored in `NEXT_PUBLIC_SUPABASE_URL`
- **Schema file:** `supabase/schema.sql`
- **Tables:** `clients`, `leads`, `campaigns`, `site_content`, `admin_users`

| Variable | Used for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public, safe to expose) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client-side read access (public, safe to expose) |
| `SUPABASE_SERVICE_KEY` | Server-side full access (secret, server-only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Alternative name used in some routes (same key) |

> **Note:** `SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` refer to the same key — the service role key from Supabase → Settings → API. Keep in sync.

---

## AI Providers

### Anthropic (Claude)
- **Purpose:** Primary AI for site generation, audit reports, outreach email writing, WhatsApp assistant
- **Dashboard:** https://console.anthropic.com
- **Models used:** `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-3-5` (configurable per generation)
- **SDK:** `@anthropic-ai/sdk ^0.90.0`
- **Cost tracking:** input/output tokens captured per generation, stored in `clients.input_tokens`, `clients.output_tokens`, `clients.cost_usd`

| Variable | Used for |
|---|---|
| `ANTHROPIC_API_KEY` | All Claude API calls |

---

### OpenAI (GPT-4o)
- **Purpose:** Alternative AI provider for site generation
- **Dashboard:** https://platform.openai.com
- **Models used:** `gpt-4o`, `gpt-4o-mini` (configurable)
- **SDK:** `openai ^6.34.0`

| Variable | Used for |
|---|---|
| `OPENAI_API_KEY` | GPT-4o generation calls |

---

### Google AI Studio (Gemini)
- **Purpose:** Alternative AI provider for site generation
- **Dashboard:** https://aistudio.google.com / https://console.cloud.google.com
- **Models used:** `gemini-2.5-flash`, `gemini-2.0-flash` (configurable)
- **SDK:** `@google/generative-ai ^0.24.1`
- **Notes:** Provider-specific prompt variant used (Gemini doesn't handle CSS placeholder variables well — concrete hex values injected instead)

| Variable | Used for |
|---|---|
| `GEMINI_API_KEY` | Gemini generation calls |

---

### Groq
- **Purpose:** Alternative AI provider for fast/cheap generation (Llama models)
- **Dashboard:** https://console.groq.com
- **Models used:** `llama-3.3-70b-versatile`, `llama-3.1-8b-instant` (configurable)
- **SDK:** OpenAI-compatible client (`openai` package, base URL overridden)
- **Notes:** Free tier limited to ~12k tokens/minute. Enrichment skipped and content capped for Groq to stay within limits.

| Variable | Used for |
|---|---|
| `GROQ_API_KEY` | Groq/Llama generation calls |

---

## Email

### Resend
- **Purpose:** Transactional email — demo previews to leads, client reminders, contact form, audit reports, outreach campaigns
- **Dashboard:** https://resend.com/overview
- **Sending domain:** `yaweb.ai` (must be verified in Resend → Domains)
- **SDK:** `resend ^6.12.0`

| Variable | Used for |
|---|---|
| `RESEND_API_KEY` | All outgoing email |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `hola@yaweb.ai`) |
| `RESEND_FROM_NAME` | Sender display name (e.g. `yaweb.ai`) |
| `ADMIN_EMAIL` | Where contact form submissions are delivered |

---

## External APIs

### Google Places API
- **Purpose:** Business data enrichment — fetches name, address, category, photos, reviews from Google Maps for lead/client generation
- **Dashboard:** https://console.cloud.google.com → APIs & Services
- **API enabled:** Places API (New)
- **Notes:** API key must have Places API (New) enabled. Restrict by IP or HTTP referrer in production.

| Variable | Used for |
|---|---|
| `GOOGLE_PLACES_API_KEY` | Google Places enrichment + photo proxy |

---

## Source Control

### GitHub
- **Purpose:** Code hosting + automated site backup (generated client sites pushed as repos)
- **Dashboard:** https://github.com/KikeClaw
- **Repository:** https://github.com/KikeClaw/yaweb.ai
- **Token type:** Personal Access Token (classic) with `repo` scope
- **Org for client repos:** configurable via `GITHUB_ORG` (default: `yaweb-ai`)

| Variable | Used for |
|---|---|
| `GITHUB_TOKEN` | Push generated site repos via GitHub API |
| `GITHUB_ORG` | GitHub org/user where client repos are created |

---

## App Configuration

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Full public URL (used in emails, sitemaps, links) |
| `NEXT_PUBLIC_APP_DOMAIN` | `yaweb.ai` | Root domain for subdomain detection in proxy |
| `ADMIN_PASSWORD` | — | Legacy single-password auth (kept for backward compat during migration to multi-user) |
| `JWT_SECRET` | — | Signs admin session JWTs (min 32 chars, random string) |

---

## Authentication System

The platform uses a **two-layer auth system**:

1. **JWT (current):** multi-user system — email + bcrypt password → signed JWT stored in `admin_auth` cookie. Payload: `{sub, role, name, email}`. 7-day expiry. Library: `jose ^6.2.2`.
2. **Legacy HMAC (fallback):** single `ADMIN_PASSWORD` hash, treated as `superadmin`. Still accepted by proxy during migration.

### Roles
| Role | Access |
|---|---|
| `superadmin` | Full access — all pages including Users, Settings, Setup |
| `comercial` | Restricted — can create/view sites, leads, campaigns. Blocked from Users/Settings/Setup |

### First-time setup
Bootstrap the first superadmin via:
```bash
curl -X POST https://yawebai-production.up.railway.app/api/users/seed \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@example.com","password":"yourpassword","admin_password":"YOUR_ADMIN_PASSWORD_ENV_VALUE"}'
```
Only works when `admin_users` table is empty.

---

## Domain / DNS

### Namecheap (or current registrar)
- **Domain:** `yaweb.ai`
- **DNS records needed (production):**
  - `A` / `CNAME` → Railway app
  - `MX` → Resend (for email sending domain verification)
  - `TXT` → Resend SPF/DKIM records
  - `CNAME` → Wildcard `*.yaweb.ai` → Railway (for future client subdomains)

---

## Tech Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | 16.2.4 |
| Language | TypeScript | ^5 |
| React | React | 19.2.4 |
| Styling | Tailwind CSS v4 | ^4 |
| UI base | Sneat Bootstrap (admin) + Base UI (public) | — |
| Database | Supabase (PostgreSQL) | ^2.103.3 |
| Auth | jose (JWT) + bcryptjs | ^6.2.2 / ^3.0.3 |
| Icons | Lucide React | ^1.8.0 |
| Toasts | Sonner | ^2.0.7 |
| Variants | class-variance-authority | ^0.7.1 |

---

## Environment Variables — Quick Reference

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # same value as SUPABASE_SERVICE_KEY

# AI Providers
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
GROQ_API_KEY=

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=hola@yaweb.ai
RESEND_FROM_NAME=yaweb.ai
ADMIN_EMAIL=hola@yaweb.ai

# Google
GOOGLE_PLACES_API_KEY=

# GitHub
GITHUB_TOKEN=
GITHUB_ORG=yaweb-ai

# App
NEXT_PUBLIC_APP_URL=https://yaweb.ai
NEXT_PUBLIC_APP_DOMAIN=yaweb.ai

# Auth
ADMIN_PASSWORD=                   # legacy fallback, keep set
JWT_SECRET=                       # min 32 random chars
```

---

*Last updated: 2026-04-22*
