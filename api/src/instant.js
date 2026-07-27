// instant.js — the "smart panel": instant answers, a Wikipedia knowledge panel,
// and AI query-understanding. Everything here is best-effort and defensively
// timed out: a search must NEVER hang or hard-fail because an enrichment did.

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const ANSWER_MODEL = process.env.ANSWER_MODEL || 'claude-haiku-4-5'
const UA = 'RadicalSearch/1.0 (+https://search.theradicalparty.com)'

// Small helper: fetch JSON with a timeout, never throws (returns null on any error).
async function getJson(url, { timeout = 4000, headers = {} } = {}) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(timeout) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

// ───────────────────────── Calculator ─────────────────────────
// Safe arithmetic: the expression is whitelisted to digits/operators only
// (no identifiers), so Function() can evaluate it without code-injection risk.
function parseCalc(q) {
  // "X% of Y" / "X percent of Y" → percentage
  const pm = q.trim().toLowerCase().replace(/,/g, '').match(/^(?:what(?:'s| is)?\s+(?:is\s+)?)?([\d.]+)\s*(?:%|percent)\s+of\s+([\d.]+)\??$/)
  if (pm) {
    const v = parseFloat(pm[1]) / 100 * parseFloat(pm[2])
    if (isFinite(v)) return { expression: q.trim(), result: (Math.round(v * 1e6) / 1e6).toLocaleString('en-US') }
  }
  let e = q.trim().toLowerCase()
    .replace(/^(calc(ulate)?|what(?:'s| is)?|whats|how much is|=)\s+/i, '')
    .replace(/\b(multiplied by|times)\b/g, '*').replace(/\b(divided by|over)\b/g, '/')
    .replace(/\bplus\b/g, '+').replace(/\b(minus|less)\b/g, '-')
    .replace(/[×✕]/g, '*').replace(/[÷]/g, '/').replace(/\bx\b/g, '*')
    .replace(/\^/g, '**').replace(/,/g, '').replace(/\s+/g, '')
  if (!e || e.length > 120) return null
  if (!/^[\d+\-*/%.()]+$/.test(e)) return null       // digits + operators only
  if (!/[\d]/.test(e) || !/[+\-*/%]/.test(e)) return null // must be an actual operation
  try {
    // eslint-disable-next-line no-new-func
    const val = Function(`"use strict"; return (${e})`)()
    if (typeof val !== 'number' || !isFinite(val)) return null
    const out = Math.round(val * 1e10) / 1e10
    return { expression: q.trim(), result: out.toLocaleString('en-US', { maximumFractionDigits: 10 }) }
  } catch {
    return null
  }
}

// ───────────────────────── Unit conversion ─────────────────────────
const UNITS = {
  // length → meters
  mm:['length',.001], cm:['length',.01], m:['length',1], km:['length',1000], meter:['length',1], metre:['length',1],
  meters:['length',1], metres:['length',1], kilometer:['length',1000], kilometre:['length',1000], kilometers:['length',1000],
  in:['length',.0254], inch:['length',.0254], inches:['length',.0254], ft:['length',.3048], foot:['length',.3048],
  feet:['length',.3048], yd:['length',.9144], yard:['length',.9144], yards:['length',.9144],
  mi:['length',1609.344], mile:['length',1609.344], miles:['length',1609.344], nmi:['length',1852],
  // mass → grams
  mg:['mass',.001], g:['mass',1], gram:['mass',1], grams:['mass',1], kg:['mass',1000], kilogram:['mass',1000],
  kilograms:['mass',1000], oz:['mass',28.3495], ounce:['mass',28.3495], ounces:['mass',28.3495],
  lb:['mass',453.592], lbs:['mass',453.592], pound:['mass',453.592], pounds:['mass',453.592],
  st:['mass',6350.29], stone:['mass',6350.29], ton:['mass',1e6], tonne:['mass',1e6], tonnes:['mass',1e6],
  // volume → liters
  ml:['volume',.001], l:['volume',1], liter:['volume',1], litre:['volume',1], liters:['volume',1], litres:['volume',1],
  gal:['volume',3.78541], gallon:['volume',3.78541], gallons:['volume',3.78541], qt:['volume',.946353],
  pt:['volume',.473176], cup:['volume',.236588], cups:['volume',.236588], floz:['volume',.0295735],
}
const TEMP = new Set(['c','f','k','celsius','fahrenheit','kelvin','°c','°f'])
function normTemp(u){ u=u.replace('°',''); return u[0] }
function parseUnit(q) {
  const m = q.trim().toLowerCase().replace(/,/g,'').match(/^([\d.]+)?\s*([a-z°]+)\s+(?:to|in|as|into)\s+([a-z°]+)\??$/i)
  if (!m) return null
  const n = m[1] ? parseFloat(m[1]) : 1
  let [from, to] = [m[2], m[3]]
  if (isNaN(n)) return null
  // Temperature
  if (TEMP.has(from) && TEMP.has(to)) {
    const f = normTemp(from), t = normTemp(to)
    let c = f==='c' ? n : f==='f' ? (n-32)*5/9 : n-273.15
    let out = t==='c' ? c : t==='f' ? c*9/5+32 : c+273.15
    out = Math.round(out*100)/100
    return { value:n, from, to, result: `${out}`, label:`${n}°${f.toUpperCase()} = ${out}°${t.toUpperCase()}` }
  }
  const a = UNITS[from], b = UNITS[to]
  if (!a || !b || a[0] !== b[0]) return null   // unknown or incompatible dimensions
  const out = n * a[1] / b[1]
  const r = Math.round(out*1e6)/1e6
  return { value:n, from, to, result:`${r.toLocaleString('en-US')}`, label:`${n.toLocaleString('en-US')} ${from} = ${r.toLocaleString('en-US')} ${to}` }
}

// ───────────────────────── Currency ─────────────────────────
const CUR = new Set(['usd','eur','gbp','aud','cad','jpy','cny','inr','nzd','chf','sgd','hkd','krw','brl','zar','mxn','sek','nok','dkk','rub','try','thb','idr','myr','php','aed','sar'])
let fxCache = null // { at, base, rates }
async function fxRates(base) {
  if (fxCache && fxCache.base === base && Date.now() - fxCache.at < 3_600_000) return fxCache.rates
  const d = await getJson(`https://open.er-api.com/v6/latest/${base}`, { timeout: 3000 })
  if (!d || d.result !== 'success' || !d.rates) return null
  fxCache = { at: Date.now(), base, rates: d.rates }
  return d.rates
}
async function parseCurrency(q) {
  const m = q.trim().toLowerCase().replace(/,/g,'').match(/^([\d.]+)?\s*([a-z]{3})\s+(?:to|in|as|into|=)\s+([a-z]{3})\??$/i)
  if (!m) return null
  const from = m[2].toLowerCase(), to = m[3].toLowerCase()
  if (!CUR.has(from) || !CUR.has(to)) return null
  const n = m[1] ? parseFloat(m[1]) : 1
  if (isNaN(n)) return null
  const rates = await fxRates(from.toUpperCase())
  if (!rates || !rates[to.toUpperCase()]) return null
  const out = n * rates[to.toUpperCase()]
  return {
    value:n, from:from.toUpperCase(), to:to.toUpperCase(),
    result: out.toLocaleString('en-US', { maximumFractionDigits: 2 }),
    label: `${n.toLocaleString('en-US')} ${from.toUpperCase()} = ${out.toLocaleString('en-US',{maximumFractionDigits:2})} ${to.toUpperCase()}`,
    asOf: new Date().toISOString(),
  }
}

// ───────────────────────── Time / timezone ─────────────────────────
// Curated place → IANA zone map for the instant (no-AI) path. Multi-zone
// countries return several representative clocks. The AI classifier resolves
// anything not listed here.
const TZ = {
  'usa':[['New York','America/New_York'],['Chicago','America/Chicago'],['Denver','America/Denver'],['Los Angeles','America/Los_Angeles']],
  'united states':[['New York','America/New_York'],['Chicago','America/Chicago'],['Denver','America/Denver'],['Los Angeles','America/Los_Angeles']],
  'america':[['New York','America/New_York'],['Chicago','America/Chicago'],['Denver','America/Denver'],['Los Angeles','America/Los_Angeles']],
  'australia':[['Sydney','Australia/Sydney'],['Adelaide','Australia/Adelaide'],['Perth','Australia/Perth']],
  'uk':[['London','Europe/London']], 'united kingdom':[['London','Europe/London']], 'england':[['London','Europe/London']],
  'russia':[['Moscow','Europe/Moscow'],['Novosibirsk','Asia/Novosibirsk'],['Vladivostok','Asia/Vladivostok']],
  'canada':[['Toronto','America/Toronto'],['Winnipeg','America/Winnipeg'],['Vancouver','America/Vancouver']],
  'london':[['London','Europe/London']], 'paris':[['Paris','Europe/Paris']], 'berlin':[['Berlin','Europe/Berlin']],
  'madrid':[['Madrid','Europe/Madrid']], 'rome':[['Rome','Europe/Rome']], 'moscow':[['Moscow','Europe/Moscow']],
  'dubai':[['Dubai','Asia/Dubai']], 'tokyo':[['Tokyo','Asia/Tokyo']], 'japan':[['Tokyo','Asia/Tokyo']],
  'beijing':[['Beijing','Asia/Shanghai']], 'china':[['Beijing','Asia/Shanghai']], 'shanghai':[['Shanghai','Asia/Shanghai']],
  'india':[['New Delhi','Asia/Kolkata']], 'delhi':[['New Delhi','Asia/Kolkata']], 'mumbai':[['Mumbai','Asia/Kolkata']],
  'singapore':[['Singapore','Asia/Singapore']], 'hong kong':[['Hong Kong','Asia/Hong_Kong']],
  'sydney':[['Sydney','Australia/Sydney']], 'melbourne':[['Melbourne','Australia/Melbourne']],
  'perth':[['Perth','Australia/Perth']], 'brisbane':[['Brisbane','Australia/Brisbane']],
  'new york':[['New York','America/New_York']], 'los angeles':[['Los Angeles','America/Los_Angeles']],
  'chicago':[['Chicago','America/Chicago']], 'san francisco':[['San Francisco','America/Los_Angeles']],
  'toronto':[['Toronto','America/Toronto']], 'vancouver':[['Vancouver','America/Vancouver']],
  'berlin ':[['Berlin','Europe/Berlin']], 'amsterdam':[['Amsterdam','Europe/Amsterdam']],
  'seoul':[['Seoul','Asia/Seoul']], 'bangkok':[['Bangkok','Asia/Bangkok']], 'jakarta':[['Jakarta','Asia/Jakarta']],
  'auckland':[['Auckland','Pacific/Auckland']], 'new zealand':[['Auckland','Pacific/Auckland']],
  'brazil':[['São Paulo','America/Sao_Paulo']], 'mexico':[['Mexico City','America/Mexico_City']],
}
function timeIntent(q) {
  const s = q.trim().toLowerCase().replace(/[?.!]+$/, '')
  if (!/\btime\b/.test(s)) return null
  const strip = p => p.trim().replace(/^the\s+/i, '')
  // "... time (is it) in|at|for <place>"  → the dominant phrasing
  let m = s.match(/\btime\b(?:\s+is\s+it)?\s+(?:in|at|for)\s+(.+)$/)
  if (m) return { place: strip(m[1]) }
  // "<place> time [now]" → e.g. "tokyo time"
  m = s.match(/^([a-z .'-]+?)\s+time(?:\s+now)?$/)
  if (m && !/\b(what|current|local|is|it)\b/.test(m[1])) return { place: strip(m[1]) }
  // bare clock query with no place → default UTC
  if (/^(?:what(?:'?s| is)?\s+(?:the\s+)?(?:current\s+|local\s+)?time(?:\s+is\s+it)?|current\s+time|local\s+time|the\s+time|time\s+now|time)$/.test(s)) return { place: '' }
  return null
}
function buildClock(place, zones) {
  return { place, epochMs: Date.now(), zones: zones.map(([label, timeZone]) => ({ label, timeZone })) }
}
function parseTimeLocal(q) {
  const ti = timeIntent(q)
  if (!ti) return null
  if (!ti.place) return buildClock('UTC', [['UTC','UTC']])
  const key = ti.place.toLowerCase()
  if (TZ[key]) return buildClock(ti.place, TZ[key])
  return { needsResolve: ti.place } // ask the AI classifier to resolve
}

// ───────────────────────── Dictionary ─────────────────────────
async function parseDictionary(q) {
  const m = q.trim().toLowerCase().match(/^(?:define|definition of|meaning of|what does|what is the meaning of)\s+(.+?)(?:\s+mean)?\??$/)
  if (!m) return null
  const word = m[1].trim()
  if (!word || /\s/.test(word) && word.split(/\s+/).length > 3) return null
  const d = await getJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 3500 })
  if (!Array.isArray(d) || !d[0]) return null
  const entry = d[0]
  const meanings = (entry.meanings || []).slice(0, 3).map(mm => ({
    partOfSpeech: mm.partOfSpeech,
    definitions: (mm.definitions || []).slice(0, 2).map(x => x.definition),
  }))
  if (!meanings.length) return null
  return { word: entry.word, phonetic: entry.phonetic || '', meanings }
}

// ───────────────────────── Weather (Open-Meteo, keyless) ─────────────────────────
const WCODE = {
  0:['Clear','☀️'],1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],
  45:['Fog','🌫️'],48:['Rime fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],
  61:['Light rain','🌦️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],71:['Light snow','🌨️'],73:['Snow','❄️'],75:['Heavy snow','❄️'],
  80:['Rain showers','🌦️'],81:['Rain showers','🌧️'],82:['Violent showers','⛈️'],95:['Thunderstorm','⛈️'],96:['Thunderstorm','⛈️'],99:['Thunderstorm','⛈️'],
}
async function parseWeather(q) {
  const s = q.trim().toLowerCase()
  const m = s.match(/^weather(?:\s+forecast)?(?:\s+(?:in|at|for))?\s+(.+?)\??$/) || s.match(/^(.+?)\s+weather\??$/)
  if (!m) return null
  const place = m[1].trim()
  if (!place || place.length > 60) return null
  // Geocode via Nominatim (Open-Meteo's geocoding host is unreachable from this
  // box's network; Nominatim + Open-Meteo forecast is the reachable combination).
  // Fetch several candidates and pick the most prominent (highest importance) so
  // "sydney" resolves to Sydney AU, not a tiny townland that matched by name.
  const geo = await getJson(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=5&addressdetails=1&accept-language=en`, { timeout: 4000 })
  if (!Array.isArray(geo) || !geo.length) return null
  const g = geo.slice().sort((a, b) => (b.importance || 0) - (a.importance || 0))[0]
  if (!g?.lat || !g?.lon) return null
  const ad = g.address || {}
  const city = ad.city || ad.town || ad.village || ad.municipality || ad.county || (g.display_name || place).split(',')[0].trim()
  const label = [city, ad.country].filter(Boolean).join(', ')
  const fc = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`, { timeout: 4000 })
  const cur = fc?.current
  if (!cur) return null
  const [desc, emoji] = WCODE[cur.weather_code] || ['—','🌡️']
  return {
    place: label,
    emoji, desc,
    temp: Math.round(cur.temperature_2m), feelsLike: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m, wind: Math.round(cur.wind_speed_10m), unit: '°C',
  }
}

// ───────────────────────── Aviation (METAR/TAF, for pilots & nerds) ─────────────────────────
// Data from NOAA's Aviation Weather Center — free, global, no auth, same raw
// METAR/TAF you'd pull from NAIPS.
function aviationIntent(q) {
  const s = q.trim().toLowerCase()
  const kw = /\b(metar|taf|atis|notam|airport|aviation|icao|wx)\b/.test(s)
  const codeM = q.toUpperCase().match(/\b([A-Z]{4})\b/)
  const code = codeM ? codeM[1] : null
  if (code && (kw || /^[a-z]{4}$/.test(s))) return { icao: code }
  if (kw) return { needsResolve: true }
  return null
}
async function parseAviation(icao) {
  if (!icao) return null
  const [metar, taf] = await Promise.all([
    getJson(`https://aviationweather.gov/api/data/metar?ids=${icao}&format=json`, { timeout: 4500 }),
    getJson(`https://aviationweather.gov/api/data/taf?ids=${icao}&format=json`, { timeout: 4500 }),
  ])
  const m = Array.isArray(metar) ? metar[0] : null
  if (!m || !m.rawOb) return null
  const t = Array.isArray(taf) ? taf[0] : null
  return {
    icao: m.icaoId || icao,
    name: m.name || icao,
    flightCategory: m.fltCat || '',
    temp: m.temp, dewp: m.dewp,
    wind: { dir: m.wdir, speed: m.wspd, gust: m.wgst ?? null },
    visib: m.visib != null ? String(m.visib) : '',
    altim: m.altim ? Math.round(m.altim) : null,
    clouds: Array.isArray(m.clouds) ? m.clouds.filter(c => c.base != null).map(c => ({ cover: c.cover, base: c.base })) : [],
    rawMetar: m.rawOb,
    rawTaf: t?.rawTAF || '',
    obsTime: m.reportTime || m.obsTime || '',
  }
}

// NAIPS (Airservices Australia) — fallback METAR/TAF for AU aerodromes the NOAA
// feed doesn't carry (e.g. YSBK Bankstown). Pure HTTP (no browser), session cached.
const NAIPS_USER = process.env.NAIPS_USER
const NAIPS_PASS = process.env.NAIPS_PASS
const NAIPS_BASE = 'https://www.airservicesaustralia.com/naips'
let naipsSession = null // { jar: Map, at }

function cookieHeader(jar) { return [...jar].map(([k, v]) => `${k}=${v}`).join('; ') }
function absorbCookies(res, jar) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  for (const c of list) {
    const kv = c.split(';')[0], i = kv.indexOf('=')
    if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim())
  }
}
async function naipsJar() {
  if (naipsSession && Date.now() - naipsSession.at < 15 * 60 * 1000) return naipsSession.jar
  const jar = new Map(), h = { 'User-Agent': UA }
  let r = await fetch(`${NAIPS_BASE}/Account/Logon`, { headers: h, redirect: 'manual', signal: AbortSignal.timeout(8000) })
  absorbCookies(r, jar)
  r = await fetch(`${NAIPS_BASE}/Account/Logon`, {
    method: 'POST', redirect: 'manual',
    headers: { ...h, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieHeader(jar) },
    body: new URLSearchParams({ UserName: NAIPS_USER, Password: NAIPS_PASS }).toString(),
    signal: AbortSignal.timeout(10000),
  })
  absorbCookies(r, jar)
  naipsSession = { jar, at: Date.now() }
  return jar
}
function parseMetarRaw(raw) {
  const r = raw.replace(/\s+/g, ' ').trim()
  const windM = r.match(/\b(VRB|\d{3})(\d{2,3})(G(\d{2,3}))?(KT|MPS)\b/)
  const visM  = r.match(/\b(9999|\d{4})\b/)
  const tempM = r.match(/\b(M?\d{2})\/(M?\d{2})\b/)
  const qnhM  = r.match(/\bQ(\d{4})\b/) || r.match(/\bA(\d{4})\b/)
  const sky   = [...r.matchAll(/\b(FEW|SCT|BKN|OVC)(\d{3})\b/g)].map(s => ({ cover: s[1], base: parseInt(s[2]) * 100 }))
  const pt = t => t ? (t.startsWith('M') ? -parseInt(t.slice(1)) : parseInt(t)) : null
  const cover = sky.find(s => ['BKN', 'OVC'].includes(s.cover))
  const ceilFt = cover ? cover.base : Infinity
  const vis = visM ? parseInt(visM[1]) : null
  const visM_ = vis ? (vis === 9999 ? 99 : vis / 1609) : 99
  let fcat = 'VFR'
  if (ceilFt < 500 || visM_ < 1) fcat = 'LIFR'
  else if (ceilFt < 1000 || visM_ < 3) fcat = 'IFR'
  else if (ceilFt < 3000 || visM_ < 5) fcat = 'MVFR'
  return {
    fcat, temp: pt(tempM?.[1]), dp: pt(tempM?.[2]),
    windDir: windM ? (windM[1] === 'VRB' ? null : parseInt(windM[1])) : null,
    windKt: windM ? parseInt(windM[2]) : null, gustKt: windM?.[4] ? parseInt(windM[4]) : null,
    vis, qnh: qnhM ? parseInt(qnhM[1]) : null, sky,
  }
}
function naipsBlock(text, icao, kind) {
  const m = text.match(new RegExp(`${kind}\\s+(?:AMD\\s+|COR\\s+)?${icao}\\s+\\d{6}Z[\\s\\S]*?(?=\\n\\s*\\n|©|$)`, 'i'))
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}
async function naipsAviation(icao) {
  if (!NAIPS_USER || !NAIPS_PASS) return null
  try {
    let jar = await naipsJar()
    const post = () => {
      const body = new URLSearchParams()
      body.append('Locations[0]', icao); body.append('Met', 'true'); body.append('Met', 'false')
      body.append('NOTAM', 'false'); body.append('Validity', '3')
      return fetch(`${NAIPS_BASE}/Briefing/Location`, {
        method: 'POST', redirect: 'manual',
        headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': cookieHeader(jar) },
        body: body.toString(), signal: AbortSignal.timeout(12000),
      })
    }
    let r = await post()
    let loc = r.headers.get('location') || ''
    if (/Account\/Logon/i.test(loc)) { naipsSession = null; jar = await naipsJar(); r = await post(); loc = r.headers.get('location') || '' } // relogin once
    if (!/LocationResults/i.test(loc)) return null
    const res = await fetch(new URL(loc, `${NAIPS_BASE}/`).href, { headers: { 'User-Agent': UA, 'Cookie': cookieHeader(jar) }, signal: AbortSignal.timeout(10000) })
    const t = (await res.text()).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/[ \t]+/g, ' ')
    const metar = naipsBlock(t, icao, 'METAR') || naipsBlock(t, icao, 'SPECI')
    const taf = naipsBlock(t, icao, 'TAF')
    if (!metar && !taf) return null
    const nameM = t.match(new RegExp(`([A-Z][A-Z '/-]{2,30})\\s*\\(${icao}\\)`))
    const p = metar ? parseMetarRaw(metar) : {}
    return {
      icao, name: nameM ? nameM[1].trim() : icao, source: 'NAIPS',
      flightCategory: p.fcat || '', temp: p.temp ?? null, dewp: p.dp ?? null,
      wind: { dir: p.windDir ?? null, speed: p.windKt ?? null, gust: p.gustKt ?? null },
      visib: p.vis != null ? String(p.vis) : '', altim: p.qnh ?? null,
      clouds: p.sky || [], rawMetar: metar || '', rawTaf: taf || '', obsTime: '',
    }
  } catch { return null }
}

// ───────────────────────── Wikipedia knowledge panel ─────────────────────────
async function wikiSummary(title) {
  if (!title) return null
  const d = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`, { timeout: 3500 })
  if (!d || d.type === 'disambiguation' || !d.extract) return null
  return {
    title: d.title,
    description: d.description || '',
    extract: d.extract,
    thumbnail: d.thumbnail?.source || null,
    url: d.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(d.title)}`,
  }
}
async function wikiSearch(q) {
  const d = await getJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=1&format=json&origin=*`, { timeout: 3000 })
  const hit = d?.query?.search?.[0]
  return hit ? hit.title : null
}

// ───────────────────────── AI query understanding ─────────────────────────
async function anthropic(system, user, { maxTokens = 300, timeout = 7000 } = {}) {
  if (!ANTHROPIC_KEY) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: ANSWER_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
      signal: AbortSignal.timeout(timeout),
    })
    const data = await res.json()
    return data.content?.map(b => b.text).join('') ?? null
  } catch {
    return null
  }
}
function extractJson(text) {
  if (!text) return null
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) return null
  try { return JSON.parse(m[0]) } catch { return null }
}
// One classifier call: intent + the best Wikipedia article + related searches +
// (for time queries the AI couldn't-be-mapped) an IANA timezone.
async function aiClassify(q) {
  const text = await anthropic(
    'You are the query-understanding brain of a web search engine. Given a user query, reply with ONLY a JSON object, no prose:\n' +
    '{"intent":"time|weather|aviation|calc|unit|currency|dictionary|entity|informational|navigational","wiki":"exact English Wikipedia article title that best matches the query subject, or empty string if none applies","timezone":"IANA tz name if this is a time query about a specific place, else empty","icao":"4-letter ICAO airport code if the query is about a specific airport (e.g. sydney airport → YSSY, JFK → KJFK), else empty","related":["4 short useful follow-up search queries"]}\n' +
    'Pick "wiki" for people, places, organisations, concepts, events, products — anything with an encyclopedia entry. Leave it empty for pure calculations, navigational or transactional queries.',
    `Query: ${q}`,
    { maxTokens: 250, timeout: 6000 }
  )
  return extractJson(text) || {}
}

// Rewrite a query into better keyword search terms (used by /search smart mode).
export async function rewriteQuery(q) {
  const text = await anthropic(
    'Rewrite the user search query into the most effective keyword query for a keyword-based web search index. ' +
    'Expand abbreviations, add the key disambiguating noun, drop filler words. Reply with ONLY the rewritten query, nothing else. If the query is already ideal, echo it back.',
    q,
    { maxTokens: 40, timeout: 5000 }
  )
  const out = (text || '').trim().split('\n')[0].replace(/^["']|["']$/g, '').slice(0, 120)
  return out && out.toLowerCase() !== q.toLowerCase() ? out : null
}

// ───────────────────────── Orchestrator ─────────────────────────
export async function instant(q) {
  const query = q.trim()
  const widgets = {}

  // 1. Instant deterministic widgets (no network).
  const calc = parseCalc(query); if (calc) widgets.calc = calc
  const unit = !calc ? parseUnit(query) : null; if (unit) widgets.unit = unit
  let timeW = parseTimeLocal(query)
  const avIntent = aviationIntent(query)

  // 2. Network widgets + AI classify, all in parallel, all best-effort.
  const [currency, dict, weather, aviation0, classify, wikiFromSearch] = await Promise.all([
    (!calc && !unit) ? parseCurrency(query) : null,
    parseDictionary(query),
    avIntent ? null : parseWeather(query),   // don't double-fetch weather for airport queries
    avIntent?.icao ? parseAviation(avIntent.icao) : null,
    aiClassify(query),
    wikiSearch(query),
  ])
  if (currency) widgets.currency = currency
  if (dict) widgets.dictionary = dict
  if (weather) widgets.weather = weather

  // Aviation: code from the query, else the AI-resolved ICAO (airport names).
  // NOAA AWC first; for AU aerodromes it lacks (e.g. YSBK), fall back to NAIPS.
  let aviation = aviation0
  const icao = avIntent?.icao || (avIntent?.needsResolve ? classify?.icao : null)
  if (avIntent && !aviation && icao) {
    if (!avIntent.icao) aviation = await parseAviation(icao)          // classify-resolved code → try AWC
    if (!aviation && /^Y[A-Z]{3}$/i.test(icao)) aviation = await naipsAviation(icao.toUpperCase()) // AU fallback
  }
  if (aviation) widgets.aviation = aviation

  // 3. Resolve a time query the static map couldn't (AI supplies the IANA zone).
  if (timeW?.needsResolve) {
    if (classify?.timezone) {
      timeW = buildClock(timeW.needsResolve, [[timeW.needsResolve, classify.timezone]])
    } else {
      timeW = null
    }
  }
  if (timeW && !timeW.needsResolve) widgets.time = timeW

  // 4. Wikipedia knowledge panel — prefer the AI-chosen article, else the search hit.
  //    Skip when a self-contained widget already answers the query.
  let wiki = null
  const hasWidget = widgets.calc || widgets.unit || widgets.currency || widgets.time || widgets.weather || widgets.dictionary || widgets.aviation
  // Prefer the AI-chosen article. Only fall back to a raw Wikipedia search hit
  // for genuine entity/informational intents — never for calc/unit/currency/nav
  // queries, where a keyword match (e.g. "240") is meaningless noise.
  const wikiTitle = classify?.wiki
    || (['entity', 'informational'].includes(classify?.intent) ? wikiFromSearch : null)
  if (wikiTitle && (!hasWidget || classify?.intent === 'entity')) {
    wiki = await wikiSummary(wikiTitle)
  }

  const related = Array.isArray(classify?.related) ? classify.related.filter(x => typeof x === 'string').slice(0, 4) : []

  return {
    query,
    intent: classify?.intent || (hasWidget ? 'instant' : 'informational'),
    widgets,
    wiki,
    related,
    hasPanel: !!(hasWidget || wiki || related.length),
  }
}
