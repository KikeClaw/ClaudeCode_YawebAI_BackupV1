/**
 * Fetches and extracts readable text content from a business website.
 * Used to enrich AI site generation with real menu, services, prices, etc.
 * Fails silently — always returns null rather than throwing.
 */
export async function scrapeWebsiteContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YawebBot/1.0; +https://yaweb.ai)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es,en;q=0.9',
      },
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html')) return null

    const html = await res.text()

    // Strip scripts, styles, comments, then collapse tags → spaces
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ' ')
      // Decode common HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&euro;/g, '€')
      // Collapse whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (!text || text.length < 100) return null

    // Limit to 8 000 chars — enough for a full menu + services page
    return text.slice(0, 8000)
  } catch {
    // Timeout, CORS, DNS failure, etc. — skip silently
    return null
  }
}
