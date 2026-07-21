import { load } from 'cheerio'

export function parsePage(url, html) {
  const $ = load(html)

  // Remove noise
  $('script, style, noscript, nav, footer, header, aside, [aria-hidden=true]').remove()

  const title = ($('title').text() || $('h1').first().text()).trim().slice(0, 200)

  const description = (
    $('meta[name=description]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('p').first().text()
  ).trim().slice(0, 500)

  const body = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)

  const lang = $('html').attr('lang') || 'en'

  const outlinks = []
  $('a[href]').each((_, el) => {
    try {
      const href = new URL($(el).attr('href'), url).href
      if (href.startsWith('http')) outlinks.push(href)
    } catch {}
  })

  const domain = new URL(url).hostname.replace(/^www\./, '')
  const id = domain.replace(/[^a-zA-Z0-9_-]/g, '_')

  return {
    id,
    url,
    domain,
    title: title || domain,
    description,
    body,
    lang,
    outlinks: [...new Set(outlinks)].slice(0, 50),
    crawledAt: new Date().toISOString(),
  }
}
