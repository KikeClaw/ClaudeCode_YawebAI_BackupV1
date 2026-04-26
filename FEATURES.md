# yaweb.ai — Features & Roadmap

> Última actualización: 2026-04-20
> Estado: Fase 1 — desarrollo local

---

## ✅ Implementado

### Plataforma / Infraestructura
- [x] Next.js 16 + TypeScript + Tailwind CSS
- [x] Supabase (PostgreSQL) para almacenamiento de clientes, leads, campañas y site_content
- [x] Autenticación admin con cookie HMAC-SHA256 (`admin_auth`)
- [x] Middleware (`proxy.ts`) protege rutas `/admin/*` y APIs admin con auth guard
- [x] Rate limiting en `/api/generate` (10 req/hora por IP)
- [x] `sameSite: strict` en cookie de sesión
- [x] Variables de entorno: Anthropic, OpenAI, Gemini, Google Places, Resend, Supabase
- [x] Soporte multi-modelo: Claude Opus 4.7, Sonnet 4.6, Haiku 4.5, GPT-4o, Gemini 2.0 Flash, Gemini 2.5 Pro

### Generador de Webs (core)
- [x] Generación HTML completa en una llamada (single-file site)
- [x] Integración Google Places API: nombre, fotos, horarios, reseñas, dirección, coordenadas
- [x] Detección automática de vertical (restaurant, bar, salon, clinic, gym, lawyer, hotel, pharmacy, academy, shop, workshop, generic)
- [x] Prompts específicos por vertical con dirección de diseño única
- [x] Modo compacto (≤8000 tokens) para Sonnet/Haiku vs modo completo (16000) para Opus/GPT-4o/Gemini
- [x] Two-pass enrichment: Haiku extrae tagline, servicios, USPs y highlights antes de generar el HTML
- [x] 2 variantes de estilo en paralelo (Variante A: diseño vertical, Variante B: minimalista/geométrico)
- [x] Tema claro / oscuro configurable
- [x] WhatsApp normalizado (añade prefijo +34 para números españoles de 9 dígitos)
- [x] Reseñas filtradas (solo 4-5 estrellas) con `smartTruncate` a límite de frase
- [x] Galería de fotos reales de Google Places (grid CSS)
- [x] Formulario de contacto funcional (`/api/contact`) — envía email vía Resend
- [x] **Carta / Menú para restaurantes y bares** — campo de texto en el formulario; si se aportan datos reales, la IA los renderiza integrados en el diseño; si no hay datos, la sección se omite (nunca se inventa)
- [x] Secciones adaptativas: `hasHours`, `hasReviews`, `hasGallery`, `hasMenu` — nav dinámico y skip explícito cuando no hay datos suficientes

### Post-procesado del HTML generado (pipeline de 7 pasos)
- [x] **Paso 1** — Inyección de IntersectionObserver si el AI usó `.fade` sin el script
- [x] **Paso 2** — Preconnect de Google Fonts para carga más rápida
- [x] **Paso 3** — Hamburger menu de fallback si nav oculta links en mobile sin toggle
- [x] **Paso 4** — Script que resalta el horario del día actual en español
- [x] **Paso 5** — JSON-LD `LocalBusiness` (schema.org) inyectado desde datos de Google Places
- [x] **Paso 6** — Botón WhatsApp flotante (fixed, verde #25D366) si no lo generó el AI
- [x] **Paso 7** — Banner GDPR/cookies con localStorage si no lo generó el AI

### Responsive (3 breakpoints obligatorios)
- [x] Mobile (<768px): single column, hamburger, clamp typography, touch targets 44px
- [x] Tablet (768–1199px): 2-column grids, nav visible
- [x] Desktop (≥1200px): full layout, max-width 1240px centrado

### Admin Dashboard
- [x] Diseño flat: Outfit font, Blue 600 primary, sin sombras, sin gradientes
- [x] Sidebar con iconos Lucide, navegación activa con estado visual
- [x] Login con contraseña + cookie HMAC
- [x] **Clients list** con:
  - [x] Búsqueda en tiempo real (nombre, slug, email)
  - [x] Filtro por estado (demo/active/inactive/expired)
  - [x] Filtro por sector (vertical)
  - [x] Selección múltiple + eliminación en masa
  - [x] Número de versión (#N), timestamps relativos, status badges
  - [x] Enlace directo a detalle del cliente
- [x] **Client detail page** (`/admin/clients/[id]`):
  - [x] Preview iframe del demo
  - [x] Editor rápido (teléfono, WhatsApp, email, notas)
  - [x] Historial de versiones con opción de restaurar
- [x] Leads management
- [x] Campaigns management
- [x] Setup page
- [x] Settings page

### APIs
- [x] `POST /api/auth` — login con HMAC token
- [x] `DELETE /api/auth` — logout
- [x] `GET /api/health` — health check de todos los servicios (sin exponer claves)
- [x] `POST /api/generate` — generación asíncrona con job polling, soporte variantes
- [x] `GET /api/generate/[jobId]` — estado del job
- [x] `GET /api/clients` — lista clientes (protegida)
- [x] `POST /api/clients` — crear cliente (protegida)
- [x] `PATCH /api/clients/[id]` — actualizar campos del cliente (protegida)
- [x] `DELETE /api/clients/[id]` — eliminar cliente (protegida)
- [x] `POST /api/clients/[id]/restore-version` — restaurar versión anterior
- [x] `GET /api/leads` — lista leads (protegida)
- [x] `GET /api/campaigns` — lista campañas (protegida)
- [x] `POST /api/contact` — formulario de contacto de clientes (pública, envío vía Resend)
- [x] `GET /api/photo` — proxy de fotos Google Places (pública, API key nunca expuesta)
- [x] `GET /api/track` — pixel de tracking para emails
- [x] `POST /api/send-preview` — envío de email de preview al cliente (protegida)

### Seguridad
- [x] Cookie HMAC-SHA256 firmada (no más `'true'` como valor)
- [x] `sameSite: strict` en cookie de sesión admin
- [x] APIs admin protegidas en middleware (no solo páginas)
- [x] Rate limiting en generate (10/hora por IP)
- [x] `/api/debug` eliminado (exponía claves parciales)
- [x] `/api/health` sanitizado (sin prefijos de claves)
- [x] Proxy de fotos (API key nunca en HTML público)
- [x] Sanitización HTML en emails de contacto (XSS prevention)
- [x] Supabase `service_role` documentado + nota sobre RLS

### SEO y Performance (en webs generadas)
- [x] JSON-LD LocalBusiness inyectado determinísticamente
- [x] FAQPage schema.org (en modo full)
- [x] Open Graph + Twitter card tags
- [x] Google Fonts preconnect
- [x] `Cache-Control` en fotos proxiadas (86400s)
- [x] `loading="lazy"` en Google Maps iframe
- [x] `scroll-behavior: smooth`

### Outreach / Email
- [x] Generación de email de ventas personalizado por negocio (Haiku) — endpoint `/api/outreach-email`, botón en Prospectar
- [x] Envío de preview al cliente vía Resend
- [x] **Fallback fotos Unsplash** — si Google Places tiene <2 fotos, se usan fotos de stock curadas por vertical
- [x] Formulario de contacto funcional en webs generadas

### Landing Page
- [x] Hero con generador integrado (form + progress + resultado)
- [x] Secciones: marquee de sectores, features, how-it-works, pricing, CTA
- [x] Soporte para variantes A/B desde el formulario
- [x] Diseño flat premium

---

## 🔜 Pendiente (Fase 1 — local)

### Generador
- [x] **Regenerar sección** — regenera solo Hero / Nosotros / Servicios / Reseñas / Contacto con Haiku sin tocar el resto
- [x] **Editor de color principal** — picker en client detail, inyecta override CSS, sin llamada a IA
- [ ] **Soporte multipage** — index + páginas adicionales (/servicios, /contacto)

### Admin
- [ ] **Paginación** en listas de clientes/leads cuando crezca el volumen
- [ ] **Vista kanban** para leads por estado

### Outreach
- [ ] **Bulk lead generation** — buscar negocios sin web en una ciudad → generar demos → enviar emails en masa
- [ ] **Tracking real** — pixel de apertura en emails + evento al cargar demo → actualizar status del lead

---

## 🔮 Pendiente (Fase 2 — producción)

### Monetización
- [ ] **Stripe Checkout** — pago de 99€/año, activación automática al pagar
- [ ] **Client portal** — URL pública donde el cliente ve su demo y puede pagar

### Infraestructura
- [ ] **Subdomain activation** — configurar subdominios en Namecheap/Vercel automáticamente al activar
- [ ] **Static export** — exportar webs activas como HTML estático a CDN
- [ ] **Job store en Supabase** — el actual job store es in-memory (se pierde en reinicios)
- [ ] **Supabase RLS** — habilitar Row Level Security en todas las tablas

### Análitica
- [ ] **Dashboard de métricas** — webs generadas, demos visitadas, conversiones, ingresos
- [ ] **Analytics por demo** — visitas, tiempo en página, clics en WhatsApp/teléfono

### Automatización
- [ ] **Follow-up automático** — cron que envía recordatorio a leads sin respuesta después de N días
- [ ] **Webhooks Stripe** — activación automática tras pago exitoso

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| AI principal | Claude Sonnet 4.6 / Opus 4.7 / Haiku 4.5 |
| AI alternativa | GPT-4o, Gemini 2.0 Flash, Gemini 2.5 Pro |
| Email | Resend |
| Fotos | Google Places API (proxiado) |
| Font | Outfit (Google Fonts) |
| Icons | Lucide React |
| Repo | [KikeClaw/yaweb.ai](https://github.com/KikeClaw/yaweb.ai) |
