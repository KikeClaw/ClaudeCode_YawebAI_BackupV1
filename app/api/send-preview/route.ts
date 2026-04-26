import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { email, demoUrl, businessName } = await req.json()
    if (!email || !demoUrl) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const name = businessName || 'tu negocio'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yaweb.ai'

    await resend.emails.send({
      from: 'yaweb.ai <hola@yaweb.ai>',
      to: email,
      subject: `✅ Tu web de ${name} ya está lista — mírala aquí`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:32px 40px;text-align:center">
          <div style="display:inline-flex;align-items:center;gap:8px">
            <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.2);display:inline-block;text-align:center;line-height:28px;font-size:12px;font-weight:900;color:#fff">ya</div>
            <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.03em">yaweb<span style="color:#c4b5fd">.ai</span></span>
          </div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.03em">
            ¡Tu web está lista! 🎉
          </h1>
          <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6">
            Hemos generado una web profesional para <strong style="color:#0f172a">${name}</strong> con inteligencia artificial. Échale un vistazo:
          </p>
          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
            <tr><td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:12px">
              <a href="${demoUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#fff;text-decoration:none">
                Ver la demo de mi web →
              </a>
            </td></tr>
          </table>
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8">O copia este enlace en tu navegador:</p>
          <p style="margin:0 0 28px;font-size:12px;color:#7c3aed;word-break:break-all">${demoUrl}</p>
          <!-- Features -->
          <div style="background:#f8fafc;border-radius:12px;padding:20px 24px;margin-bottom:28px">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#0f172a">¿Qué incluye tu web?</p>
            ${['Diseño profesional y único para tu negocio', 'Adaptada a móvil, tablet y ordenador', 'Horarios, mapa y formulario de contacto', 'Galería de fotos y reseñas de Google', 'Botón de WhatsApp y llamada directa'].map(f => `<p style="margin:0 0 6px;font-size:13px;color:#475569">✓ ${f}</p>`).join('')}
          </div>
          <!-- Activate -->
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px">
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#0f172a">¿Te gusta? Actívala por solo 99€/año</p>
            <p style="margin:0 0 12px;font-size:13px;color:#64748b">Sin permanencia. SSL incluido. Lista en 24h en tu dominio.</p>
            <a href="mailto:hola@yaweb.ai?subject=Quiero activar mi web&body=Hola, quiero activar la web de ${encodeURIComponent(name)}. La demo está en ${demoUrl}" style="font-size:13px;color:#7c3aed;font-weight:600">Escríbenos para activarla →</a>
          </div>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center">
          <p style="margin:0;font-size:11px;color:#94a3b8">
            yaweb.ai · Webs profesionales para negocios locales<br>
            <a href="${appUrl}" style="color:#7c3aed;text-decoration:none">yaweb.ai</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('send-preview error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
