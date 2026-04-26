export type Vertical = 'generic' | 'restaurant' | 'bar' | 'salon' | 'clinic' | 'academy' | 'shop' | 'workshop' | 'gym' | 'lawyer' | 'hotel' | 'pharmacy'
export type AdminRole = 'superadmin' | 'comercial'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  is_active: boolean
  created_at: string
  updated_at: string
  // stats (joined on demand)
  sites_count?: number
  sites_cost?: number
}
export type ClientStatus = 'demo' | 'active' | 'inactive' | 'expired'
export type LeadStatus = 'new' | 'demo_generating' | 'demo_ready' | 'email_sent' | 'demo_visited' | 'converted' | 'rejected'
export type PlanType = 'basic' | 'premium'

export interface Client {
  id: string
  name: string
  slug: string
  status: ClientStatus
  plan: PlanType
  vertical: Vertical
  google_business_url?: string
  google_place_id?: string
  email?: string
  phone?: string
  whatsapp?: string
  paid_at?: string
  activated_at?: string
  annual_amount: number
  notes?: string
  github_repo_url?: string
  custom_domain?: string
  is_portfolio?: boolean
  channel?: 'admin' | 'landing' | 'api'
  expires_at?: string
  is_internal?: boolean
  model?: string
  created_by?: string
  input_tokens?: number
  output_tokens?: number
  cost_usd?: number
  created_at: string
  updated_at: string
  site_content?: SiteContent
}

export interface HtmlContent {
  _type: 'html'
  html: string
}

export interface SiteContent {
  id: string
  client_id: string
  version: number
  content: SiteData | HtmlContent
  template_id: string
  is_active: boolean
  created_at: string
}

export interface SiteData {
  meta: {
    title: string
    description: string
    keywords: string[]
    lang: string
  }
  hero: {
    headline: string
    subheadline: string
    cta_text?: string
    cta_phone?: string
    background_image?: string
  }
  about?: {
    enabled: boolean
    title: string
    text: string
    image?: string
  }
  services?: {
    enabled: boolean
    title: string
    items: Array<{ name: string; description?: string; price?: string; image?: string }>
  }
  menu?: {
    enabled: boolean
    title: string
    categories: Array<{
      name: string
      items: Array<{ name: string; description?: string; price?: string; allergens?: string[] }>
    }>
  }
  hours?: {
    enabled: boolean
    title: string
    schedule: Array<{ day: string; open: string; close: string; closed?: boolean }>
    note?: string
  }
  location?: {
    enabled: boolean
    title: string
    address: string
    city: string
    maps_url?: string
    embed_url?: string
    lat?: number
    lng?: number
  }
  gallery?: {
    enabled: boolean
    title: string
    images: Array<{ url: string; alt?: string }>
  }
  reviews?: {
    enabled: boolean
    title: string
    rating: number
    total: number
    items: Array<{ author: string; text: string; rating: number; date?: string }>
  }
  contact?: {
    enabled: boolean
    title: string
    phone?: string
    email?: string
    whatsapp?: string
    form_enabled: boolean
  }
  social?: {
    enabled: boolean
    instagram?: string
    facebook?: string
    tiktok?: string
    twitter?: string
    youtube?: string
    tripadvisor?: string
  }
  theme: {
    primary: string
    secondary: string
    font: string
    style: 'modern' | 'classic' | 'minimal' | 'bold'
  }
  vertical: Vertical
  business_name: string
}

export interface Lead {
  id: string
  business_name: string
  google_business_url?: string
  google_place_id?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  vertical: Vertical
  has_website: boolean
  existing_website?: string
  demo_slug?: string
  demo_generated_at?: string
  status: LeadStatus
  email_sent_at?: string
  email_opened_at?: string
  demo_visited_at?: string
  converted_at?: string
  campaign_id?: string
  notes?: string
  created_at: string
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body_html: string
  body_text?: string
  leads_count: number
  sent_count: number
  opened_count: number
  visited_count: number
  converted_count: number
  sent_at?: string
  created_at: string
}

export interface GooglePlaceData {
  // ── Core identity ──────────────────────────────────────────────────────────
  place_id: string
  name: string
  formatted_address: string
  formatted_phone_number?: string
  international_phone_number?: string
  website?: string

  // ── Classification ────────────────────────────────────────────────────────
  types?: string[]
  primary_type?: string               // e.g. "cafe", "restaurant"
  primary_type_display_name?: string  // e.g. "Cafetería"
  business_status?: string            // OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY
  google_maps_uri?: string            // Direct Google Maps URL
  time_zone?: string                  // IANA timezone e.g. "Europe/Madrid"
  // ── Quality signals & descriptions ────────────────────────────────────────
  rating?: number
  user_ratings_total?: number
  price_level?: number          // 0-4
  price_range?: string          // e.g. "10–30 €" (richer than price_level)
  editorial_summary?: { overview: string }  // Curated editorial text
  generative_summary?: string               // Google AI-generated description 🔥
  review_summary?: string                   // AI-aggregated review insights 🔥
  neighborhood_summary?: string             // Area/neighbourhood description

  // ── Hours & schedule ──────────────────────────────────────────────────────
  opening_hours?: {
    weekday_text: string[]
    periods: Array<{ open: { day: number; time: string }; close?: { day: number; time: string } }>
  }
  secondary_opening_hours?: Array<{
    type: string              // e.g. "DELIVERY", "TAKEOUT", "HAPPY_HOUR", "DRIVE_THROUGH"
    weekday_text: string[]
  }>

  // ── Media ─────────────────────────────────────────────────────────────────
  // photo_reference: v2 resource name "places/.../photos/..." | v1 raw string
  photos?: Array<{ photo_reference: string }>
  reviews?: Array<{ author_name: string; rating: number; text: string; relative_time_description: string }>

  // ── Location ─────────────────────────────────────────────────────────────
  geometry?: { location: { lat: number; lng: number } }

  // ── Service options ───────────────────────────────────────────────────────
  dine_in?: boolean             // Comer allí
  takeout?: boolean             // Para llevar
  delivery?: boolean            // A domicilio
  curbside_pickup?: boolean     // Recogida en la puerta
  outdoor_seating?: boolean     // Terraza
  reservable?: boolean          // Acepta reservas
  live_music?: boolean          // Música en directo

  // ── What's served ─────────────────────────────────────────────────────────
  serves_breakfast?: boolean
  serves_brunch?: boolean
  serves_lunch?: boolean
  serves_dinner?: boolean
  serves_beer?: boolean
  serves_wine?: boolean
  serves_cocktails?: boolean
  serves_coffee?: boolean
  serves_dessert?: boolean
  serves_vegetarian_food?: boolean

  // ── Amenities ─────────────────────────────────────────────────────────────
  good_for_children?: boolean   // Adecuado para niños
  menu_for_children?: boolean   // Menú infantil
  good_for_groups?: boolean     // Para grupos
  good_for_watching_sports?: boolean
  allows_dogs?: boolean         // Se admiten perros
  restroom?: boolean            // Aseos disponibles

  // ── Accessibility ─────────────────────────────────────────────────────────
  wheelchair_accessible_entrance?: boolean
  wheelchair_accessible_seating?: boolean
  wheelchair_accessible_restroom?: boolean
  wheelchair_accessible_parking?: boolean

  // ── Payment options ───────────────────────────────────────────────────────
  accepts_credit_cards?: boolean
  accepts_debit_cards?: boolean
  accepts_cash_only?: boolean
  accepts_nfc?: boolean         // Pagos con móvil / NFC

  // ── Parking ───────────────────────────────────────────────────────────────
  free_parking_lot?: boolean
  free_street_parking?: boolean
  paid_parking_lot?: boolean
  valet_parking?: boolean
  free_garage_parking?: boolean
  paid_garage_parking?: boolean
}
