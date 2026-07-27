import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { instant, rewriteQuery } from './instant.js'

const app = new Hono()
const PORT = parseInt(process.env.PORT || '3000')
const MEILI_URL = process.env.MEILI_URL || 'http://localhost:7700'
const MEILI_KEY = process.env.MEILI_KEY || 'masterKey'
const NODE_ID = process.env.NODE_ID || 'main'
const EMBEDDER = process.env.EMBEDDER || 'workersai'
const SEMANTIC_RATIO = parseFloat(process.env.SEMANTIC_RATIO ?? '0.5') // 0 = keyword only

// In-memory peer registry  { id, url, lastSeen }
const peers = new Map()

// Circuit-breaker for federation: a peer that times out / errors is benched for
// PEER_COOLDOWN_MS so unreachable nodes don't add latency to every search. Peer
// queries also get a tight timeout — local results must never wait on a slow peer.
const PEER_TIMEOUT_MS = parseInt(process.env.PEER_TIMEOUT_MS || '800')
const PEER_COOLDOWN_MS = parseInt(process.env.PEER_COOLDOWN_MS || '60000')
const peerBenchedUntil = new Map() // url -> ts until which the peer is skipped

const meiliHeaders = { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' }

async function meiliQuery(body) {
  const res = await fetch(`${MEILI_URL}/indexes/pages/search`, {
    method: 'POST', headers: meiliHeaders, body: JSON.stringify(body),
  })
  return { ok: res.ok, data: await res.json() }
}

// Hybrid (semantic + keyword) search, with a keyword-only fallback if the
// embedder/provider hiccups so search never hard-fails.
async function meiliSearch(q, offset = 0, limit = 10) {
  const base = {
    q, limit, offset,
    attributesToHighlight: ['title', 'description'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    attributesToRetrieve: ['url', 'domain', 'title', 'description', 'crawledAt'],
  }
  if (SEMANTIC_RATIO > 0) {
    const hybrid = await meiliQuery({ ...base, hybrid: { embedder: EMBEDDER, semanticRatio: SEMANTIC_RATIO } })
    if (hybrid.ok && hybrid.data.hits !== undefined) return hybrid.data
  }
  return (await meiliQuery(base)).data
}

// Rerank top hits by true relevance with Claude (opt-in via ?rerank=1).
async function rerankHits(q, hits) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || hits.length < 2) return hits
  const list = hits.map((h, i) => `[${i}] ${h.title} — ${h.domain}: ${(h.description || '').slice(0, 140)}`).join('\n')
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANSWER_MODEL || 'claude-haiku-4-5',
        max_tokens: 120,
        system: 'You rerank web search results. Given a query and numbered results, reply with ONLY a comma-separated list of result indices, ordered most- to least-relevant to the query intent. Omit clearly irrelevant/spam results. e.g. "3,0,5,1"',
        messages: [{ role: 'user', content: `Query: ${q}\n\nResults:\n${list}` }],
      }),
      signal: AbortSignal.timeout(8000),
    })
    const data = await res.json()
    const text = data.content?.map(b => b.text).join('') ?? ''
    const order = (text.match(/\d+/g) ?? []).map(Number).filter(n => n < hits.length)
    if (!order.length) return hits
    const seen = new Set(), out = []
    for (const i of order) if (!seen.has(i)) { seen.add(i); out.push(hits[i]) }
    for (let i = 0; i < hits.length; i++) if (!seen.has(i)) out.push(hits[i]) // keep dropped at the tail
    return out
  } catch {
    return hits
  }
}

async function queryPeer(peer, q) {
  try {
    const res = await fetch(`${peer.url}/search?q=${encodeURIComponent(q)}&local=1`, {
      signal: AbortSignal.timeout(PEER_TIMEOUT_MS),
      headers: { 'X-Peer-Id': NODE_ID },
    })
    const data = await res.json()
    peerBenchedUntil.delete(peer.url) // responded — clear any bench
    return data.hits ?? []
  } catch {
    peerBenchedUntil.set(peer.url, Date.now() + PEER_COOLDOWN_MS) // bench the flaky/unreachable peer
    return []
  }
}

// Smart-search result cache (rewrite+rerank is AI-backed, so memoise it).
const searchCache = new Map() // key -> { at, payload }
const SEARCH_TTL = 10 * 60 * 1000
// Hard wall-clock budget for the AI enhancement. If exceeded we serve the raw
// keyword hits already in hand — search must never hang on a slow model call.
const SMART_BUDGET_MS = parseInt(process.env.SMART_BUDGET_MS || '2600')

// Search endpoint — fans out to peers when not local. In smart mode (default
// from the frontend) it AI-rewrites the query, unions those hits, and reranks.
app.get('/search', async (c) => {
  const q = c.req.query('q')?.trim()
  const page = Math.max(0, parseInt(c.req.query('page') ?? '0'))
  const local = c.req.query('local') === '1'
  const smart = c.req.query('smart') === '1' && page === 0 && !local
  const rerank = c.req.query('rerank') === '1' && page === 0 && !smart

  if (!q) return c.json({ error: 'missing q' }, 400)

  const ck = `s:${q.toLowerCase()}`
  if (smart) { const hit = searchCache.get(ck); if (hit && Date.now() - hit.at < SEARCH_TTL) return c.json(hit.payload) }

  const offset = page * 10
  const local$ = meiliSearch(q, offset, (smart || rerank) ? 20 : 10) // over-fetch to give the reranker room
  // Skip benched peers entirely so an unreachable node costs nothing (not even a timeout).
  const now = Date.now()
  const livePeers = local ? [] : [...peers.values()].filter(p => (peerBenchedUntil.get(p.url) ?? 0) <= now)
  const peer$ = livePeers.map(p => queryPeer(p, q))

  const [localResult, ...peerResults] = await Promise.all([local$, ...peer$])

  // Deduplicate and merge peer hits
  const seen = new Set(localResult.hits?.map(h => h.url) ?? [])
  const peerHits = peerResults.flat().filter(h => !seen.has(h.url)).slice(0, 5)

  let hits = [...(localResult.hits ?? []), ...peerHits]
  const baseTotal = (localResult.estimatedTotalHits ?? 0) + peerHits.length
  const mkPayload = (h, extra = {}) => ({
    hits: h, total: baseTotal, page, query: q, nodeId: NODE_ID,
    peers: [...peers.keys()], peersQueried: livePeers.length, ...extra,
  })

  if (smart) {
    // AI enhancement: rewrite → union → rerank. Raced against the budget; the
    // full result still populates the cache if it finishes after we've replied.
    const enhance = (async () => {
      const rewrite = await rewriteQuery(q)
      let pool = hits
      if (rewrite) {
        const rw = await meiliSearch(rewrite, 0, 20)
        const s2 = new Set(pool.map(h => h.url))
        pool = [...pool, ...(rw.hits ?? []).filter(h => !s2.has(h.url))]
      }
      const ranked = (await rerankHits(q, pool)).slice(0, 10)
      return mkPayload(ranked, { smart: true, rewrite })
    })()
    enhance.then(p => searchCache.set(ck, { at: Date.now(), payload: p })).catch(() => {})
    const raced = await Promise.race([enhance, new Promise(r => setTimeout(() => r(null), SMART_BUDGET_MS))])
    if (raced) return c.json(raced)
    return c.json(mkPayload(hits.slice(0, 10), { smart: false })) // budget blown → raw fallback
  }

  hits = hits.slice(0, 10)
  if (rerank) hits = (await rerankHits(q, hits)).slice(0, 10)
  return c.json(mkPayload(hits, { reranked: rerank }))
})

// AI answer box — cited RAG over the index with Claude.
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const ANSWER_MODEL = process.env.ANSWER_MODEL || 'claude-haiku-4-5'
const answerCache = new Map() // q -> { at, payload }

app.get('/answer', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q) return c.json({ error: 'missing q' }, 400)
  if (!ANTHROPIC_KEY) return c.json({ error: 'answers disabled' }, 503)

  const key = q.toLowerCase()
  const cached = answerCache.get(key)
  if (cached && Date.now() - cached.at < 3_600_000) return c.json(cached.payload)

  const result = await meiliSearch(q, 0, 6)
  const hits = result.hits ?? []
  if (hits.length === 0) return c.json({ answer: null, sources: [], query: q })

  const sources = hits.map((h, i) => ({
    n: i + 1, title: h.title, url: h.url, domain: h.domain,
    snippet: (h.description || '').slice(0, 300),
  }))
  const context = sources.map(s => `[${s.n}] ${s.title} — ${s.domain}\n${s.snippet}`).join('\n\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANSWER_MODEL,
        max_tokens: 400,
        system: 'You are a search answer engine over the open web. Answer the query in 2-4 concise sentences using ONLY the numbered sources. Cite claims inline like [1][2]. If the sources do not contain the answer, say so briefly. Never invent facts or URLs.',
        messages: [{ role: 'user', content: `Query: ${q}\n\nSources:\n${context}` }],
      }),
      signal: AbortSignal.timeout(20000),
    })
    const data = await res.json()
    const answer = data.content?.map(b => b.text).join('') ?? null
    const payload = { answer, sources, query: q, model: ANSWER_MODEL }
    answerCache.set(key, { at: Date.now(), payload })
    return c.json(payload)
  } catch (e) {
    return c.json({ answer: null, sources, query: q, error: e.message }, 502)
  }
})

// Smart panel — instant answers, Wikipedia knowledge panel, AI query
// understanding + related searches. Best-effort, short-cached.
const instantCache = new Map() // q -> { at, payload }
app.get('/instant', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q) return c.json({ error: 'missing q' }, 400)
  const key = q.toLowerCase()
  const cached = instantCache.get(key)
  // Cache 10min normally, but only 45s when a live clock/weather widget is present.
  if (cached) {
    const ttl = cached.payload?.widgets?.time || cached.payload?.widgets?.weather ? 45_000 : 600_000
    if (Date.now() - cached.at < ttl) return c.json(cached.payload)
  }
  try {
    const payload = await instant(q)
    instantCache.set(key, { at: Date.now(), payload })
    return c.json(payload)
  } catch (e) {
    return c.json({ query: q, widgets: {}, wiki: null, related: [], hasPanel: false, error: e.message })
  }
})

// P2P: register as peer
app.post('/peers/register', async (c) => {
  const { id, url } = await c.req.json()
  if (!id || !url) return c.json({ error: 'id and url required' }, 400)
  peers.set(id, { id, url, lastSeen: Date.now() })
  return c.json({ ok: true, peerId: NODE_ID, peers: [...peers.keys()] })
})

// P2P: list peers
app.get('/peers', (c) => {
  return c.json({ nodeId: NODE_ID, peers: [...peers.values()] })
})

// Health
app.get('/health', async (c) => {
  try {
    const res = await fetch(`${MEILI_URL}/health`, {
      headers: { 'Authorization': `Bearer ${MEILI_KEY}` }
    })
    const meili = await res.json()
    return c.json({ ok: true, meili, nodeId: NODE_ID })
  } catch (e) {
    return c.json({ ok: false, error: e.message }, 503)
  }
})

// Stats
app.get('/stats', async (c) => {
  const res = await fetch(`${MEILI_URL}/indexes/pages/stats`, {
    headers: { 'Authorization': `Bearer ${MEILI_KEY}` }
  })
  const stats = await res.json()
  return c.json({ ...stats, peers: peers.size, nodeId: NODE_ID })
})

serve({ fetch: app.fetch, port: PORT })
console.log(`Search API running on :${PORT} [node=${NODE_ID}]`)
