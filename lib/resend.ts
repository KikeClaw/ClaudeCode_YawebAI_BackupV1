import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string
  subject: string
  html: string
  text?: string
  replyTo?: string
}) {
  const { data, error } = await resend.emails.send({
    from: `${process.env.RESEND_FROM_NAME || 'yaweb.ai'} <${process.env.RESEND_FROM_EMAIL || 'hola@yaweb.ai'}>`,
    to,
    subject,
    html,
    text,
    replyTo,
  })
  if (error) throw error
  return data
}

export async function sendBulkEmails(emails: Array<{ to: string; subject: string; html: string; text?: string }>) {
  const results = []
  for (const email of emails) {
    try {
      const result = await sendEmail(email)
      results.push({ success: true, id: result?.id, to: email.to })
      await new Promise(r => setTimeout(r, 200))
    } catch (err) {
      results.push({ success: false, error: String(err), to: email.to })
    }
  }
  return results
}
