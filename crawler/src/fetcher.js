import { fetch } from 'undici'

const TIMEOUT_MS = 8000
const MAX_BODY_BYTES = 500_000

const HEADERS = {
  'User-Agent': 'SearchBot/1.0 (compatible; +https://search.theradicalparty.com/bot)',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en',
}

export async function fetchPage(domain) {
  const urls = [`https://${domain}`, `http://${domain}`]
  for (const url of urls) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      const res = await fetch(url, {
        headers: HEADERS,
        signal: controller.signal,
        maxRedirections: 3,
      })
      clearTimeout(timer)

      if (!res.ok) continue
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('html')) continue

      // Read up to MAX_BODY_BYTES
      const reader = res.body.getReader()
      const chunks = []
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        total += value.length
        if (total >= MAX_BODY_BYTES) { reader.cancel(); break }
      }
      const html = Buffer.concat(chunks).toString('utf8')
      return { url, html, status: res.status }
    } catch {
      // try next URL
    }
  }
  return null
}
