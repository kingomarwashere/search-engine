import { fetch } from 'undici'

const TIMEOUT_MS = 8000
const MAX_BODY_BYTES = 500_000

const HEADERS = {
  'User-Agent': 'SearchBot/1.0 (compatible; +https://search.theradicalparty.com/bot)',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'en',
}

// Accepts a bare domain (tries https then http) or a full URL (fetched as-is).
function candidates(target) {
  if (/^https?:\/\//i.test(target)) return [target]
  return [`https://${target}`, `http://${target}`]
}

export async function fetchPage(target) {
  for (const url of candidates(target)) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      const res = await fetch(url, { headers: HEADERS, signal: controller.signal, maxRedirections: 5 })
      clearTimeout(timer)

      if (!res.ok) continue
      const contentType = res.headers.get('content-type') ?? ''
      if (!contentType.includes('html')) { res.body?.cancel?.(); continue }

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
      return { url: res.url || url, html, status: res.status }
    } catch {
      // try next candidate
    }
  }
  return null
}

// Fetch plain text (robots.txt, sitemap.xml). Returns null on any failure.
export async function fetchText(target) {
  for (const url of candidates(target)) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      const res = await fetch(url, { headers: HEADERS, signal: controller.signal, maxRedirections: 5 })
      clearTimeout(timer)
      if (!res.ok) { res.body?.cancel?.(); continue }
      const txt = await res.text()
      return txt.slice(0, MAX_BODY_BYTES)
    } catch {
      // try next candidate
    }
  }
  return null
}
