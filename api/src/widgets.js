// widgets.js — extra instant-answer widgets for RADICAL_SEARCH.
// Four packs bolted onto the aviation/weather/time engine in instant.js:
//   • dev tools  — epoch, base64, url, hash, uuid, password, colour, http, cidr, dns, whois
//   • nerd data  — earthquakes, ISS, rocket launches, moon phase, aurora/Kp, sunrise, surf
//   • rich cards — movies/TV (TMDB), Sydney transit departures (TfNSW)
//   • markets    — stocks (Yahoo), crypto (CoinGecko), sports (TheSportsDB)
//
// EVERY parser cheaply intent-checks the raw query string first and returns null
// instantly when it doesn't match, so running them all in parallel on every
// search costs nothing unless the query is actually for that widget. Like the
// rest of the engine, all of this is best-effort and defensively timed out — a
// search must never hang or fail because an enrichment did.

import crypto from 'node:crypto'

const UA = 'RadicalSearch/1.0 (+https://search.theradicalparty.com)'
const TMDB_KEY = process.env.TMDB_API_KEY
const TFNSW_KEY = process.env.TFNSW_API_KEY

async function J(url, { timeout = 4500, headers = {} } = {}) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(timeout) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

// Shared Nominatim geocode (Open-Meteo's own geocoder is unreachable from the box).
async function geocode(place) {
  const g = await J(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=5&addressdetails=1&accept-language=en`, { timeout: 4000 })
  if (!Array.isArray(g) || !g.length) return null
  const best = g.slice().sort((a, b) => (b.importance || 0) - (a.importance || 0))[0]
  if (!best?.lat || !best?.lon) return null
  const ad = best.address || {}
  const city = ad.city || ad.town || ad.village || ad.municipality || ad.county || (best.display_name || place).split(',')[0].trim()
  return { lat: +best.lat, lon: +best.lon, label: [city, ad.country].filter(Boolean).join(', ') }
}

// ═══════════════════════════ DEV TOOLS ═══════════════════════════
const HTTP_STATUS = {
  100:'Continue',101:'Switching Protocols',200:'OK',201:'Created',202:'Accepted',204:'No Content',
  206:'Partial Content',301:'Moved Permanently',302:'Found',303:'See Other',304:'Not Modified',
  307:'Temporary Redirect',308:'Permanent Redirect',400:'Bad Request',401:'Unauthorized',
  402:'Payment Required',403:'Forbidden',404:'Not Found',405:'Method Not Allowed',406:'Not Acceptable',
  408:'Request Timeout',409:'Conflict',410:'Gone',418:"I'm a teapot",422:'Unprocessable Entity',
  425:'Too Early',429:'Too Many Requests',451:'Unavailable For Legal Reasons',500:'Internal Server Error',
  501:'Not Implemented',502:'Bad Gateway',503:'Service Unavailable',504:'Gateway Timeout',511:'Network Authentication Required',
}
function devTool(q) {
  const s = q.trim()
  const low = s.toLowerCase()
  let m

  // Unix epoch ↔ human date
  if ((m = low.match(/^(?:epoch|unix(?:\s*time(?:stamp)?)?|timestamp)\s+(\d{9,13})$/)) || (m = s.match(/^(\d{10,13})\s+(?:to|in|as)\s+(?:date|time|human|iso)$/i))) {
    let n = parseInt(m[1]); if (String(m[1]).length <= 11) n *= 1000
    const d = new Date(n); if (isNaN(d)) return null
    return { kind: 'epoch', label: 'Unix timestamp', main: d.toUTCString(), sub: `${Math.floor(n/1000)} · ${d.toISOString()}` }
  }
  if (/^(?:current\s+)?(?:unix\s*time|unix\s*timestamp|epoch(?:\s+now)?|timestamp\s+now)$/.test(low)) {
    const n = Date.now()
    return { kind: 'epoch', label: 'Unix timestamp (now)', main: String(Math.floor(n/1000)), sub: new Date(n).toUTCString() }
  }

  // Base64
  if ((m = s.match(/^base64\s+(encode|decode)\s+([\s\S]+)$/i)) || (m = s.match(/^(?:(decode)\s+base64|base64\s*(encode))\s+([\s\S]+)$/i))) {
    const dir = (m[1] || m[2] || '').toLowerCase(); const val = (m[3] ?? m[2])
    const payload = m[3] != null ? m[3] : m[2]
    try {
      if (dir === 'decode') return { kind: 'base64', label: 'Base64 decode', main: Buffer.from(payload, 'base64').toString('utf8'), sub: payload }
      return { kind: 'base64', label: 'Base64 encode', main: Buffer.from(payload, 'utf8').toString('base64'), sub: payload }
    } catch { return null }
  }
  // URL encode/decode
  if ((m = s.match(/^url\s*(encode|decode)\s+([\s\S]+)$/i))) {
    try {
      const out = m[1].toLowerCase() === 'decode' ? decodeURIComponent(m[2]) : encodeURIComponent(m[2])
      return { kind: 'url', label: `URL ${m[1].toLowerCase()}`, main: out, sub: m[2] }
    } catch { return null }
  }
  // Hashes
  if ((m = s.match(/^(md5|sha1|sha256|sha512)\s+(?:hash\s+|of\s+)?([\s\S]+)$/i))) {
    const algo = m[1].toLowerCase()
    const hex = crypto.createHash(algo).update(m[2], 'utf8').digest('hex')
    return { kind: 'hash', label: `${algo.toUpperCase()} hash`, main: hex, sub: m[2], mono: true }
  }
  // UUID
  if (/^(?:generate\s+|random\s+|new\s+)?(?:uuid|guid)(?:\s*v?4)?$/.test(low)) {
    return { kind: 'uuid', label: 'UUID v4', main: crypto.randomUUID(), sub: 'random · click to regenerate on refresh', mono: true }
  }
  // Password generator
  if ((m = low.match(/^(?:generate\s+|random\s+)?(?:secure\s+)?password(?:\s+generator)?(?:\s+(\d{1,3}))?$/))) {
    const len = Math.min(64, Math.max(8, parseInt(m[1] || '20')))
    const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+'
    const bytes = crypto.randomBytes(len); let out = ''
    for (let i = 0; i < len; i++) out += alpha[bytes[i] % alpha.length]
    return { kind: 'password', label: `Password (${len} chars)`, main: out, sub: 'cryptographically random', mono: true }
  }
  // Colour hex → rgb
  if ((m = low.match(/^#?([0-9a-f]{6})\s+(?:to|in|as)\s+rgb$/))) {
    const h = m[1]; const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
    return { kind: 'color', label: 'Colour', main: `rgb(${r}, ${g}, ${b})`, sub: `#${h.toUpperCase()}`, swatch: `#${h}` }
  }
  // Colour rgb → hex
  if ((m = low.match(/^rgba?\(?\s*(\d{1,3})[, ]+(\d{1,3})[, ]+(\d{1,3})\s*\)?\s+(?:to|in|as)\s+hex$/))) {
    const r = +m[1], g = +m[2], b = +m[3]
    if (r>255||g>255||b>255) return null
    const hex = '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('').toUpperCase()
    return { kind: 'color', label: 'Colour', main: hex, sub: `rgb(${r}, ${g}, ${b})`, swatch: hex }
  }
  // HTTP status code
  if ((m = low.match(/^(?:http\s+|status\s+code\s+|http\s+status\s+)(\d{3})$/)) || (m = low.match(/^(\d{3})\s+(?:http\s+)?status(?:\s+code)?$/))) {
    const code = +m[1]; const text = HTTP_STATUS[code]
    if (!text) return null
    const cls = code<200?'Informational':code<300?'Success':code<400?'Redirection':code<500?'Client Error':'Server Error'
    return { kind: 'http', label: `HTTP ${code}`, main: text, sub: cls }
  }
  // CIDR / subnet calculator
  if ((m = s.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\/(\d{1,2})$/))) {
    const oct = [+m[1],+m[2],+m[3],+m[4]], prefix = +m[5]
    if (oct.some(o => o>255) || prefix>32) return null
    const ip = ((oct[0]<<24)>>>0) + (oct[1]<<16) + (oct[2]<<8) + oct[3]
    const mask = prefix === 0 ? 0 : (0xFFFFFFFF << (32 - prefix)) >>> 0
    const net = (ip & mask) >>> 0, bcast = (net | (~mask >>> 0)) >>> 0
    const fmt = n => [(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255].join('.')
    const hosts = prefix >= 31 ? (prefix === 32 ? 1 : 2) : (bcast - net - 1)
    return {
      kind: 'cidr', label: `Subnet /${prefix}`, main: `${fmt(net)} – ${fmt(bcast)}`,
      rows: [['Network', fmt(net)], ['Broadcast', fmt(bcast)], ['Netmask', fmt(mask)],
             ['Usable hosts', hosts.toLocaleString('en-US')],
             ['Host range', prefix<31 ? `${fmt(net+1)} – ${fmt(bcast-1)}` : fmt(net)]],
    }
  }
  return null
}

async function dnsLookup(q) {
  const m = q.trim().match(/^(?:dns|nslookup|dig|resolve)\s+(?:(a|aaaa|mx|txt|ns|cname)\s+)?([a-z0-9][a-z0-9.-]*\.[a-z]{2,})$/i)
  if (!m) return null
  const type = (m[1] || 'A').toUpperCase(), host = m[2].toLowerCase()
  const d = await J(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`, { headers: { accept: 'application/dns-json' }, timeout: 4000 })
  const ans = (d?.Answer || []).map(a => a.data).filter(Boolean)
  if (!ans.length) return null
  return { host, type, records: ans.slice(0, 8) }
}

async function whois(q) {
  const m = q.trim().match(/^(?:whois|rdap|domain\s+info)\s+([a-z0-9][a-z0-9.-]*\.[a-z]{2,})$/i)
  if (!m) return null
  const domain = m[1].toLowerCase()
  const d = await J(`https://rdap.org/domain/${encodeURIComponent(domain)}`, { timeout: 5000 })
  if (!d || !d.ldhName) return null
  const ev = Object.fromEntries((d.events || []).map(e => [e.eventAction, e.eventDate]))
  const registrar = (d.entities || []).find(e => (e.roles || []).includes('registrar'))
  const regName = registrar?.vcardArray?.[1]?.find(x => x[0] === 'fn')?.[3] || registrar?.handle || ''
  const fmtD = s => s ? String(s).slice(0, 10) : null
  return {
    domain: d.ldhName.toLowerCase(), registrar: regName,
    created: fmtD(ev.registration), expires: fmtD(ev.expiration), updated: fmtD(ev['last changed']),
    status: (d.status || []).slice(0, 4).join(', '),
    ns: (d.nameservers || []).map(n => n.ldhName?.toLowerCase()).filter(Boolean).slice(0, 6),
  }
}

// ═══════════════════════════ NERD DATA ═══════════════════════════
async function earthquakes(q) {
  const s = q.trim().toLowerCase()
  if (!/\bearthquakes?\b|\bseismic\b|\bquakes?\b/.test(s)) return null
  const big = /\b(big|major|significant|strong|large)\b/.test(s)
  const feed = big ? 'significant_week' : '2.5_day'
  const d = await J(`https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feed}.geojson`, { timeout: 5000 })
  const feats = d?.features
  if (!Array.isArray(feats) || !feats.length) return null
  const list = feats.slice().sort((a,b) => (b.properties?.time||0)-(a.properties?.time||0)).slice(0, 6).map(f => ({
    mag: f.properties?.mag, place: f.properties?.place || '—', time: f.properties?.time || 0,
    url: f.properties?.url || '', depth: f.geometry?.coordinates?.[2] ?? null,
  }))
  return { title: big ? 'Significant earthquakes (7 days)' : 'Recent earthquakes (M2.5+, 24h)', quakes: list }
}

async function issLocation(q) {
  const s = q.trim().toLowerCase()
  if (!/\b(iss|international space station|space station)\b/.test(s)) return null
  if (!/\b(iss|where|now|location|position|pass|overhead|space station)\b/.test(s)) return null
  const d = await J('https://api.wheretheiss.at/v1/satellites/25544', { timeout: 4000 })
  if (!d || d.latitude == null) return null
  // Reverse-geocode the sub-satellite point to something human ("over the Pacific").
  const rev = await J(`https://nominatim.openstreetmap.org/reverse?lat=${d.latitude}&lon=${d.longitude}&format=json&zoom=3&accept-language=en`, { timeout: 3500 })
  const over = rev?.address?.country || (rev?.display_name || '').split(',').pop()?.trim() || 'open ocean'
  return {
    lat: +(+d.latitude).toFixed(2), lon: +(+d.longitude).toFixed(2),
    altKm: Math.round(d.altitude), speedKmh: Math.round(d.velocity), over,
  }
}

async function nextLaunch(q) {
  const s = q.trim().toLowerCase()
  if (!/\b(rocket|spacex|nasa|falcon|starship|launch(es)?|liftoff)\b/.test(s)) return null
  if (!/\b(next|upcoming|launch(es)?|liftoff|when)\b/.test(s)) return null
  const spacex = /\bspacex\b/.test(s)
  const url = `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=4&mode=list${spacex ? '&lsp__name=SpaceX' : ''}`
  const d = await J(url, { timeout: 6000 })
  const res = d?.results
  if (!Array.isArray(res) || !res.length) return null
  return {
    title: spacex ? 'Next SpaceX launches' : 'Upcoming rocket launches',
    launches: res.slice(0, 4).map(l => ({
      name: l.name || '—', provider: l.launch_service_provider?.name || '',
      net: l.net || l.window_start || '', pad: l.pad?.location?.name || l.pad?.name || '',
      status: l.status?.abbrev || '',
    })),
  }
}

function moonPhase(q) {
  const s = q.trim().toLowerCase()
  if (!/\bmoon\b/.test(s)) return null
  if (!/\b(phase|tonight|today|now|full|new|waxing|waning|crescent|gibbous|illumination)\b/.test(s)) return null
  const SYN = 29.530588853, KNOWN = Date.UTC(2000,0,6,18,14) / 86400000
  let p = ((Date.now()/86400000 - KNOWN) % SYN) / SYN; if (p < 0) p += 1
  const age = p * SYN
  const names = ['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent']
  const emojis = ['🌑','🌒','🌓','🌔','🌕','🌖','🌗','🌘']
  // 8 phases; the "quarter/full/new" names sit at segment centres.
  const idx = Math.round(p * 8) % 8
  const illum = Math.round((1 - Math.cos(2 * Math.PI * p)) / 2 * 100)
  return { name: names[idx], emoji: emojis[idx], illum, age: +age.toFixed(1) }
}

async function aurora(q) {
  const s = q.trim().toLowerCase()
  if (!/\b(aurora|northern lights|southern lights|kp[- ]?index|geomagnetic|solar storm)\b/.test(s)) return null
  const d = await J('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', { timeout: 5000 })
  if (!Array.isArray(d) || d.length < 2) return null
  const last = d[d.length - 1]
  // SWPC returns either an array-of-arrays (with a header row) or, currently, an
  // array of objects {time_tag, Kp, ...} — handle both shapes.
  const kp = parseFloat(Array.isArray(last) ? last[1] : (last?.Kp ?? last?.kp))
  if (isNaN(kp)) return null
  const activity = kp >= 7 ? 'Severe storm' : kp >= 5 ? 'Geomagnetic storm' : kp >= 4 ? 'Active' : kp >= 3 ? 'Unsettled' : 'Quiet'
  const chance = kp >= 7 ? 'Aurora possible at mid-latitudes' : kp >= 5 ? 'Aurora likely at high latitudes' : kp >= 4 ? 'Aurora near the poles' : 'Aurora only at very high latitudes'
  return { kp: +kp.toFixed(2), activity, chance, obs: Array.isArray(last) ? last[0] : (last?.time_tag || '') }
}

async function sunTimes(q) {
  const s = q.trim().toLowerCase()
  const m = s.match(/\b(sunrise|sunset|golden hour|blue hour|first light|last light|daylight)\b(?:\s+(?:in|at|for)\s+(.+?))?\??$/)
  if (!m) return null
  const place = (m[2] || '').trim()
  if (!place) return null
  const g = await geocode(place)
  if (!g) return null
  const d = await J(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&daily=sunrise,sunset,daylight_duration&timezone=auto`, { timeout: 4000 })
  const day = d?.daily
  if (!day?.sunrise?.[0]) return null
  const t = iso => (iso || '').slice(11, 16)
  const secs = day.daylight_duration?.[0]
  const dl = secs ? `${Math.floor(secs/3600)}h ${Math.round((secs%3600)/60)}m` : ''
  return { place: g.label, sunrise: t(day.sunrise[0]), sunset: t(day.sunset[0]), daylight: dl }
}

async function surf(q) {
  const s = q.trim().toLowerCase()
  const m = s.match(/\b(surf|swell|wave height|marine|sea (?:temp|state)|tide)\b(?:\s+(?:report|forecast))?(?:\s+(?:in|at|for)\s+|\s+)?(.+?)?\??$/)
  if (!m) return null
  let place = (m[2] || '').replace(/\b(surf|swell|report|forecast|marine|tide|wave height)\b/g, '').trim()
  if (!place) return null
  const g = await geocode(place)
  if (!g) return null
  const d = await J(`https://marine-api.open-meteo.com/v1/marine?latitude=${g.lat}&longitude=${g.lon}&current=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=auto`, { timeout: 4500 })
  const cur = d?.current
  if (!cur || cur.wave_height == null) return null
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  const compass = cur.wave_direction != null ? dirs[Math.round(cur.wave_direction/22.5)%16] : null
  return {
    place: g.label, waveHeight: cur.wave_height, wavePeriod: cur.wave_period,
    waveDir: compass, seaTemp: cur.sea_surface_temperature,
  }
}

// ═══════════════════════════ RICH CARDS ═══════════════════════════
async function movie(q) {
  if (!TMDB_KEY) return null
  const s = q.trim()
  if (!/\b(movie|film|tv show|tv series|series|cast of|imdb|runtime of|episodes?|directed by|starring)\b/i.test(s)) return null
  const title = s.replace(/\b(the\s+)?(movie|film|tv show|tv series|series|cast of|imdb rating|imdb|runtime of|runtime|episodes?|directed by|starring|about)\b/gi, ' ').replace(/\s+/g, ' ').trim()
  if (!title || title.length < 2) return null
  const sr = await J(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&include_adult=false`, { timeout: 5000 })
  const hit = (sr?.results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv')
  if (!hit) return null
  const kind = hit.media_type
  const det = await J(`https://api.themoviedb.org/3/${kind}/${hit.id}?api_key=${TMDB_KEY}`, { timeout: 5000 })
  const name = hit.title || hit.name
  const date = hit.release_date || hit.first_air_date || ''
  const runtime = det?.runtime || det?.episode_run_time?.[0] || null
  return {
    kind, title: name, year: date ? date.slice(0, 4) : '',
    rating: hit.vote_average ? +hit.vote_average.toFixed(1) : null,
    overview: hit.overview || '',
    poster: hit.poster_path ? `https://image.tmdb.org/t/p/w185${hit.poster_path}` : null,
    genres: (det?.genres || []).map(g => g.name).slice(0, 3),
    runtime: runtime ? `${runtime} min` : '',
    seasons: det?.number_of_seasons ? `${det.number_of_seasons} season${det.number_of_seasons>1?'s':''}` : '',
  }
}

async function transit(q) {
  if (!TFNSW_KEY) return null
  const s = q.trim().toLowerCase()
  const m = s.match(/\b(?:next\s+(?:train|bus|ferry|metro|light rail|tram)|(?:train|bus|ferry|metro)\s+departures?|departures?\s+(?:from|at)|when'?s?\s+the\s+next\s+(?:train|bus|ferry))\b\s*(?:from|at|to)?\s*(.+?)\??$/)
  if (!m || !m[1]) return null
  const stopName = m[1].replace(/\bstation\b/g, '').trim()
  if (!stopName) return null
  const H = { Authorization: `apikey ${TFNSW_KEY}` }
  const sf = await J(`https://api.transport.nsw.gov.au/v1/tp/stop_finder?outputFormat=rapidJSON&type_sf=any&name_sf=${encodeURIComponent(stopName)}&coordOutputFormat=EPSG:4326&TfNSWSF=true`, { headers: H, timeout: 5000 })
  // stop_finder returns suburbs, POIs and stops mixed; the actual station/stop is
  // marked type:'stop' (and usually isBest). A bare suburb id yields no departures.
  const locs = sf?.locations || []
  const loc = locs.find(l => l.type === 'stop') || locs.find(l => l.isBest && l.type !== 'suburb') || null
  if (!loc?.id) return null
  const dm = await J(`https://api.transport.nsw.gov.au/v1/tp/departure_mon?outputFormat=rapidJSON&coordOutputFormat=EPSG:4326&mode=direct&type_dm=stop&name_dm=${encodeURIComponent(loc.id)}&departureMonitorMacro=true&TfNSWDM=true&version=10.2.1.42`, { headers: H, timeout: 6000 })
  const events = dm?.stopEvents
  if (!Array.isArray(events) || !events.length) return null
  const now = Date.now()
  const deps = events.slice(0, 6).map(e => {
    const planned = e.departureTimePlanned, est = e.departureTimeEstimated || planned
    const mins = Math.round((new Date(est).getTime() - now) / 60000)
    const tr = e.transportation || {}
    return {
      route: tr.number || tr.disassembledName || '', dest: tr.destination?.name || '',
      when: mins <= 0 ? 'now' : `${mins} min`, time: (est || '').slice(11, 16),
      delayed: est !== planned,
    }
  }).filter(d => d.route || d.dest)
  if (!deps.length) return null
  return { stop: loc.disassembledName || loc.name || stopName, departures: deps }
}

// ═══════════════════════════ MARKETS ═══════════════════════════
async function stock(q) {
  const s = q.trim()
  const low = s.toLowerCase()
  let sym = null, term = null
  let m
  if ((m = s.match(/^\$([A-Za-z.]{1,7})$/))) sym = m[1].toUpperCase()
  else if (/\b(stock|share price|shares|ticker|nasdaq|nyse|asx|stock price)\b/.test(low)) {
    term = low.replace(/\b(stock price|stock|share price|shares|ticker|price|quote|nasdaq|nyse|the)\b/g, ' ').replace(/\s+/g, ' ').trim()
    if (/\basx\b/.test(low) && term) term = term.replace(/\basx\b/g, '').trim()
  } else return null
  if (!sym && !term) return null
  if (!sym) {
    const sr = await J(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(term)}&quotesCount=1&newsCount=0`, { timeout: 4500 })
    sym = sr?.quotes?.find(x => x.symbol)?.symbol
  }
  if (!sym) return null
  const ch = await J(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?range=1d&interval=1d`, { timeout: 5000 })
  const meta = ch?.chart?.result?.[0]?.meta
  if (!meta?.regularMarketPrice) return null
  const price = meta.regularMarketPrice, prev = meta.chartPreviousClose ?? meta.previousClose ?? price
  const chg = price - prev, pct = prev ? (chg / prev) * 100 : 0
  return {
    symbol: meta.symbol || sym, name: meta.longName || meta.shortName || '',
    price: +price.toFixed(2), currency: meta.currency || 'USD',
    change: +chg.toFixed(2), pct: +pct.toFixed(2), exchange: meta.fullExchangeName || meta.exchangeName || '',
    up: chg >= 0,
  }
}

const COIN = {
  bitcoin:'bitcoin', btc:'bitcoin', ethereum:'ethereum', eth:'ethereum', tether:'tether', usdt:'tether',
  bnb:'binancecoin', binancecoin:'binancecoin', solana:'solana', sol:'solana', xrp:'ripple', ripple:'ripple',
  usdc:'usd-coin', cardano:'cardano', ada:'cardano', dogecoin:'dogecoin', doge:'dogecoin', tron:'tron', trx:'tron',
  avalanche:'avalanche-2', avax:'avalanche-2', chainlink:'chainlink', link:'chainlink', polkadot:'polkadot', dot:'polkadot',
  polygon:'matic-network', matic:'matic-network', litecoin:'litecoin', ltc:'litecoin', shiba:'shiba-inu', shib:'shiba-inu',
  'bitcoin cash':'bitcoin-cash', bch:'bitcoin-cash', stellar:'stellar', xlm:'stellar', monero:'monero', xmr:'monero',
  cosmos:'cosmos', atom:'cosmos', uniswap:'uniswap', uni:'uniswap', near:'near', aptos:'aptos', apt:'aptos',
  filecoin:'filecoin', arbitrum:'arbitrum', arb:'arbitrum', optimism:'optimism', maker:'maker', mkr:'maker',
  pepe:'pepe', toncoin:'the-open-network', ton:'the-open-network', sui:'sui', hedera:'hedera-hashgraph',
}
async function crypto_(q) {
  const s = q.trim().toLowerCase()
  if (!/\b(price|worth|value|usd|aud|crypto|coin)\b/.test(s) && !/^(btc|eth|sol|xrp|doge|ada|bnb|ltc|bch|shib|pepe|ton|sui|avax|link|dot|matic|trx|xlm|xmr|atom|uni|near|apt|arb|mkr)$/.test(s)) return null
  let id = null, key = null
  for (const k of Object.keys(COIN)) {
    if (new RegExp(`\\b${k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`).test(s)) { id = COIN[k]; key = k; break }
  }
  if (!id) return null
  const d = await J(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd,aud&include_24hr_change=true`, { timeout: 5000 })
  const row = d?.[id]
  if (!row || row.usd == null) return null
  const pct = row.usd_24h_change ?? 0
  return {
    id, name: id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    usd: row.usd, aud: row.aud ?? null, pct: +(+pct).toFixed(2), up: pct >= 0,
  }
}

const LEAGUES = { afl:'4426', nrl:'4415', epl:'4328', 'premier league':'4328', 'a-league':'4356', aleague:'4356', nba:'4387', nfl:'4391', 'super rugby':'4551' }
async function sport(q) {
  const s = q.trim().toLowerCase()
  if (!/\b(scores?|ladder|table|fixtures?|results?|standings?|who won|next (?:game|match))\b/.test(s)) return null
  let id = null, name = null
  for (const k of Object.keys(LEAGUES)) if (s.includes(k)) { id = LEAGUES[k]; name = k.toUpperCase(); break }
  if (!id) return null
  const upcoming = /\b(next|upcoming|fixtures?|schedule)\b/.test(s)
  const ep = upcoming ? 'eventsnextleague' : 'eventspastleague'
  const d = await J(`https://www.thesportsdb.com/api/v1/json/3/${ep}.php?id=${id}`, { timeout: 6000 })
  const evs = d?.events
  if (!Array.isArray(evs) || !evs.length) return null
  return {
    league: name, upcoming,
    games: evs.slice(0, 5).map(e => ({
      home: e.strHomeTeam, away: e.strAwayTeam,
      hs: e.intHomeScore, as: e.intAwayScore,
      date: e.dateEvent || '', time: (e.strTime || '').slice(0, 5),
    })),
  }
}

// ═══════════════════════════ Dispatcher ═══════════════════════════
// Runs every extra parser in parallel; each is intent-gated so non-matching
// ones return null with zero network cost. Returns a widgets object to merge.
export async function extraWidgets(query) {
  const dev = devTool(query)  // sync, cheap
  const [dns, who, quake, iss, launch, aur, sun, srf, mov, tr, stk, cry, spt] = await Promise.all([
    dnsLookup(query), whois(query), earthquakes(query), issLocation(query), nextLaunch(query),
    aurora(query), sunTimes(query), surf(query), movie(query), transit(query),
    stock(query), crypto_(query), sport(query),
  ])
  const moon = moonPhase(query)
  const w = {}
  if (dev) w.dev = dev
  if (dns) w.dns = dns
  if (who) w.whois = who
  if (quake) w.quake = quake
  if (iss) w.iss = iss
  if (launch) w.launch = launch
  if (moon) w.moon = moon
  if (aur) w.aurora = aur
  if (sun) w.sun = sun
  if (srf) w.surf = srf
  if (mov) w.movie = mov
  if (tr) w.transit = tr
  if (stk) w.stock = stk
  if (cry) w.crypto = cry
  if (spt) w.sport = spt
  return w
}
