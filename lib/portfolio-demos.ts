import type { StylePresetKey } from './style-presets'

export interface PortfolioDemoConfig {
  id: string
  name: string
  tagline: string           // Short line for the portfolio card
  location: string
  context: string           // Rich brief passed as extra_context to /api/generate
  vertical: string
  model: 'claude-opus-4-7' | 'claude-sonnet-4-6' | 'claude-haiku-4-5-20251001' | 'gpt-4o' | 'gemini-2.5-flash' | 'gemini-2.0-flash'
  siteTheme: 'light' | 'dark'
  stylePreset: StylePresetKey
  tone: 'friendly' | 'formal'
  density: 'full' | 'minimal'
  language: 'es' | 'en' | 'de' | 'fr'
  palette?: string[]        // [accent, surface, text, background] — only set for custom-brand demos
  menuText?: string
  whatsapp?: string
  social?: { instagram?: string; facebook?: string; tiktok?: string }
  valueProp?: string        // Diferenciador clave — injected into prompt for stronger positioning
  ctaType?: 'phone' | 'whatsapp' | 'email' | 'quote'
  bookingUrl?: string
}

// NOTE: palette is intentionally omitted on most demos so the DNA system
// picks random accent colours, giving each generated site its own look.
// Only select demos keep an explicit palette as "custom branding" showcase examples.

export const PORTFOLIO_DEMOS: PortfolioDemoConfig[] = [

  // ─── Claude Opus 4.7 demos — maximum quality showcase ─────────────────────
  // Covers all 11 non-auto style presets to demonstrate the full design range.

  {
    id: 'taberna-puerto',
    name: 'La Taberna del Puerto',
    tagline: 'Cocina malagueña con vistas al mar',
    location: 'Málaga',
    context: `La Taberna del Puerto — Restaurante de cocina andaluza tradicional en el Muelle Uno de Málaga, con vistas directas al puerto y la catedral.
Fundada en 1987 por la familia Ruiz. Segunda generación al frente, con el chef Manuel Ruiz formado en el Basque Culinary Center.
Especialidades: espetos de sardinas en leña, fritura malagueña, gazpacho de la abuela, ajoblanco con uvas, y el famoso porrón de langostinos al ajillo.
Menú del día 16€ (L-V). Carta media 35-45€/persona. Bodega con 60 referencias de vinos de Málaga y Ronda.
Capacidad: 80 comensales en sala + 40 en terraza con vistas al mar. Privado para eventos desde 20 personas.
Reseñas: 4.7★ (847 reseñas Google). Premio Guía Michelin Bib Gourmand 2023.
Tel: +34 952 220 100. WhatsApp reservas: +34 952 220 100.`,
    vertical: 'restaurant',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'mediterraneo',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    palette: ['#8b4513', '#fdf3e7', '#2c1810', '#fffbf5'],
    menuText: `Entrantes
- Espetos de sardinas (ración 6 uds) 9€
- Fritura malagueña (gambas, calamar, boquerones) 14€
- Ajoblanco con uvas de Málaga y jamón 8€
- Gazpacho de la abuela con daditos de melón 7€

Principales
- Dorada a la sal (según mercado) 22€
- Porrón de langostinos al ajillo 18€
- Chuletón de buey con sal Maldon 38€
- Arroz caldoso de bogavante (para 2) 52€

Postres
- Tarta de queso de Ronda con miel 6€
- Torrija caramelizada con helado de vainilla 5€`,
    whatsapp: '+34952220100',
    valueProp: 'Bib Gourmand Michelin 2023 · Terraza con vistas al puerto · Cocina andaluza de raíz desde 1987',
    ctaType: 'whatsapp',
  },

  {
    id: 'garriga-abogados',
    name: 'Garriga & Asociados',
    tagline: 'Bufete de abogados en Barcelona desde 1998',
    location: 'Barcelona',
    context: `Garriga & Asociados — Despacho de abogados con sede en el Passeig de Gràcia de Barcelona, fundado en 1998 por el abogado Joan Garriga Pla.
Especialización: derecho mercantil y societario, fusiones y adquisiciones, derecho laboral para empresas, litigación civil y comercial, propiedad intelectual y patentes.
Equipo de 8 abogados titulados, todos colegiados en el Illustre Col·legi de l'Advocacia de Barcelona. Tres socios con más de 20 años de experiencia.
Clientes: principalmente pymes catalanas e inversores extranjeros estableciéndose en España.
Primera consulta: 1 hora gratuita sin compromiso. Honorarios claros y por escrito.
Idiomas: castellano, catalán, inglés, francés.
Tel: +34 932 180 500. Email: info@garriga-abogados.es`,
    vertical: 'lawyer',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'clasico',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Primera consulta de 1h gratuita · 25 años en Passeig de Gràcia · Equipo multilingüe ES/CA/EN/FR',
    ctaType: 'email',
  },

  {
    id: 'villa-mar-hotel',
    name: 'Villa Mar Boutique Hotel',
    tagline: 'Luxury boutique hotel on the Costa del Sol',
    location: 'Marbella',
    context: `Villa Mar Boutique Hotel — 5-star boutique hotel on the Golden Mile in Marbella, 50 metres from the beach.
Family-owned since 2008 by the Castellano family. Completely renovated in 2022 with award-winning interior design by Lázaro Rosa-Violán.
20 individually designed rooms and suites. All with sea views, private terrace or balcony, marble bathrooms and Hermès toiletries.
Amenities: rooftop infinity pool, spa with hammam and treatments, gourmet restaurant (Michelin-recommended), curated wine cellar, concierge service 24h, private beach area.
Chef: Juan Carlos Morales — formerly of Nobu Marbella and Dani García restaurants.
Rates from €380/night (room) to €950/night (penthouse suite). Minimum 2 nights June–Sept.
Pets welcome (up to 10kg). Valet parking included.
Booking: +34 952 870 300 / reservas@villamarhotel.es`,
    vertical: 'hotel',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'lujo',
    tone: 'formal',
    density: 'full',
    language: 'en',
    palette: ['#c9a84c', '#1a1508', '#f8f4ec', '#fffdf7'],
    whatsapp: '+34952870300',
    valueProp: 'Award-winning interior design by Lázaro Rosa-Violán · Chef ex-Nobu Marbella · 50m from the beach on the Golden Mile',
    ctaType: 'phone',
  },

  {
    id: 'arco-arquitectos',
    name: 'Arco Estudio',
    tagline: 'Arquitectura y diseño de interiores en Madrid',
    location: 'Madrid',
    context: `Arco Estudio — Estudio de arquitectura y diseño de interiores en Lavapiés, Madrid. Fundado en 2015.
Socias fundadoras: Marta Iglesias (arquitecta por la ETSAM) y Lucía Fonseca (diseñadora de interiores formada en el Istituto Marangoni Milán).
Proyectos: reformas integrales de viviendas (20-500m²), locales comerciales y restaurantes, diseño de muebles a medida, interiorismo de oficinas y espacios de co-working.
Filosofía: arquitectura sostenible, materiales naturales y locales, bienestar y luz natural como elementos centrales del diseño.
Portfolio: más de 85 proyectos completados en Madrid, Barcelona y Lisboa.
Presupuesto inicial gratuito. Honorarios: % sobre obra o tarifa plana según proyecto.
4.9★ (67 reseñas). Finalistas Premios Dezeen 2023 en categoría Residential.
Tel: +34 910 045 678`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'minimal',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Finalistas Premios Dezeen 2023 · Presupuesto inicial gratuito · Arquitectura sostenible con materiales naturales',
    ctaType: 'email',
  },

  {
    id: 'bizpulse',
    name: 'BizPulse Consulting',
    tagline: 'Strategic consulting for SMEs expanding in Spain',
    location: 'Madrid',
    context: `BizPulse Consulting — Boutique management consulting firm based in Madrid, specialising in strategy, operations and digital transformation for SMEs (€5M–€50M revenue).
Founded in 2018 by former McKinsey consultant Diego Martínez and digital strategist Valentina Cruz.
Services: market entry strategy for international companies entering Spain and LATAM, operational efficiency audits, digital transformation roadmaps, fundraising preparation (Series A/B), board advisory.
Team of 8 senior consultants — average 12 years in industry. Former clients include Santander Innoventures, Acciona, Fluidra.
Engagement model: fixed-fee projects (3–12 weeks), fractional CMO/COO services, retainer advisory.
Languages: Spanish, English, Portuguese, French.
Response within 24h. Confidential first call (30 min) at no charge.
Contact: hello@bizpulse.es / +34 910 556 780`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'clasico',
    tone: 'formal',
    density: 'full',
    language: 'en',
    valueProp: 'Former McKinsey & Glovo leadership · Confidential first call free · Fixed-fee engagements, no hidden costs',
    ctaType: 'email',
  },

  // New Opus demos — one per missing style preset ────────────────────────────

  {
    id: 'heladeria-cupula',
    name: 'Heladería Cúpula',
    tagline: 'Helados artesanales italianos frente al Postiguet',
    location: 'Alicante',
    context: `Heladería Cúpula — Heladería artesanal italiana en el Paseo Marítimo de Alicante, frente a la playa del Postiguet.
Abierta en 2017 por la heladera Martina Romano, napolitana, tercera generación de heladeros desde 1952.
Elaboración diaria con fruta local de temporada, leche fresca de ganadería Villena, sin colorantes, sin conservantes, sin aromas artificiales.
38 sabores de temporada rotativos + 8 clásicos permanentes.
Especialidades: stracciatella di bufala, pistacho de Bronte DOP, sandía de la Vega Baja, algarroba valenciana, limón de la Costa Blanca, tiramisú.
Cono artesano desde 2,50€. Tarrina desde 3,50€.
También: tartas heladas por encargo para eventos y bodas, catering de helados, cursos de elaboración artesanal (sábados 10:00, 25€/persona, plazas muy limitadas).
Punto de referencia Instagram de la ciudad — más de 200 reseñas con fotos cada mes.
Temporada: abierto todo el año (horario reducido en invierno).
4.9★ (1.203 reseñas). Tel: +34 965 140 330. WhatsApp: +34 651 230 445`,
    vertical: 'restaurant',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'festivo',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    whatsapp: '+34651230445',
    valueProp: 'Recetas familiares napolitanas desde 1952 · Sin colorantes ni conservantes · Sabores de temporada con fruta local',
    ctaType: 'whatsapp',
  },

  {
    id: 'nomade-studio',
    name: 'Nômade Studio',
    tagline: 'Fotografía comercial y dirección de arte en el Born',
    location: 'Barcelona',
    context: `Nômade Studio — Estudio de fotografía comercial y dirección de arte en el barrio del Born, Barcelona. Fundado en 2017.
Co-fundadores: Ana Soto (especialista en lifestyle y moda, ex-TBWA, clientes habituales Mango y Zara Home) y Marc Puig (especialista en gastronomía y arquitectura de interiores, colaborador de Time Out y varios restaurantes con estrella Michelin).
Servicios: fotografía de producto para e-commerce y catálogos, lookbooks de moda (SS/AW), fotografía gastronómica para restaurantes y libros de cocina, dirección de arte para campañas digitales, producción de vídeo y reels para redes sociales.
Estudio propio de 200m²: ciclorama blanco 6x4m, 3 sets configurables con diferentes acabados, cocina completamente equipada para fotografía culinaria, zona de atrezzo y styling, sala de edición.
Clientes actuales: ManoMano España, Estrella Damm, Nespresso, Andilana (marca de Inditex), Chef Diego Guerrero (DSTAgE**).
Presupuesto en 24h. Shooting de prueba disponible para nuevos clientes.
4.9★ (112 reseñas). Instagram @nomade.studio.bcn — 18k seguidores.
Tel: +34 932 780 445. hola@nomadestudio.es`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'urbano',
    tone: 'formal',
    density: 'full',
    language: 'es',
    social: { instagram: 'nomade.studio.bcn' },
    valueProp: 'Estudio propio 200m² en el Born · Clientes: ManoMano, Estrella Damm, Nespresso · Presupuesto en 24h',
    ctaType: 'email',
  },

  {
    id: 'joyeria-elara',
    name: 'Joyería Elara',
    tagline: 'Alta joyería artesanal en el Passeig de Gràcia',
    location: 'Barcelona',
    context: `Joyería Elara — Joyería de alta gama en el Passeig de Gràcia, Barcelona. Fundada en 1961 por el maestro joyero Antonio Elara, hoy en su tercera generación familiar.
Especialidad: joyas en oro 18k y platino, con diamantes certificados GIA y piedras preciosas de origen responsable (esmeraldas colombianas, zafiros birmanos, rubíes de Sri Lanka).
Colecciones propias de temporada + encargos totalmente personalizados.
Workshop propio: diseño 3D CAD/CAM, casting artesanal, engastes realizados por maestros artesanos barceloneses.
Servicios adicionales: tasación oficial de joyas, restauración de piezas antiguas y de herencia, alquiler de joyas para bodas y alta costura, auditoría de colecciones privadas.
Tiempo de encargo: 4–8 semanas según complejidad. Seguro de transporte y entrega en mano incluida. Envío internacional certificado a 40 países.
4.9★ (134 reseñas). Miembro del Real Club Joyero Español. Tasador oficial REAJ nº 2847.
Tel: +34 932 155 890. reservas@joyeriaelara.es`,
    vertical: 'shop',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'lujo',
    tone: 'formal',
    density: 'minimal',
    language: 'es',
    valueProp: 'Maestros joyeros desde 1961 · Diamantes certificados GIA · Diseño personalizado desde cero en taller propio',
    ctaType: 'email',
  },

  {
    id: 'clinica-patasverde',
    name: 'Clínica Veterinaria Patasverde',
    tagline: 'Veterinaria integral con urgencias propias en Barcelona',
    location: 'Barcelona',
    context: `Clínica Veterinaria Patasverde — Centro veterinario integral en el barrio de Horta, Barcelona. Abierta en 2016.
Directora y fundadora: Dra. Carla Mas (especialista en medicina interna y oncología felina, Universitat Autònoma de Barcelona + máster en Leipzig, Alemania).
Servicios: medicina general y preventiva, cirugía general y ortopédica, odontología veterinaria, ecografía y radiología digital, oncología, traumatología, medicina exclusiva felina (sala separada para gatos, protocolo cat-friendly certificado).
Urgencias propias: L–V hasta medianoche, S–D y festivos 24h.
Tecnología: escáner TAC Siemens, endoscopio flexible, laparoscopio, analizadores en clínica con resultados en 20 minutos.
Especies atendidas: perros, gatos, conejos y pequeños mamíferos.
Equipo: 5 veterinarios colegiados COVB + 4 auxiliares técnicos veterinarios (ATV).
Primera consulta para cachorros y gatitos nuevos: gratuita. Bono de Salud Anual 89€ (vacunas + revisión anual + desparasitación). Financiación hasta 12 meses sin intereses.
Acreditada AVEPA. Mutuas aceptadas: Reale, AXA, Allianz.
4.9★ (723 reseñas). Tel: +34 932 450 780`,
    vertical: 'clinic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Primera consulta gratuita · Urgencias propias hasta medianoche · Oncología y cirugía de alta complejidad',
    ctaType: 'phone',
  },

  {
    id: 'psicologia-clara',
    name: 'Centro de Psicología Clara',
    tagline: 'Psicología clínica y psicoterapia en Bilbao',
    location: 'Bilbao',
    context: `Centro de Psicología Clara — Centro de psicología clínica y psicoterapia en el barrio de Indautxu, Bilbao. Fundado en 2019.
Directora: Dra. Clara Ibáñez (psicóloga clínica, PIR, col. nº BI-02345, formada en el CSMIJB con estancia de investigación en la Universidad de Göttingen, Alemania).
Especialidades: terapia cognitivo-conductual (TCC), EMDR para trauma y PTSD, terapia de parejas y familia, ansiedad y trastornos de pánico, depresión y duelo, TCA, psicología infantojuvenil (desde 6 años), mindfulness basado en la evidencia.
Modalidad: presencial y online (videoconsulta encriptada con plataforma HIPAA-compliant).
Equipo: 3 psicólogos colegiados + 1 neuropsicóloga especializada en evaluación.
Primera consulta de evaluación: 65€. Sesión individual (50 min): 70€. Sesión de pareja: 85€.
Factura disponible para reembolso por mutuas (Sanitas, Asisa, Adeslas — consultar cobertura).
Consulta accesible (ascensor, sin barreras arquitectónicas). Absoluta confidencialidad garantizada.
4.9★ (112 reseñas). cita@psicologiaclara.es / Tel: +34 944 230 567`,
    vertical: 'clinic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'nordico',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Psicóloga clínica PIR especializada · Terapia presencial y online · EMDR certificada para trauma',
    ctaType: 'email',
  },

  {
    id: 'costablanca-home',
    name: 'Costa Blanca Home',
    tagline: 'Propiedades exclusivas en la Costa Blanca norte',
    location: 'Jávea',
    context: `Costa Blanca Home — Agencia inmobiliaria especializada en compraventa y alquiler de propiedades de alta gama en la Costa Blanca norte: Jávea, Denia, Moraira, Calpe, Altea y Benissa.
Fundada en 2005 por el agente Carlos Peris, con 20 años de experiencia y más de 600 transacciones cerradas en el mercado mediterráneo.
Especialistas en compradores internacionales: británicos, alemanes, belgas, holandeses, franceses y escandinavos.
Portfolio actual: 220 propiedades en exclusiva. Desde apartamentos en primera línea de playa (desde 280.000€) hasta villas de diseño con piscina infinita y vistas al mar (hasta 4,5M€).
Servicio integral al comprador: búsqueda personalizada, due diligence legal, obtención del NIE, apertura de cuenta bancaria española, conexión con arquitectos locales para reforma, gestión de alquileres turísticos con licencia turística.
Multilingüe: español, inglés, alemán, holandés, francés.
Honorarios: 3% del valor de venta a cargo del vendedor. Sin costes para el comprador.
4.8★ (312 reseñas). Tel: +34 965 780 340. info@costablancahome.es`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'mediterraneo',
    tone: 'formal',
    density: 'full',
    language: 'en',
    valueProp: '600+ transactions closed since 2005 · Full-service buying assistance (NIE, legal, reform) · Zero fees for buyers',
    ctaType: 'email',
  },

  {
    id: 'pixel-agency',
    name: 'Píxel Agency',
    tagline: 'Marketing digital para marcas con ambición',
    location: 'Madrid',
    context: `Píxel Agency — Agencia de marketing digital boutique en el barrio de Malasaña, Madrid. Fundada en 2019.
Fundadores: Sofía Medina (estratega de marca, ex-TBWA Madrid, especialista en branding y posicionamiento) y Pablo Torres (growth & performance, ex-Glovo y Tuenti).
Servicios: estrategia de marca y posicionamiento digital, SEO técnico y de contenidos, SEM y paid social (Meta Ads, TikTok Ads, Google Ads), email marketing y automatización, producción de contenidos para redes sociales (foto, vídeo, reels).
Especialidad sectorial: restauración y hostelería, moda y lifestyle, e-commerce DTC.
Clientes actuales: Grupo Larrumbe, La Despensa de Palacio, Vicio Burgers, Totaki.
Metodología: sprints de 4 semanas, dashboard de resultados en tiempo real, reunión semanal de performance.
Resultados promedio clientes: ROAS 4,2x en paid media, +180% tráfico orgánico en 6 meses.
Equipo de 9 especialistas. Sin contratos de permanencia mínima.
Primera auditoría digital gratuita: 30 min de análisis + informe escrito.
Tel: +34 910 445 230. hola@pixelagency.es`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'vibrante',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'ROAS 4.2x promedio en paid media · Sin permanencia mínima · Auditoría digital gratuita con informe',
    ctaType: 'email',
  },

  {
    id: 'espacio-vela',
    name: 'Espacio Vela',
    tagline: 'Coworking premium y eventos corporativos en Madrid',
    location: 'Madrid',
    context: `Espacio Vela — Centro de coworking premium, salas de reuniones y espacio de eventos corporativos en el barrio de Justicia, Madrid.
Inaugurado en 2020 en un edificio industrial rehabilitado de 1920 con estructura de hierro vista y techos de 4,5m.
Planta de 900m²: 80 puestos de trabajo fijo y flex, 6 salas de reuniones (4–20 personas), sala de eventos para hasta 150 asistentes, zona de descanso con café de especialidad, terraza privada.
Tecnología: fibra simétrica 1Gbps, sistema de reservas digital, impresoras y escáneres Konica Minolta, videoconferencia Poly instalada en todas las salas.
Membresías: coworking flex 199€/mes (10 días), coworking fijo 350€/mes (acceso ilimitado), sala de reuniones desde 35€/hora.
Comunidad de 120 profesionales y startups. Eventos mensuales de networking.
Incluye: café y agua ilimitados, casillero personal, domiciliación postal.
4.9★ (187 reseñas). Tel: +34 910 350 210. hola@espaciovela.es`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Edificio industrial rehabilitado de 1920 · Fibra 1Gbps simétrica · Comunidad de 120 profesionales',
    ctaType: 'email',
  },

  {
    id: 'spa-terraverde',
    name: 'Terra Verde Spa',
    tagline: 'Spa y bienestar con productos naturales en Granada',
    location: 'Granada',
    context: `Terra Verde Spa — Centro de spa, bienestar y medicina estética natural en el barrio del Realejo, Granada. Abierto en 2018.
Fundado por la esteticista y naturópata Inés Moreno, formada en el Institut Français de Massothérapie de París y certificada en técnicas ayurvédicas en Bangalore, India.
Especialidades: circuito de hidroterapia (piscina de cromoterapia, sauna finlandesa, hammam, ducha escocesa, piscina fría), masajes terapéuticos y de bienestar (sueco, piedras calientes, tailandés, ayurvédico, prenatal), tratamientos faciales con cosmética ecológica certificada COSMOS, rituales de pareja.
Sala de relajación con infusiones ecológicas incluida en todos los tratamientos.
Productos propios: línea Terra de aceites y cremas elaborados en el laboratorio del centro con plantas de la sierra granadina.
Circuito spa 90 min: 35€. Masaje + circuito: desde 75€. Rituales de pareja desde 150€.
Bonos regalo disponibles. Abono mensual ilimitado de circuito spa: 89€.
4.9★ (412 reseñas). Tel: +34 958 340 780. reservas@terrraverdespa.es`,
    vertical: 'clinic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'fresco',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Hammam, sauna finlandesa y circuito completo en 1 centro · Cosmética ecológica COSMOS · Rituales diseñados por experta naturópata',
    ctaType: 'phone',
  },

  {
    id: 'bodega-terrazo',
    name: 'Bodega Terrazo',
    tagline: 'Enoteca y vinos de autor en el corazón de La Rioja',
    location: 'Logroño',
    context: `Bodega Terrazo — Enoteca y tienda de vinos de autor en el casco antiguo de Logroño, La Rioja. Abierta en 2011 por el sumiller Juan Terraza (WSET Diploma, ex-sommelier del Restaurante Echaurren*).
Selección de más de 400 referencias: vinos de La Rioja, Ribera del Duero, Priorat, Jerez, Champagne y vinos naturales de pequeños productores. Foco en bodegas familiares y vinos de parcela.
Servicios: tienda presencial y online, catas guiadas (jueves 19:30, aforo 12 personas, reserva obligatoria), maridajes privados para empresas, asesoría para bodas y eventos, servicio de suscripción mensual "Caja Terrazo" (6 botellas seleccionadas, desde 79€/mes).
Precio medio botella tienda: 18€. Gama premium hasta 280€. Envío en 24h con embalaje anticorte a toda España.
Colaborador habitual de La Rioja Tourism y proveedor de 8 restaurantes con estrella de la región.
4.9★ (276 reseñas). Tel: +34 941 220 780. hola@bodegatarrazo.es`,
    vertical: 'shop',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'clasico',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Sumiller WSET Diploma · 400+ referencias de pequeños productores · Catas semanales y suscripción mensual curada',
    ctaType: 'email',
  },

  {
    id: 'estetica-vidal',
    name: 'Clínica Estética Dra. Vidal',
    tagline: 'Medicina estética avanzada en Barcelona',
    location: 'Barcelona',
    context: `Clínica Estética Dra. Vidal — Centro de medicina estética y dermatología cosmética en el barrio de Sarrià, Barcelona. Fundada en 2014.
Directora: Dra. Elena Vidal (médico especialista en Dermatología, formada en el Hospital Clínic de Barcelona, máster en Medicina Estética por la Universidad de Barcelona, miembro de la SEME).
Tratamientos faciales: toxina botulínica (Botox, Xeomin), rellenos de ácido hialurónico, bioestimuladores (Sculptra, Radiesse), mesoterapia, peelings médicos, láser fraccionado CO₂, HIFU Ultraformer, radiofrecuencia Morpheus8.
Tratamientos corporales: lipólisis por láser (SculpSure), criolipólisis, presoterapia, tratamientos anticelulíticos.
Tecnología: equipos médicos certificados CE, protocolos validados clínicamente. Sin franquicia — médico siempre presente en cada sesión.
Primera visita de valoración: gratuita y sin compromiso. Financiación hasta 12 meses sin intereses.
4.9★ (389 reseñas). Tel: +34 932 050 678. clinica@dravidal.es`,
    vertical: 'clinic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'lujo',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Médico especialista en cada sesión · Primera valoración gratuita · Tecnología láser y HIFU certificada CE',
    ctaType: 'phone',
  },

  {
    id: 'bar-txoko',
    name: 'Bar Txoko',
    tagline: 'Pintxos de autor y sidra natural en el Casco Viejo',
    location: 'San Sebastián',
    context: `Bar Txoko — Bar de pintxos de autor en el Casco Viejo de San Sebastián (Donostia), a 50 metros de la Plaza de la Constitución.
Regentado desde 2008 por los hermanos Aizpuru. Pintxos elaborados cada mañana con producto fresco del mercado de La Bretxa.
Especialidades: gilda perfecta (anchoa Olasagasti, guindilla de Ibarra, oliva manzanilla), txangurro gratinado en su concha, foie con mermelada de pimiento, croqueta de jamón ibérico premiada en el Campeonato de Pintxos de Gipuzkoa 2022.
Sidra natural de Astigarraga servida directamente del tonel. Txakoli de Getaria en copa. Vinos de Navarra.
Horario: todos los días 11:00–15:00 y 19:00–23:00. Los pintxos fríos siempre en barra, los calientes bajo demanda.
Precio medio: 2,50–4€ por pintxo. Menú degustación grupos (10+ personas) con reserva previa: 35€.
4.8★ (1.102 reseñas). Tel: +34 943 420 567`,
    vertical: 'bar',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'festivo',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    menuText: `Pintxos fríos (en barra)
- La Gilda perfecta 2,50€
- Anchoa del Cantábrico en tosta 3€
- Jamón ibérico bellota en pan de cristal 3,50€
- Queso idiazabal ahumado con membrillo 2,80€

Pintxos calientes (bajo demanda)
- Croqueta de jamón ibérico 2,80€
- Txangurro gratinado en su concha 4€
- Foie mi-cuit con mermelada de pimiento 4,50€
- Hongos salteados con huevo de caserío 3,50€`,
    valueProp: 'Premio al mejor pintxo caliente Gipuzkoa 2022 · Producto fresco del mercado La Bretxa cada mañana · Sidra natural de tonel',
    ctaType: 'phone',
  },

  {
    id: 'reforma-hogar',
    name: 'Reforma & Hogar Madrid',
    tagline: 'Reformas integrales de viviendas en Madrid',
    location: 'Madrid',
    context: `Reforma & Hogar Madrid — Empresa de reformas integrales y parciales de viviendas, oficinas y locales comerciales en Madrid y área metropolitana. Fundada en 2009.
Director técnico: Rodrigo Alonso, aparejador titulado por la UPM con 20 años de experiencia en obra. Equipo propio de 14 oficiales: albañiles, electricistas, fontaneros, pintores y escayolistas. Sin subcontrataciones — todo el equipo es empleado fijo.
Tipos de reforma: integral (desde suelo hasta techo), cocinas y baños, apertura de espacios (derribo de tabiques con informe estructural), instalaciones eléctricas y fontanería, certificados de eficiencia energética.
Proceso: visita de medición gratuita en 48h, presupuesto detallado en 72h, proyecto de interiorismo incluido en reformas integrales, gestión de licencias de obra, limpieza de obra incluida.
Precio orientativo: reforma integral desde 550€/m², baño completo desde 4.500€, cocina desde 6.000€.
Garantía legal de 10 años en estructura, 3 años en instalaciones. Seguro de responsabilidad civil 1M€.
4.8★ (534 reseñas). Tel: +34 910 234 560. presupuesto@reformayhogar.es`,
    vertical: 'generic',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Equipo propio sin subcontratas · Presupuesto detallado en 72h · Garantía 10 años en estructura',
    ctaType: 'quote',
  },

  {
    id: 'guarderia-arcoiris',
    name: 'Guardería Arcoíris',
    tagline: 'Escuela infantil de 0 a 6 años en Sevilla',
    location: 'Sevilla',
    context: `Guardería Arcoíris — Escuela infantil privada de 0 a 6 años en el barrio de Triana, Sevilla. Abierta desde 2010.
Directora: Lucía Romero, maestra de Educación Infantil por la Universidad de Sevilla, especializada en pedagogía Montessori y Reggio Emilia. Equipo de 8 educadoras tituladas (ratio 1:4 en bebés, 1:8 en mayores).
Proyecto educativo: metodología activa y respetuosa, aprendizaje por proyectos, inglés desde los 4 meses (profesora nativa), música y movimiento diario, huerto escolar, cocina propia con menú ecológico elaborado por nutricionista.
Instalaciones: 350m² adaptados, 4 aulas diferenciadas por edades, patio exterior con jardín y área de juego natural, sala multisensorial.
Horario: L–V 7:30–18:00 (jornada ampliada hasta 19:00 disponible). Comedor incluido.
Precio mensual: desde 680€ (jornada completa con comedor). Plazas muy limitadas — lista de espera habitual.
Concierto con el Ayuntamiento de Sevilla para familias con renta reducida.
4.9★ (178 reseñas). Tel: +34 954 330 240. info@guarderiaarcoiris.es`,
    vertical: 'academy',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Metodología Montessori y Reggio Emilia · Inglés nativo desde los 4 meses · Menú ecológico con nutricionista',
    ctaType: 'phone',
  },

  {
    id: 'optica-vision',
    name: 'Óptica Visión Clara',
    tagline: 'Tu óptica de confianza en el centro de Madrid',
    location: 'Madrid',
    context: `Óptica Visión Clara — Óptica y optometría en el barrio de Malasaña, Madrid. Fundada en 2003 por la óptica-optometrista Carmen Ruiz (col. nº 8.234 CNOO, máster en Optometría Clínica por la UCM).
Servicios: examen visual completo gratuito (40 min), adaptación de lentes de contacto (blandas, rígidas, ortoqueratología), graduación de gafas, baja visión, terapia visual para niños con problemas de lectura y dislexia, control de miopía progresiva en menores.
Gafas: monturas propias de diseño local + marcas internacionales (Lindberg, Mykita, Silhouette, Tom Ford, Persol). Cristales Zeiss, Essilor y Hoya. Gafas de sol polarizadas y de protección deportiva.
Lentes de contacto: adaptación y seguimiento incluido, suscripción mensual con entrega a domicilio.
Precio: examen visual gratuito, gafas completas desde 79€, lentes de contacto desde 19€/mes.
Reparaciones en el día. Garantía 2 años en monturas.
4.9★ (412 reseñas). Tel: +34 915 230 780. cita@opticavisionclara.es`,
    vertical: 'clinic',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'nordico',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Examen visual completo gratuito · Especialistas en control de miopía infantil · Cristales Zeiss y Essilor con garantía 2 años',
    ctaType: 'phone',
  },

  // Opus — 4 new demos covering salon, gym, pharmacy, workshop ────────────

  {
    id: 'atelier-blanca',
    name: 'Atelier Blanca',
    tagline: 'Peluquería y coloración de autor en Bilbao',
    location: 'Bilbao',
    context: `Atelier Blanca — Salón de peluquería premium en el barrio de Abando, Bilbao. Fundado en 2016.
Directora y estilista principal: Blanca Uriarte, formada en la Escuela Llongueras de Barcelona y con 3 años en el estudio de Frédéric Fekkai en Nueva York.
Especialidades: coloración técnica de autor (balayage, color painting, Root Smudge, Ombre personalizado), corte femenino de precisión, tratamientos de reestructuración capilar (Olaplex, Kerasmooth), extensiones de cabello 100% natural con queratina.
Equipo de 5 estilistas, todos con formación continua en Wella Professionals y L'Oréal Professionnel.
Solo con cita previa — atención personalizada sin prisas, mínimo 2 horas por visita de color.
Experiencia cliente: copa de cava o té de bienvenida, música curada, zona de espera de diseño con revistas de moda.
Precio: corte femenino desde 65€, balayage completo desde 190€, tratamiento Olaplex desde 95€.
También: nails art y manicura (desde 35€), lifting de pestañas (45€), diseño de cejas (30€).
4.9★ (287 reseñas). Instagram @atelierblanca.bilbao — 5.200 seguidores.
Tel: +34 944 250 780. cita@atelierblanca.es`,
    vertical: 'salon',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'urbano',
    tone: 'formal',
    density: 'minimal',
    language: 'es',
    social: { instagram: 'atelierblanca.bilbao' },
    valueProp: 'Formada con Frédéric Fekkai en Nueva York · Solo con cita, sin prisas · Coloración 100% personalizada con Wella y L\'Oréal',
    ctaType: 'phone',
  },

  {
    id: 'atleta-sports',
    name: 'ATLETA Sports Center',
    tagline: 'Entrenamiento de alto rendimiento en Sevilla',
    location: 'Sevilla',
    context: `ATLETA Sports Center — Centro de entrenamiento funcional y alto rendimiento en el barrio de Nervión, Sevilla. Fundado en 2019.
Director técnico: Roberto Jiménez, preparador físico (INEF Sevilla), ex-preparador del equipo de fútbol femenino del Real Betis y certificado Strength & Conditioning Coach por la NSCA.
Especialidades: entrenamiento funcional y CrossFit (WOD diario + técnica), preparación física para deportistas de competición (atletismo, triatlón, fútbol), powerlifting y halterofilia olímpica, HIIT y fitness grupal (hasta 10 personas), planificación nutricional deportiva.
Instalaciones de 1.200m²: zona olímpica con plataformas Eleiko, zona funcional Rogue completa, pared de escalada de 8m, sauna finlandesa, vestuarios premium con cold plunge (baño de hielo).
Tecnología: pulseras de monitorización HRV incluidas, app propia con seguimiento de progreso y acceso a histórico de entrenamientos, análisis de composición corporal DEXA trimestral incluido en cuota anual.
Ratio máximo 8 alumnos por coach. 7 coaches certificados en plantilla.
Cuotas: mensual 95€ (acceso ilimitado), bimestral 170€, anual 950€. Primera semana de prueba gratuita.
Comunidad de 320 socios activos. Competiciones internas trimestrales.
4.9★ (389 reseñas). Instagram @atletasportscenter — 9.400 seguidores.
Tel: +34 954 670 345`,
    vertical: 'gym',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'vibrante',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    social: { instagram: 'atletasportscenter' },
    valueProp: 'Ex-preparador del Real Betis Femenino · Cold plunge, sauna y análisis DEXA incluidos · Ratio máximo 8 alumnos por coach',
    ctaType: 'phone',
  },

  {
    id: 'farmacia-roca',
    name: 'Farmacia Roca',
    tagline: 'Farmacia y dermofarmacia en Sant Gervasi',
    location: 'Barcelona',
    context: `Farmacia Roca — Farmacia y centro de dermofarmacia en el barrio de Sant Gervasi, Barcelona. Abierta desde 1948 por la familia Roca, hoy en su tercera generación.
Farmacéutica titular: Dra. Cristina Roca (col. nº 11.478 COFB), especializada en dermocosmética de prescripción y nutrición aplicada.
Servicios: dispensación de medicamentos con y sin receta, dermofarmacia y cosmética médica (SkinCeuticals, Medik8, La Roche-Posay, Avène, CeraVe), nutrición y suplementación (deportiva, embarazo, tercera edad), ortopedia y material sanitario, análisis rápidos en 15 min (tensión, glucemia, colesterol, INR), vacunas de viaje (fiebre amarilla, hepatitis A/B, tifoidea), preparados magistrales.
Servicio de medicación personalizada: blísteres semanales para pacientes polimedicados (servicio gratuito).
Entrega a domicilio en 2 horas (zona Sarrià-Sant Gervasi-Les Corts). Consulta por videollamada disponible.
Horario: L–V 9:00–21:00, S 10:00–14:00. Guardia nocturna rotativa (indicado en puerta).
4.9★ (312 reseñas). Tel: +34 932 130 560. farmaciaroca@cofb.net`,
    vertical: 'pharmacy',
    model: 'claude-opus-4-7',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'formal',
    density: 'full',
    language: 'es',
    valueProp: 'Tercera generación familiar desde 1948 · Especialistas en dermocosmética SkinCeuticals y Medik8 · Entrega a domicilio en 2 horas',
    ctaType: 'phone',
  },

  {
    id: 'autodiaz',
    name: 'AutoDíaz Taller',
    tagline: 'Taller mecánico multimarca en Madrid desde 1994',
    location: 'Madrid',
    context: `AutoDíaz — Taller mecánico y de chapa y pintura multimarca en Vallecas, Madrid. Fundado en 1994 por el mecánico Ángel Díaz, hoy liderado por sus hijos Miguel y Javier.
30 años de experiencia. Equipo de 9 mecánicos y chapistas con certificación FP Automoción y formación continua. Taller oficial Bosch Car Service. Autorización BMW/MINI para revisiones en garantía.
Especialidades: mecánica general (motor, distribución, embrague, frenos, suspensión), diagnóstico electrónico multimarca (escáner BOSCH KTS 590), chapa y pintura (cabina de secado con control de temperatura, igualación de color por espectrofotómetro), ITV pre-revisión, climatización (recarga gas R134a y R1234yf), neumáticos y equilibrado (Michelin, Continental, Bridgestone, Goodyear).
Vehículos: turismos, SUV, furgonetas, coches eléctricos e híbridos (certificados para alta tensión).
Proceso: presupuesto escrito gratuito antes de cualquier trabajo, sin sorpresas. Recogida y entrega a domicilio incluida (radio 10km).
Garantía: 2 años en reparaciones mecánicas, 1 año en chapa y pintura. Seguro de responsabilidad civil 2M€.
Coche de sustitución disponible durante reparaciones largas (consultar disponibilidad).
Horario: L–V 8:00–19:00, S 8:00–13:00.
4.8★ (612 reseñas). Tel: +34 914 780 345`,
    vertical: 'workshop',
    model: 'claude-opus-4-7',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: '30 años de experiencia · Bosch Car Service oficial · Presupuesto escrito gratuito, garantía 2 años en todas las reparaciones',
    ctaType: 'quote',
  },

  // ─── Claude Sonnet 4.6 demos ──────────────────────────────────────────────

  {
    id: 'alquimia-cocktails',
    name: 'Alquimia Cocktail Bar',
    tagline: 'Cócteles de autor en el corazón del Eixample',
    location: 'Barcelona',
    context: `Alquimia Cocktail Bar — Coctelería de autor en el Eixample barcelonés, frente al Mercat de l'Abaceria.
Abierto en 2019 por los bartenders Laia Vidal y Marc Font, finalistas del Diageo World Class 2022.
Concepto: cócteles con ingredientes locales y técnicas de alta cocina (esferificaciones, infusiones al vacío, destilados propios de hierbas catalanas).
Carta de 24 cócteles de temporada + 12 clásicos reinterpretados. Maridaje con pequeños platos (bravas de autor, tostadas con trufa, tabla de quesos).
Aforo 45 personas. Ambiente íntimo, luz cálida, música jazz/soul.
Horario: Ma–Ju 19:00–02:00, Vi–Sa 19:00–03:00, Do 18:00–01:00.
4.8★ (312 reseñas). Incluido en "Los 50 mejores bares de España" 2023 por Vanity Fair.
WhatsApp: +34 630 445 678`,
    vertical: 'bar',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'vibrante',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    palette: ['#d4a853', '#1a1108', '#f5f0e8', '#0d0a05'],
    whatsapp: '+34630445678',
    valueProp: 'Finalistas Diageo World Class 2022 · Entre los 50 mejores bares de España (Vanity Fair) · Ingredientes locales con técnicas de alta cocina',
    ctaType: 'whatsapp',
  },

  {
    id: 'studio-mireia',
    name: 'Studio Mireia',
    tagline: 'Peluquería premium en Madrid de Salamanca',
    location: 'Madrid',
    context: `Studio Mireia — Salón de peluquería y belleza premium en el barrio de Salamanca, Madrid.
Fundado por Mireia Camps, estilista con 15 años de experiencia y formación en Toni&Guy Londres y L'Oréal Paris.
Especialidades: coloración técnica (balayage, babylights, color correction), corte femenino de autor, tratamientos de nutrición con Olaplex y Kérastase.
También: extensiones de cabello 100% natural, nails art, lifting de pestañas y diseño de cejas.
Solo con cita previa. Equipo de 5 estilistas. Clientes habituales del barrio y profesionales.
Precio: corte mujer desde 55€, balayage completo desde 180€, manicura desde 35€.
4.9★ (203 reseñas). Instagram @studiomireia — 8.400 seguidores.
Tel: +34 915 762 034`,
    vertical: 'salon',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'minimal',
    tone: 'friendly',
    density: 'minimal',
    language: 'es',
    social: { instagram: 'studiomireia' },
    valueProp: '15 años de experiencia · Formación Toni&Guy Londres y L\'Oréal Paris · Atención solo con cita, nunca esperas',
    ctaType: 'phone',
  },

  {
    id: 'dental-azul',
    name: 'Clínica Dental Azul',
    tagline: 'Tu sonrisa, nuestra especialidad',
    location: 'Valencia',
    context: `Clínica Dental Azul — Clínica dental de referencia en el barrio de Ruzafa, Valencia.
Fundada en 2015 por la Dra. Sofía Blanco (especialista en ortodoncia y estética dental, formada en la UAB y con máster en Nueva York).
Servicios: ortodoncia invisible Invisalign, implantes dentales Nobel Biocare, blanqueamiento LED, carillas de porcelana, periodoncia, endodoncia y odontología infantil.
Tecnología: escáner intraoral 3D, TAC dental de baja radiación, diseño de sonrisa digital.
Equipo de 4 dentistas + 2 higienistas. Más de 3.000 pacientes activos.
Primera visita y diagnóstico: gratuito. Financiación hasta 24 meses sin intereses.
Horario: L–V 9:00–20:00, S 9:00–14:00. 4.9★ (521 reseñas).
Tel: +34 963 421 700`,
    vertical: 'clinic',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'fresco',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Primera visita y diagnóstico gratis · Invisalign certificada · Escáner intraoral 3D y diseño digital de sonrisa',
    ctaType: 'phone',
  },

  {
    id: 'forge-gym',
    name: 'Forge Gym',
    tagline: 'Entrena diferente. Resultados reales.',
    location: 'Madrid',
    context: `Forge Gym — Centro de entrenamiento funcional y crossfit en el barrio de Malasaña, Madrid.
Fundado en 2020 por los entrenadores Álvaro Méndez y Sara Torrecilla, ambos con titulación NSCA-CSCS y experiencia en equipos olímpicos españoles.
Modalidades: Crossfit WOD diario, HIIT, boxeo, Olympic lifting, entrenamiento personal, movilidad y recuperación.
Espacio de 600m², suelo técnico, plataformas olímpicas, equipamiento Rogue, zona de cardio, ducha y vestuarios premium.
Cuotas: mensual 79€, trimestral 210€, anual 720€. Clases de prueba gratis primera semana.
Box abierto todos los días: 6:00–22:30 L–V, 8:00–20:00 S–D.
4.9★ (674 reseñas). Comunidad de 280 socios activos. Instagram @forgegym.madrid — 12k seguidores.`,
    vertical: 'gym',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    palette: ['#dc2626', '#111111', '#f5f5f5', '#0a0a0a'],
    social: { instagram: 'forgegym.madrid' },
    valueProp: 'Entrenadores con certificación NSCA-CSCS · Primera semana de clases gratis · Box abierto 6:00–22:30 todos los días',
    ctaType: 'phone',
  },

  {
    id: 'farmacia-mayor',
    name: 'Farmacia Mayor',
    tagline: 'Tu farmacia de confianza en Chamberí',
    location: 'Madrid',
    context: `Farmacia Mayor — Farmacia tradicional y parafarmacia en la calle Bravo Murillo, barrio de Chamberí, Madrid. Abierta desde 1962.
Regentada por la farmacéutica Marta Solano (tercer generación familiar), titulada por la UCM con máster en Dermofarmacia.
Servicios: dispensación con receta y sin receta, dermofarmacia y cosmética de prescripción (La Roche-Posay, Avène, SVR), nutrición deportiva, ortopedia y material sanitario, análisis de tensión arterial y glucemia, vacunas de viaje, preparados magistrales propios.
Horario: L–V 9:00–21:30, S 10:00–14:00. Guardia 24h rotativa (indicado en puerta).
Servicio de entrega a domicilio en 2 horas (radio 3km).
4.8★ (189 reseñas). Farmacéutica colegiada nº 28.456 COFM.
Tel: +34 915 330 220`,
    vertical: 'pharmacy',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'fresco',
    tone: 'friendly',
    density: 'minimal',
    language: 'es',
    valueProp: 'Tercera generación familiar desde 1962 · Entrega a domicilio en 2 horas · Especialista en dermofarmacia y cosmética de prescripción',
    ctaType: 'phone',
  },

  {
    id: 'language-hub',
    name: 'The Language Hub',
    tagline: 'English, French & German classes in Seville',
    location: 'Seville',
    context: `The Language Hub — Language school in the heart of Seville, specialising in English, French and German for adults and children.
Founded in 2016 by British teacher Emma Wilson and Spanish linguist Carlos Fernández.
Courses: business English (B2–C2), exam preparation (Cambridge, IELTS, TOEFL, DELF), conversation groups (max 6 students), intensive summer programmes, private 1-to-1 tutoring.
Method: communicative approach, native teachers, weekly progress reports, access to online platform.
Facilities: 8 modern classrooms, language lab, conversation lounge, rooftop garden for outdoor classes.
Students: 450 active enrolments. 94% exam pass rate. Average class size 6 students.
Pricing: group classes €89/month (2h/week), private €35/hour. Free placement test.
Schedule: Mon–Fri 8:30–21:00, Sat 9:00–14:00.
4.9★ (387 reviews). British Council affiliated.`,
    vertical: 'academy',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'nordico',
    tone: 'friendly',
    density: 'full',
    language: 'en',
    valueProp: '94% exam pass rate · Maximum 6 students per class · British Council affiliated since 2016',
    ctaType: 'email',
  },

  {
    id: 'nuvola-moda',
    name: 'Nuvola',
    tagline: 'Moda sostenible para mujer',
    location: 'Sevilla',
    context: `Nuvola — Boutique de moda sostenible para mujer en el barrio de Santa Cruz, Sevilla. Abierta en 2021.
Fundada por la diseñadora Andrea López (graduada en moda en Parsons NY) con la misión de hacer la moda lenta accesible.
Colecciones propias de ropa de mujer (tallas 34–48), accesorios y joyería artesanal. Todas las prendas fabricadas en España con tejidos certificados GOTS y OEKO-TEX.
También: servicio de estilismo personal (cita previa), personalización de prendas, taller de reparación y upcycling.
Rango de precios: camisetas 35–60€, vestidos 90–180€, chaquetas 120–250€.
Tienda de 90m² en dos plantas. Pop-ups y mercadillos mensuales.
4.9★ (145 reseñas). Instagram @nuvola.sevilla — 6.200 seguidores.
Tel: +34 625 340 178`,
    vertical: 'shop',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'minimal',
    tone: 'friendly',
    density: 'minimal',
    language: 'es',
    social: { instagram: 'nuvola.sevilla' },
    valueProp: 'Diseñadora graduada en Parsons Nueva York · Fabricación 100% en España · Tejidos certificados GOTS y OEKO-TEX',
    ctaType: 'phone',
  },

  {
    id: 'taller-automocion',
    name: 'Taller Garaje 46',
    tagline: 'Mecánica de confianza en Valencia',
    location: 'Valencia',
    context: `Taller Garaje 46 — Taller mecánico multimarca en el polígono Vara de Quart, Valencia. 25 años de experiencia.
Especialistas en mecánica general (motor, embrague, frenos, suspensión), mantenimiento preventivo, diagnóstico electrónico, climatización y preITV.
También: mecánica rápida sin cita para aceite, filtros, escobillas, neumáticos y baterías — en menos de 45 minutos.
Vehículos: turismos, SUV, furgonetas y vehículos eléctricos/híbridos. Marca oficial para seguros AXA, Mapfre y Allianz.
Presupuesto gratis y por escrito. Garantía de 2 años en reparaciones.
Horario: L–V 8:00–19:00, S 8:00–13:00. Recogida y entrega a domicilio disponible.
4.7★ (412 reseñas). Taller autorizado por DGT.
Tel: +34 963 770 046`,
    vertical: 'workshop',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: '25 años de experiencia · Mecánica rápida sin cita en 45 minutos · Presupuesto escrito gratuito con garantía 2 años',
    ctaType: 'phone',
  },

  {
    id: 'fisioactiva',
    name: 'FisioActiva',
    tagline: 'Fisioterapia y rehabilitación en Bilbao',
    location: 'Bilbao',
    context: `FisioActiva — Centro de fisioterapia, osteopatía y pilates clínico en el centro de Bilbao.
Fundado en 2018 por el fisioterapeuta Iñaki Garmendia (col. nº 3421 COFPV), especialista en fisioterapia deportiva y neurológica.
Servicios: fisioterapia manual ortopédica, osteopatía, rehabilitación post-quirúrgica, fisioterapia respiratoria, suelo pélvico, pilates terapéutico en pequeños grupos (máx 4 personas), ecografía musculoesquelética.
Acreditado por MUFACE, MUGEJU, ISFAS, Sanitas, Adeslas, Asisa y Generali.
Equipo de 4 fisioterapeutas colegiados + 2 instructoras de pilates.
Primera visita + valoración: 45€. Sesión fisioterapia 55€. Bono 10 sesiones 490€.
4.9★ (267 reseñas). Tel: +34 944 235 467`,
    vertical: 'clinic',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Acreditado MUFACE, Sanitas, Adeslas y Generali · Especialista en fisioterapia deportiva y neurológica · Ecografía musculoesquelética en clínica',
    ctaType: 'phone',
  },

  {
    id: 'bloom-cafe',
    name: 'Bloom Café',
    tagline: 'Specialty coffee & all-day brunch in Madrid',
    location: 'Madrid',
    context: `Bloom Café — Specialty coffee shop and all-day brunch in Chueca, Madrid.
Opened in 2021 by barista champion Tomás Herrero and photographer Claudia Reyes.
Coffee: single-origin beans from Colombia, Ethiopia and Guatemala, roasted weekly by Nomad Coffee Barcelona. Espresso, filter, V60, cold brew, matcha, chai.
Food: avocado toast with poached egg, açaí bowls, eggs benedict, sourdough pancakes, bagels, seasonal salads. Vegan and gluten-free options for everything.
Aesthetic: exposed brick, trailing plants, natural light, curated vinyl collection. Dog-friendly terrace.
Open daily 8:00–18:00. No reservations — first come, first served.
4.8★ (892 reviews). Featured in Time Out Madrid, El País Semanal.
Instagram @bloom.cafe.madrid — 22k followers.`,
    vertical: 'bar',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'urbano',
    tone: 'friendly',
    density: 'minimal',
    language: 'en',
    social: { instagram: 'bloom.cafe.madrid' },
    valueProp: 'Featured in Time Out Madrid & El País Semanal · Single-origin coffee by Nomad Coffee Barcelona · 100% vegan-friendly menu',
    ctaType: 'email',
  },

  {
    id: 'flores-elvira',
    name: 'Flores Elvira',
    tagline: 'Floristería artesanal en el corazón de Granada',
    location: 'Granada',
    context: `Flores Elvira — Floristería artesanal en la Calle Recogidas de Granada, fundada en 1975 por Elvira Castillo y ahora regentada por su hija Carmen.
Especialidad: ramos de novia y decoración floral para bodas (más de 200 bodas al año en Granada, Málaga y Almería), centros de mesa para eventos corporativos, plantas de interior y terraza.
Servicio personalizado: Carmen visita la ubicación de la boda y crea propuestas visuales antes del presupuesto.
Flores de temporada compradas directamente en el Mercado de Flores de Barcelona. Sin flores de invernadero holandés.
También: suscripción semanal de flores frescas para casa u oficina (desde 25€/semana), clases de arreglo floral (sábados, plazas limitadas).
4.9★ (312 reseñas Google). Instagram @floreselvira — 4.800 seguidores.
Tel: +34 958 220 340`,
    vertical: 'shop',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    social: { instagram: 'floreselvira' },
    valueProp: 'Floristería artesanal desde 1975 · Más de 200 bodas al año en Andalucía · Flores de temporada compradas directamente sin invernadero',
    ctaType: 'phone',
  },

  {
    id: 'rural-olivos',
    name: 'Casa Rural Los Olivos',
    tagline: 'Tu descanso en la Sierra de Gredos',
    location: 'Ávila',
    context: `Casa Rural Los Olivos — Casa rural con encanto en el municipio de El Tiemblo, en la falda norte de la Sierra de Gredos (Ávila). A 90 minutos de Madrid.
Rehabilitación de una casa de piedra del siglo XVIII por los arquitectos Marta e Ignacio en 2017.
6 habitaciones dobles con baño privado, chimenea y vistas a la sierra. Capacidad total: 14 personas. Ideal para grupos, retiros y escapadas de pareja.
Incluido: desayuno campero con productos locales, acceso al jardín con piscina (junio–sept), zona de barbacoa, biblioteca, sala de yoga.
Actividades disponibles: senderismo guiado por el Parque Natural, ruta BTT, kayak en el embalse, visita a bodegas locales, clases de cocina castellana.
Precio: desde 95€/noche por habitación (doble), desayuno incluido. Alquiler completo de la casa: desde 580€/noche.
4.9★ (218 reseñas Booking + Google). Certificado Biosphere Responsible Tourism.
Reservas: +34 628 340 120`,
    vertical: 'hotel',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    valueProp: 'Casa de piedra del s. XVIII rehabilitada · Certificado Biosphere Responsible Tourism · A 90 minutos de Madrid con actividades en plena naturaleza',
    ctaType: 'phone',
  },

  {
    id: 'blackink-tattoo',
    name: 'Black Ink Studio',
    tagline: 'Tatuajes artísticos en Bilbao',
    location: 'Bilbao',
    context: `Black Ink Studio — Estudio de tatuaje artístico en el barrio de Abando, Bilbao. Fundado en 2016.
Tres artistas especializados: Raúl (blackwork y geometría sagrada, 12 años de experiencia), Amaia (realismo y retrato, premio al mejor tatuaje realista en Madrid Tattoo Convention 2022), y Dani (lettering y microtatuaje, especialista en tatuajes mínimos).
Estilos: blackwork, realismo, neo-tradicional, japonés, lettering, geométrico, microtatuaje.
Proceso: consulta gratuita, diseño personalizado previo a la sesión (nunca diseños genéricos). Tattoo de 2h mínimo para asegurar calidad.
Precios: desde 120€ (pequeño) hasta proyectos completos. Sesiones de 3–8 horas para proyectos grandes.
Galería limpia, agujas desechables certificadas, tintas veganas.
4.9★ (167 reseñas). Bookings: WhatsApp o formulario online.`,
    vertical: 'generic',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'industrial',
    tone: 'friendly',
    density: 'minimal',
    language: 'es',
    valueProp: 'Premio al mejor tatuaje realista Madrid Tattoo Convention 2022 · Diseño 100% personalizado, nunca genérico · Tintas veganas y agujas certificadas',
    ctaType: 'whatsapp',
  },

  {
    id: 'masa-madre',
    name: 'Masa Madre',
    tagline: 'Panadería artesanal con fermentación lenta',
    location: 'San Sebastián',
    context: `Masa Madre — Panadería artesanal de fermentación lenta en el casco antiguo de San Sebastián (Parte Vieja).
Abierta en 2019 por el panadero Jon Urrutia, formado en el Institut Paul Bocuse de Lyon y con 5 años trabajando en Poilâne (París).
Producto: panes de masa madre con harinas ecológicas de molino de piedra (trigo, centeno, espelta), fermentaciones de 18–36 horas, horneado en horno de piedra de leña. Sin aditivos, sin mejorantes.
También: croissants de mantequilla AOP, pain au chocolat, brioches, financieres, tartas de temporada, baguettes.
Producción limitada: los panes se venden por reserva previa (formulario web) o por orden de llegada hasta agotar existencias.
Horario: Ma–Sa 8:00–14:00, cerrado domingos y lunes.
4.9★ (423 reseñas). Proveedor de 12 restaurantes con estrella Michelin del País Vasco.
Tel: +34 943 440 210`,
    vertical: 'restaurant',
    model: 'claude-sonnet-4-6',
    siteTheme: 'dark',
    stylePreset: 'clasico',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    menuText: `Panes (disponibles Ma–Sa hasta agotar)
- Pan de masa madre trigo 900g — 9€
- Centeno 80% 800g — 8,50€
- Espelta con nueces 700g — 9,50€
- Baguette tradition — 2,80€

Bollería (mañanas)
- Croissant mantequilla AOP — 3,20€
- Pain au chocolat — 3,50€
- Brioche feuilleté — 4€
- Financière de almendra — 2,80€

Tartas (encargo 48h)
- Tarta de manzana masa madre — desde 28€`,
    valueProp: 'Formado en Institut Paul Bocuse y Poilâne París · Proveedor de 12 restaurantes Michelin del País Vasco · Fermentación 18–36 horas, cero aditivos',
    ctaType: 'phone',
  },

  {
    id: 'core-pilates',
    name: 'Core Pilates Studio',
    tagline: 'Pilates reformer y funcional en Barcelona',
    location: 'Barcelona',
    context: `Core Pilates Studio — Estudio boutique de pilates con máquinas reformer en el barrio de Gracia, Barcelona.
Fundado en 2020 por la instructora certificada Ana Ferrer (certificación STOTT Pilates, formación en Nueva York y Londres).
Clases: pilates reformer (máx 5 personas), pilates mat, pilates funcional, pilates prenatal y postnatal, pilates para deportistas (recuperación y rendimiento).
5 reformers Balanced Body + zona mat. Suelo radiante, ambiente cálido y musical.
Profesoras: 4 instructoras certificadas STOTT o BASI Pilates.
Tarifas: clase suelta 28€, bono 10 clases 240€, suscripción mensual 2 clases/semana 180€. Primera clase de prueba 15€.
4.9★ (189 reseñas). Lista de espera habitual — se recomienda reservar con 1 semana de antelación.
Instagram @core.pilates.bcn — 5.600 seguidores.
Tel: +34 932 654 780`,
    vertical: 'gym',
    model: 'claude-sonnet-4-6',
    siteTheme: 'light',
    stylePreset: 'fresco',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    social: { instagram: 'core.pilates.bcn' },
    valueProp: 'Certificación STOTT Pilates Nueva York y Londres · Máximo 5 personas por clase · Primera clase de prueba por solo 15€',
    ctaType: 'phone',
  },

  // ── GPT-4o demos ──────────────────────────────────────────────────────────────

  {
    id: 'optica-sehen',
    name: 'Óptica Sehen',
    tagline: 'Ihr Optiker an der Costa del Sol',
    location: 'Torremolinos',
    vertical: 'clinic',
    model: 'gpt-4o',
    siteTheme: 'light',
    stylePreset: 'nordico',
    tone: 'formal',
    density: 'full',
    language: 'de',
    context: `Óptica Sehen — Optiker und Augenoptik-Geschäft in Torremolinos, Costa del Sol. Spezialisiert auf die deutschsprachige Gemeinde.
Inhaberin: Ingrid Müller, staatlich geprüfte Augenoptikerin mit 20 Jahren Erfahrung in Deutschland und Spanien.
Leistungen: Sehtest kostenlos, Brillen und Kontaktlinsen, Sonnenbrillen (Ray-Ban, Oakley, Tom Ford), Reparaturen, Anpassung von Hörgeräten.
Marken: Zeiss Gläser, Essilor, Varilux Progressivgläser. Deutsche Qualitätsstandards in Spanien.
Preise: Sehtest kostenlos, Komplettbrille ab 99€, Kontaktlinsen-Jahresvorrat ab 180€.
Öffnungszeiten: Mo–Fr 10:00–19:00, Sa 10:00–14:00. Termine auf Wunsch.
Wird von deutschen, österreichischen und schweizer Residenten sehr geschätzt.
Tel: +34 952 380 240. Wir sprechen Deutsch, Español, English.`,
  },

  {
    id: 'flow-yoga',
    name: 'Flow Yoga Barcelona',
    tagline: 'Premium yoga studio in the heart of Eixample',
    location: 'Barcelona',
    vertical: 'gym',
    model: 'gpt-4o',
    siteTheme: 'dark',
    stylePreset: 'natural',
    tone: 'friendly',
    density: 'minimal',
    language: 'en',
    context: `Flow Yoga Barcelona — Premium yoga studio in the Eixample district, serving Barcelona's international community since 2017.
Founded by London-trained yoga teacher Sophie James and wellness entrepreneur Raj Patel.
Classes in English: Vinyasa flow, Ashtanga, Yin, Restorative, Breathwork, meditation. All levels welcome.
Studio capacity: 20 students. Manduka PRO mats provided. Infrared heating panels.
Special programmes: 200h Teacher Training (offered twice yearly), corporate wellness packages, private sessions.
Membership: single class €22, 10-class pack €180, unlimited monthly €155. New student offer: 2 weeks unlimited €49.
Schedule: 7 classes/day Mon–Fri, 5 classes/day weekends. Online booking required.
4.9★ (478 reviews). Listed in Time Out Barcelona's Top 10 wellness spots 2023.
WhatsApp: +34 635 820 140`,
    whatsapp: '+34635820140',
  },

  {
    id: 'notaria-prado',
    name: 'Notaría Prado',
    tagline: 'Notaría en el centro de Madrid desde 1992',
    location: 'Madrid',
    vertical: 'lawyer',
    model: 'gpt-4o',
    siteTheme: 'light',
    stylePreset: 'clasico',
    tone: 'formal',
    density: 'full',
    language: 'es',
    context: `Notaría Prado — Notaría situada en el Paseo del Prado de Madrid. Notario titular: D. Fernando Prado Villanueva (notario nº 312 del Colegio Notarial de Madrid, en ejercicio desde 1992).
Servicios: compraventa de inmuebles, hipotecas y cancelaciones, constitución de sociedades y modificaciones estatutarias, testamentos y herencias, poderes notariales, actas notariales, capitulaciones matrimoniales, escrituras de donación.
Atención personalizada en castellano, inglés y francés. Especialistas en operaciones con no residentes e inversores extranjeros en España.
Honorarios conforme al Arancel notarial oficial. Sin costes ocultos. Presupuesto previo siempre disponible.
Horario: L–V 9:00–14:00 y 16:00–19:00. Cita previa imprescindible.
Tel: +34 914 290 300. Fax: +34 914 290 301. info@notariaprado.es`,
  },

  // ── Gemini 2.5 Flash demos ────────────────────────────────────────────────────

  {
    id: 'pizzeria-verace',
    name: 'Pizzería da Verace',
    tagline: 'Pizza napolitana auténtica en Alicante',
    location: 'Alicante',
    vertical: 'restaurant',
    model: 'gemini-2.5-flash',
    siteTheme: 'dark',
    stylePreset: 'mediterraneo',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    context: `Pizzería da Verace — Pizzería napolitana auténtica en el Puerto de Alicante, abierta en 2021.
Pizzaiolo: Salvatore Esposito, napolitano, formado en la Scuola Pizzaioli de Nápoles. Certificado Verace Pizza Napoletana (VPN).
Masa: fermentación de 48 horas, harina tipo 00 Caputo, amasada a mano. Horno de leña a 450°C, cocción en 90 segundos.
Ingredientes importados directamente de Nápoles: tomate San Marzano DOP, mozzarella di bufala campana DOP, aceite Sasso.
Carta de 18 pizzas. Margherita 12€, Marinara 10€, pizza del día desde 14€. Sin gluten disponible (masa separada).
También: antipasti italianos, tiramisú casero, cannoli sicilianos.
Capacidad 55 personas + terraza 20.
4.9★ (523 reseñas). Reservas WhatsApp +34 965 140 880`,
    whatsapp: '+34965140880',
    menuText: `Pizzas rojas (con tomate)
- Marinara (tomate, ajo, orégano, aceite) 10€
- Margherita (tomate, mozzarella fior di latte, albahaca) 12€
- Napolitana (tomate, mozzarella, anchoas, alcaparras) 14€
- Diavola (tomate, mozzarella, salami picante) 14€
- 4 Estaciones 15€

Pizzas blancas (sin tomate)
- Bufala (mozzarella di bufala, tomate cherry, rúcula) 16€
- Trufa (mozzarella, crema de trufa, parmesano) 18€

Postres
- Tiramisú casero 6€
- Cannolo siciliano 5€`,
  },

  {
    id: 'le-petit-paris',
    name: 'Le Petit Paris',
    tagline: 'Boulangerie & pâtisserie française à Palma',
    location: 'Palma de Mallorca',
    vertical: 'bar',
    model: 'gemini-2.5-flash',
    siteTheme: 'light',
    stylePreset: 'clasico',
    tone: 'friendly',
    density: 'minimal',
    language: 'fr',
    context: `Le Petit Paris — Boulangerie et pâtisserie française authentique au cœur de Palma de Majorque, fondée en 2018 par le boulanger parisien Antoine Moreau.
Formé à l'École Nationale Supérieure de la Pâtisserie de Paris et travaillé chez Pierre Hermé pendant 5 ans.
Produits: baguette tradition française (cuisson 6h00 et 13h00), croissants au beurre AOP, pain au chocolat, brioche feuilletée, tarte tatin, éclair au chocolat, mille-feuille, macarons.
Café de spécialité: expresso, cappuccino, café au lait. Thés Dammann Frères.
Clientèle: résidents français et internationaux de Majorque, touristes, hôtels de luxe (fournisseur officiel de 3 hôtels 5 étoiles).
Horaires: Ma–Di 7h30–14h00. Fermé le lundi.
Tel: +34 971 230 456. Instagram @lepetitparis.palma — 7.200 abonnés.
4.9★ (298 avis Google).`,
  },

  {
    id: 'crescendo-musica',
    name: 'Academia Crescendo',
    tagline: 'Escuela de música y artes escénicas en Alicante',
    location: 'Alicante',
    vertical: 'academy',
    model: 'gemini-2.5-flash',
    siteTheme: 'light',
    stylePreset: 'vibrante',
    tone: 'friendly',
    density: 'full',
    language: 'es',
    context: `Academia Crescendo — Escuela de música, danza y teatro en el barrio de Carolinas, Alicante. Fundada en 2014.
Directora: María José Sánchez, pianista titulada por el Conservatorio Superior de Música de Alicante.
Especialidades: piano, guitarra clásica y eléctrica, violín, canto moderno y lírico, producción musical (DAW), danza clásica y contemporánea, teatro musical.
Alumnos desde 3 años hasta adultos. Preparación para conservatorio, grados profesionales y exámenes Trinity College London.
Instalaciones: 8 aulas insonorizadas, estudio de grabación semiprofesional, sala de danza con espejo y barra, sala de teatro con aforo 60 personas.
260 alumnos matriculados. Audiciones públicas en Navidad, Semana Santa y fin de curso.
Precio: clase individual 45 min, 55€/mes. Grupos 45€/mes. Matrícula 35€.
4.9★ (178 reseñas). Tel: +34 965 230 780`,
  },
]
