import type { MetadataRoute } from 'next'
import { getClients } from '@/lib/db/clients'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yaweb.ai'
  const clients = await getClients().catch(() => [])

  const demos = clients
    .filter(c => c.status === 'active')
    .map(c => ({
      url: `${base}/demo/${c.slug}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    ...demos,
  ]
}
