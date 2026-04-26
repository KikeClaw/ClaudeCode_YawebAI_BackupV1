import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TEMPLATE_PROMPTS: Record<string, string> = {
  intro: 'Es el PRIMER contacto. Preséntate brevemente como parte del equipo de yaweb.ai. Menciona que has creado una web demo personalizada para su negocio y que pueden verla en el link. Tono: amigable, directo, nada de vendedor agresivo. Máximo 4 frases. Termina con el link de la demo.',
  followup: 'SEGUIMIENTO — enviaste un primer mensaje hace unos días y no hubo respuesta. Sé muy breve (2-3 frases), sin presión, solo preguntas si tuvieron oportunidad de echarle un vistazo a la demo. Tono cercano, como un colega. Un emoji como máximo.',
  lastchance: 'ÚLTIMO mensaje — lo dices explícitamente. Breve y honesto: es tu último contacto, la demo seguirá disponible por si les interesa en el futuro. Sin presión, genuino. 2-3 frases.',
}

export async function POST(req: NextRequest) {
  const { business_name, vertical, demo_url, template = 'intro' } = await req.json()

  if (!business_name || !demo_url) {
    return NextResponse.json({ error: 'business_name y demo_url son requeridos' }, { status: 400 })
  }

  const instruction = TEMPLATE_PROMPTS[template] ?? TEMPLATE_PROMPTS.intro

  const prompt = `Escribe un mensaje de WhatsApp de prospección de ventas en primera persona, como si fueras un empleado de yaweb.ai.

NEGOCIO DESTINATARIO: ${business_name}${vertical && vertical !== 'generic' ? ` (${vertical})` : ''}
URL DE LA DEMO: ${demo_url}

INSTRUCCIONES ESPECÍFICAS: ${instruction}

REGLAS ABSOLUTAS:
- Solo texto plano, CERO markdown, CERO asteriscos, CERO guiones de lista
- Menciona el nombre del negocio de forma natural
- Incluye el link de la demo tal cual (sin acortarlo ni modificarlo)
- Español de España, tuteo
- Máximo 4 frases en total
- Es para WhatsApp: tono conversacional, no un email formal

Escribe ÚNICAMENTE el mensaje, nada más.`

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  })

  const message = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
  return NextResponse.json({ message })
}
