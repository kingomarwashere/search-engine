// Minimal, polite robots.txt handling. Caches one ruleset per host.
import { fetchText } from './fetcher.js'

const UA = 'searchbot'
const cache = new Map() // host -> { disallow: string[] }

function parse(txt) {
  const disallow = []
  let apply = false
  for (let raw of txt.split('\n')) {
    const line = raw.replace(/#.*/, '').trim()
    if (!line) continue
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim().toLowerCase()
    const val = line.slice(idx + 1).trim()
    if (key === 'user-agent') apply = val === '*' || val.toLowerCase().includes(UA)
    else if (key === 'disallow' && apply && val) disallow.push(val)
  }
  return { disallow }
}

async function load(origin) {
  try {
    const txt = await fetchText(`${origin}/robots.txt`)
    return txt ? parse(txt) : { disallow: [] }
  } catch {
    return { disallow: [] }
  }
}

export async function allowed(url) {
  const u = new URL(url)
  let rules = cache.get(u.host)
  if (!rules) {
    rules = await load(u.origin)
    cache.set(u.host, rules)
  }
  return !rules.disallow.some(d => u.pathname.startsWith(d))
}
