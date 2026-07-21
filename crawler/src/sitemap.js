// Best-effort sitemap discovery. Returns a capped list of content URLs.
import { fetchText } from './fetcher.js'

const MAX_URLS = parseInt(process.env.SITEMAP_URLS || '40')

function locs(xml) {
  const out = []
  const re = /<loc>\s*([^<\s]+)\s*<\/loc>/gi
  let m
  while ((m = re.exec(xml))) out.push(m[1])
  return out
}

export async function sitemapUrls(origin) {
  const xml = await fetchText(`${origin}/sitemap.xml`)
  if (!xml) return []
  const entries = locs(xml)
  const pages = entries.filter(u => !/\.xml(\.gz)?$/i.test(u))
  if (pages.length) return pages.slice(0, MAX_URLS)

  // sitemap index -> pull a couple of child sitemaps
  const children = entries.filter(u => /\.xml$/i.test(u)).slice(0, 2)
  const collected = []
  for (const c of children) {
    const cx = await fetchText(c)
    if (cx) collected.push(...locs(cx).filter(u => !/\.xml(\.gz)?$/i.test(u)))
    if (collected.length >= MAX_URLS) break
  }
  return collected.slice(0, MAX_URLS)
}
