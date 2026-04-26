import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/resend'
import type { AuditResult, AuditCheck } from '../route'

const STATUS_ICON: Record<AuditCheck['status'], string> = {
  pass:    '✅',
  warning: '⚠️',
  fail:    '❌',
}

function scoreColor(score: number) {
  if (score >= 75) return '#16a34a'
  if (score >= 50) return '#d97706'
  return '#dc2626'
}

function scoreLabel(score: number) {
  if (score >= 75) return 'Perfil bien optimizado'
  if (score >= 50) return 'Margen de mejora'
  return 'Perfil incompleto'
}

function buildAuditEmail(email: string, data: AuditResult, appUrl: string): string {
  const color = scoreColor(data.score)
  const label = scoreLabel(data.score)

  const checksHtml = data.checks.map(c => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f1f5f9">
        <span style="font-size:15px;margin-right:8px">${STATUS_ICON[c.status]}</span>
        <span style="font-size:13px;font-weight:600;color:#374151">${c.label}</span>
      </td>
      <td style="padding:8px 0 8px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#6b7280;text-align:right">
        ${c.detail}
      </td>
    </tr>`).join('')

  const recsHtml = data.recommendations.map((r, i) => `
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="width:22px;height:22px;min-width:22px;border-radius:50%;background:#2563eb;color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;margin-top:1px">${i + 1}</div>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6">${r}</p>
    </div>`).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border:2px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:#0f172a;padding:28px 40px;text-align:center">
          <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.04em">
            yaweb<span style="color:#60a5fa">.ai</span>
          </span>
        </td></tr>

        <!-- Score hero -->
        <tr><td style="padding:36px 40px 28px;text-align:center;border-bottom:2px solid #f1f5f9">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">
            Análisis de Google Business Profile
          </p>
          <h1 style="margin:0 0 4px;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.03em">
            ${data.businessName}
          </h1>
          <p style="margin:0 0 28px;font-size:13px;color:#6b7280">${data.address}</p>

          <div style="display:inline-block;width:90px;height:90px;border-radius:50%;border:6px solid ${color};text-align:center;vertical-align:middle;padding-top:18px;box-sizing:border-box">
            <div style="font-size:28px;font-weight:900;color:${color};line-height:1">${data.score}</div>
            <div style="font-size:11px;color:#9ca3af;font-weight:600">/100</div>
          </div>

          <p style="margin:16px 0 0;font-size:14px;font-weight:700;color:${color}">${label}</p>
        </td></tr>

        <!-- Checks table -->
        <tr><td style="padding:28px 40px;border-bottom:2px solid #f1f5f9">
          <p style="margin:0 0 16px;font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:0.07em">
            Detalle del análisis (8 puntos)
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${checksHtml}
          </table>
        </td></tr>

        <!-- Recommendations -->
        <tr><td style="padding:28px 40px;border-bottom:2px solid #f1f5f9;background:#f8fafc">
          <p style="margin:0 0 16px;font-size:12px;font-weight:800;color:#374151;text-transform:uppercase;letter-spacing:0.07em">
            💡 Top 3 recomendaciones
          </p>
          ${recsHtml}
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:28px 40px">
          <p style="margin:0 0 6px;font-size:15px;font-weight:800;color:#0f172a">
            ¿Quieres solucionar todo esto de golpe?
          </p>
          <p style="margin:0 0 20px;font-size:13px;color:#6b7280;line-height:1.6">
            Una web profesional en yaweb.ai ya incluye todos los elementos que te faltan: página propia, contacto directo, horarios y SEO local. Lista en 60 segundos.
          </p>
          <a href="${appUrl}?google_url=${encodeURIComponent('')}"
             style="display:inline-block;padding:13px 24px;background:#2563eb;color:#fff;font-size:14px;font-weight:700;text-decoration:none">
            Genera tu web gratis →
          </a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 40px;border-top:1px solid #f1f5f9;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">
            yaweb.ai · Webs para negocios locales con IA ·
            <a href="${appUrl}" style="color:#2563eb;text-decoration:none">yaweb.ai</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const { email, auditData } = await req.json() as { email: string; auditData: AuditResult }
    if (!email || !auditData) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'

    await sendEmail({
      to: email,
      subject: `Informe de Google Business: ${auditData.businessName} — ${auditData.score}/100`,
      html: buildAuditEmail(email, auditData, appUrl),
      text: `Análisis de Google Business Profile para ${auditData.businessName}\n\nPuntuación: ${auditData.score}/100\n\nRecomendaciones:\n${auditData.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}\n\nGenera tu web en ${appUrl}`,
    })

    // Optional: save as lead in Supabase (non-blocking — don't fail the request if this errors)
    try {
      const { createClient: createSupabaseClient } = await import('@supabase/supabase-js')
      const db = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      await db.from('leads').upsert({
        email,
        name: auditData.businessName,
        vertical: auditData.vertical,
        status: 'new',
        notes: `GBP audit score: ${auditData.score}/100. Source: landing audit tool.`,
      }, { onConflict: 'email' })
    } catch { /* non-critical */ }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('audit/send error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
