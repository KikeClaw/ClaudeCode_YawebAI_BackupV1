const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_ORG = process.env.GITHUB_ORG || 'yaweb-ai'

export async function createRepo(slug: string, description: string): Promise<string | null> {
  if (!GITHUB_TOKEN) return null

  const res = await fetch(`https://api.github.com/orgs/${GITHUB_ORG}/repos`, {
    method: 'POST',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: slug,
      description,
      private: false,
      auto_init: true,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data.html_url
}

export async function pushSiteToRepo(slug: string, siteJson: string): Promise<boolean> {
  if (!GITHUB_TOKEN) return false

  const content = Buffer.from(siteJson).toString('base64')
  const res = await fetch(`https://api.github.com/repos/${GITHUB_ORG}/${slug}/contents/site.json`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Update site content',
      content,
    }),
  })
  return res.ok
}
