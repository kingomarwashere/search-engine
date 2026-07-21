import { load } from 'cheerio'

const BODY_CHARS = parseInt(process.env.BODY_CHARS || '2500') // keep docs small (disk-bound VM)

// Approximate registrable domain (eTLD+1) without a full public-suffix list.
const MULTI_TLD = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'co.jp', 'com.br', 'co.za', 'com.sg', 'com.hk', 'co.in', 'co.kr',
])
export function regDomain(hostname) {
  const host = hostname.replace(/^www\./, '')
  const p = host.split('.')
  if (p.length <= 2) return host
  const last2 = p.slice(-2).join('.')
  return MULTI_TLD.has(last2) ? p.slice(-3).join('.') : last2
}

// Stable per-URL id (FNV-1a) — must be per URL, not per domain, or pages overwrite each other.
function hashId(s) {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  return 'u' + h.toString(36) + s.length.toString(36)
}

export function parsePage(url, html) {
  const $ = load(html)
  $('script, style, noscript, nav, footer, header, aside, [aria-hidden=true]').remove()

  const title = ($('title').text() || $('h1').first().text()).trim().slice(0, 200)
  const description = (
    $('meta[name=description]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text()
  ).trim().slice(0, 500)
  const body = $('body').text().replace(/\s+/g, ' ').trim().slice(0, BODY_CHARS)
  const lang = ($('html').attr('lang') || 'en').slice(0, 8)

  const pageDomain = regDomain(new URL(url).hostname)

  const links = []
  const seen = new Set()
  $('a[href]').each((_, el) => {
    try {
      const href = new URL($(el).attr('href'), url)
      if (!/^https?:$/.test(href.protocol)) return
      href.hash = ''
      const clean = href.href
      if (seen.has(clean)) return
      seen.add(clean)
      const d = regDomain(href.hostname)
      links.push({ url: clean, domain: d, sameDomain: d === pageDomain })
    } catch { /* skip bad href */ }
  })

  return {
    id: hashId(url),
    url,
    domain: pageDomain,
    title: title || pageDomain,
    description,
    body,
    lang,
    links: links.slice(0, 150),
    crawledAt: new Date().toISOString(),
  }
}
