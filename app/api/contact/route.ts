import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, string>

    const to      = (body._to   ?? '').trim()
    const site    = (body._site ?? 'tu web').trim()
    const replyTo = (body.email ?? body.correo ?? '').trim()

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Destino no configurado' }, { status: 400 })
    }

    // All visible fields (skip _ prefixed internal ones)
    const rows = Object.entries(body)
      .filter(([k, v]) => !k.startsWith('_') && String(v).trim())
      .map(([k, v]) => `
        <tr>
          <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#6b7280;
                     text-transform:capitalize;white-space:nowrap;
                     border-bottom:1px solid #f3f4f6;width:140px">${esc(k)}</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;
                     border-bottom:1px solid #f3f4f6;white-space:pre-wrap">${esc(v)}</td>
        </tr>`)
      .join('')

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;background:#fff;
              border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
    <div style="background:#2563eb;padding:24px 32px">
      <p style="margin:0;font-size:11px;font-weight:700;color:rgba(255,255,255,.7);
                text-transform:uppercase;letter-spacing:.1em">Nuevo mensaje de contacto</p>
      <h1 style="margin:6px 0 0;font-size:20px;font-weight:700;color:#fff">${esc(site)}</h1>
    </div>
    <table style="width:100%;border-collapse:collapse">${rows}</table>
    <div style="padding:18px 32px;background:#f9fafb;border-top:1px solid #f3f4f6">
      <p style="margin:0;font-size:11px;color:#9ca3af">
        Mensaje recibido desde tu web en
        <a href="https://yaweb.ai" style="color:#2563eb;text-decoration:none">yaweb.ai</a>
      </p>
    </div>
  </div>
</body></html>`

    const fromName  = process.env.RESEND_FROM_NAME  || 'yaweb.ai'
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yaweb.ai'

    await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      ...(replyTo ? { replyTo } : {}),
      subject: `Nuevo mensaje de contacto — ${site}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
