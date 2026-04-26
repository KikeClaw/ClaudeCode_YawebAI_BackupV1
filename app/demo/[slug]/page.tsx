import { notFound } from 'next/navigation'
import { getClientBySlug } from '@/lib/db/clients'
import { markLeadDemoVisited } from '@/lib/db/leads'
import { SiteRenderer } from '@/components/site/SiteRenderer'
import type { HtmlContent, SiteData } from '@/types'
import { HtmlSiteFrame } from '@/components/site/HtmlSiteFrame'

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const client = await getClientBySlug(slug)
  if (!client?.site_content) notFound()

  await markLeadDemoVisited(slug)

  const content = Array.isArray(client.site_content)
    ? client.site_content[0]?.content
    : (client.site_content as { content: unknown })?.content

  if (!content) notFound()

  if ((content as HtmlContent)._type === 'html') {
    return (
      <HtmlSiteFrame
        html={(content as HtmlContent).html}
        isDemo={true}
        businessName={client.name}
        clientId={client.id}
      />
    )
  }

  return <SiteRenderer data={content as SiteData} isDemo={true} />
}
