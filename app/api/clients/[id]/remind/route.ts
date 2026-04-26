import { NextRequest, NextResponse } from 'next/server'
import { getClientById } from '@/lib/db/clients'
import { sendEmail } from '@/lib/resend'

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

function buildRenewalEmail({
  businessName,
  siteUrl,
  expiresAt,
  daysLeft,
  plan,
  amount,
  appUrl,
}: {
  businessName: string
  siteUrl: string
  expiresAt: string
  daysLeft: number
  plan: string
  amount: number
  appUrl: string
}) {
  const isExpired  = daysLeft < 0
  const isUrgent   = daysLeft <= 7
  const headerBg   = isExpired ? '#991b1b' : isUrgent ? '#92400e' : '#1e3a5f'
  const accentColor = isExpired ? '#dc2626' : isUrgent ? '#d97706' : '#2563eb'

  const statusMsg = isExpired
    ? `Tu web lleva <strong>${Math.abs(daysLeft)} días caducada</strong> y no está visible para tus clientes.`
    : isUrgent
    ? `Tu web caduca en <strong>${daysLeft} día${daysLeft === 1 ? '' : 's'}</strong>. Renueva ahora para no perder visibilidad.`
    : `Tu web caduca el <strong>${fmtDate(expiresAt)}</strong>, en ${daysLeft} días.`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr><td style="background:${headerBg};padding:28px 40px;text-align:center">
          <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.04em">
            yaweb<span style="opacity:0.6">.ai</span>
          </span>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px 28px">

          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">
            ${isExpired ? 'Web caducada' : 'Recordatorio de renovación'}
          </p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.03em">
            ${isExpired ? '⚠️ Tu web ha caducado' : `${daysLeft <= 7 ? '⏰' : '📅'} Renueva tu web de ${businessName}`}
          </h1>

          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.65">
            Hola, te escribimos desde <strong>yaweb.ai</strong>.<br><br>
            ${statusMsg}
          </p>

          <!-- Web preview card -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 22px;margin-bottom:24px">
            <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em">Tu web</p>
            <p style="margin:0 0 8px;font-size:16px;font-weight:800;color:#0f172a">${businessName}</p>
            <a href="${siteUrl}" style="font-size:13px;color:${accentColor};font-weight:600;text-decoration:none">${siteUrl} →</a>
            <div style="display:flex;gap:20px;margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0">
              <div>
                <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase">Plan</p>
                <p style="margin:0;font-size:13px;font-weight:700;color:#374151">${plan === 'premium' ? 'Premium' : 'Basic'}</p>
              </div>
              <div>
                <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase">Precio renovación</p>
                <p style="margin:0;font-size:13px;font-weight:700;color:#374151">${amount}€/año</p>
              </div>
              <div>
                <p style="margin:0 0 2px;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase">Caduca</p>
                <p style="margin:0;font-size:13px;font-weight:700;color:${accentColor}">${fmtDate(expiresAt)}</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin-bottom:20px">
            <tr><td style="background:${accentColor};border-radius:10px">
              <a href="mailto:hola@yaweb.ai?subject=Renovar web ${encodeURIComponent(businessName)}&body=Hola, quiero renovar la web de ${encodeURIComponent(businessName)} por ${amount}€/año."
                 style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">
                Renovar por ${amount}€/año →
              </a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6">
            ¿Tienes alguna duda? Responde a este email o escríbenos directamente a
            <a href="mailto:hola@yaweb.ai" style="color:${accentColor}">hola@yaweb.ai</a>.
            Estaremos encantados de ayudarte.
          </p>

        </td></tr>

        <!-- What's included reminder -->
        <tr><td style="padding:0 40px 28px">
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:18px 22px">
            <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0369a1">¿Qué incluye tu renovación?</p>
            ${['Hosting y SSL incluido otro año', 'Subdominio yaweb.ai activo', 'Actualizaciones ilimitadas', 'Soporte directo por email'].map(f =>
              `<p style="margin:0 0 5px;font-size:13px;color:#0c4a6e">✓ ${f}</p>`
            ).join('')}
          </div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center">
          <p style="margin:0;font-size:11px;color:#9ca3af">
            yaweb.ai · Webs profesionales para negocios locales<br>
            <a href="${appUrl}" style="color:${accentColor};text-decoration:none">yaweb.ai</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const client = await getClientById(id)

    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    if (!client.email) return NextResponse.json({ error: 'Este cliente no tiene email guardado. Añádelo en Datos de contacto.' }, { status: 400 })
    if (!client.paid_at) return NextResponse.json({ error: 'Este cliente no tiene pago registrado.' }, { status: 400 })
    if (!client.expires_at) return NextResponse.json({ error: 'Este cliente no tiene fecha de caducidad.' }, { status: 400 })

    const appUrl   = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'
    const siteUrl  = `${appUrl}/demo/${client.slug}`
    const daysLeft = Math.ceil((new Date(client.expires_at).getTime() - Date.now()) / 86_400_000)
    const amount   = client.annual_amount || (client.plan === 'premium' ? 199 : 99)

    await sendEmail({
      to: client.email,
      subject: daysLeft < 0
        ? `⚠️ Tu web de ${client.name} ha caducado — Renueva por ${amount}€`
        : `📅 Tu web de ${client.name} caduca en ${daysLeft} días — Renueva por ${amount}€`,
      html: buildRenewalEmail({
        businessName: client.name,
        siteUrl,
        expiresAt: client.expires_at,
        daysLeft,
        plan: client.plan,
        amount,
        appUrl,
      }),
    })

    return NextResponse.json({ ok: true, sentTo: client.email })
  } catch (err) {
    console.error('remind error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
