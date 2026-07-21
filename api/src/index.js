import { Hono } from 'hono'
import { serve } from '@hono/node-server'

const app = new Hono()
const PORT = parseInt(process.env.PORT || '3000')
const MEILI_URL = process.env.MEILI_URL || 'http://localhost:7700'
const MEILI_KEY = process.env.MEILI_KEY || 'masterKey'
const NODE_ID = process.env.NODE_ID || 'main'

// In-memory peer registry  { id, url, lastSeen }
const peers = new Map()

async function meiliSearch(q, offset = 0, limit = 10) {
  const res = await fetch(`${MEILI_URL}/indexes/pages/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MEILI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q,
      limit,
      offset,
      attributesToHighlight: ['title', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      attributesToRetrieve: ['url', 'domain', 'title', 'description', 'crawledAt'],
    }),
  })
  return res.json()
}

async function queryPeer(peer, q) {
  try {
    const res = await fetch(`${peer.url}/search?q=${encodeURIComponent(q)}&local=1`, {
      signal: AbortSignal.timeout(3000),
      headers: { 'X-Peer-Id': NODE_ID },
    })
    const data = await res.json()
    return data.hits ?? []
  } catch {
    return []
  }
}

// Search endpoint — fans out to peers when not local
app.get('/search', async (c) => {
  const q = c.req.query('q')?.trim()
  const page = Math.max(0, parseInt(c.req.query('page') ?? '0'))
  const local = c.req.query('local') === '1'

  if (!q) return c.json({ error: 'missing q' }, 400)

  const offset = page * 10
  const local$ = meiliSearch(q, offset)
  const peer$ = local ? [] : [...peers.values()].map(p => queryPeer(p, q))

  const [localResult, ...peerResults] = await Promise.all([local$, ...peer$])

  // Deduplicate and merge peer hits
  const seen = new Set(localResult.hits?.map(h => h.url) ?? [])
  const peerHits = peerResults
    .flat()
    .filter(h => !seen.has(h.url))
    .slice(0, 5)

  const hits = [...(localResult.hits ?? []), ...peerHits]

  return c.json({
    hits,
    total: (localResult.estimatedTotalHits ?? 0) + peerHits.length,
    page,
    query: q,
    nodeId: NODE_ID,
    peers: [...peers.keys()],
  })
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
