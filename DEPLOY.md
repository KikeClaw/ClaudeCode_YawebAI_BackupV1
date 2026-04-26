# Deploy Guide — yaweb.ai

## Paso 1 — Supabase (base de datos)

1. Crea cuenta en https://supabase.com
2. New project → elige nombre y región (eu-west para España)
3. Settings → API → copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_KEY`
4. SQL Editor → New query → pega el contenido de `supabase/schema.sql` → Run

## Paso 2 — Anthropic (Claude AI)

1. Ve a https://console.anthropic.com
2. API Keys → Create Key
3. Copia la key → `ANTHROPIC_API_KEY`

## Paso 3 — Google Places API

1. Ve a https://console.cloud.google.com
2. Crea un proyecto nuevo (ej: "yaweb")
3. APIs & Services → Enable APIs → activa:
   - **Places API (New)**
   - **Maps JavaScript API**
4. Credentials → Create Credentials → API Key
5. Copia la key → `GOOGLE_PLACES_API_KEY`
6. ⚠️ Recomendado: restringe la key a solo esas dos APIs

## Paso 4 — Resend (email)

1. Ve a https://resend.com → Create account
2. Domains → Add Domain → añade `yaweb.ai`
3. Sigue los pasos DNS (añade los registros en Cloudflare)
4. API Keys → Create API Key → copia → `RESEND_API_KEY`

## Paso 5 — GitHub (backups)

1. Crea organización en GitHub: `yaweb-ai`
2. Settings → Developer Settings → Personal Access Tokens → Fine-grained token
3. Permisos: `Repository: Contents (read/write)`, `Administration (read/write)`
4. Copia el token → `GITHUB_TOKEN`

## Paso 6 — Vercel (deploy)

1. Sube el repo a GitHub: `github.com/tuusuario/yaweb`
2. Ve a https://vercel.com → New Project → importa el repo
3. Settings → Environment Variables → añade todas las vars del .env.example
4. Deploy

## Paso 7 — Cloudflare DNS

1. Añade el dominio `yaweb.ai` en Cloudflare
2. Configura nameservers en tu registrador
3. En Vercel → Settings → Domains → añade `yaweb.ai` y `*.yaweb.ai`
4. En Cloudflare añade los registros que pide Vercel:
   ```
   CNAME  @          cname.vercel-dns.com  (Proxy OFF)
   CNAME  *          cname.vercel-dns.com  (Proxy OFF)
   ```
5. ⚠️ El wildcard `*.yaweb.ai` debe tener **Proxy desactivado** (nube gris en Cloudflare)

## Paso 8 — Test final

1. Abre https://yaweb.ai/admin/setup
2. Verifica que todos los checks están en verde ✅
3. Ve a /admin/clients/new y genera tu primera web
4. Comprueba que la demo aparece en https://demo.yaweb.ai/tu-slug

## Variables de entorno completas

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_PLACES_API_KEY=AIza...

RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hola@yaweb.ai
RESEND_FROM_NAME=yaweb.ai

GITHUB_TOKEN=ghp_...
GITHUB_ORG=yaweb-ai

NEXT_PUBLIC_APP_URL=https://yaweb.ai
NEXT_PUBLIC_APP_DOMAIN=yaweb.ai
ADMIN_PASSWORD=elige-password-segura
```
