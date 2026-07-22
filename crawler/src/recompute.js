// recompute.js — domain-level authority recompute → push scores to Meilisearch.
//
// Runs real iterative PageRank over the crawl's cross-domain link graph (the
// `edges` table), blends it with accumulated in-degree and the Majestic seed
// rank (a trustworthy global prior), then patches every indexed document's
// `score` field — Meili's authority tie-breaker (last ranking rule) — via
// PARTIAL updates (PUT), so titles/bodies/embeddings are left untouched and no
// re-embedding is triggered.
//
// Safe to run while the crawler is live; offset pagination self-heals on the
// next run. Intended to run periodically (systemd timer) as the crawl matures:
// early on the graph is sparse and in-degree carries the signal; as edges
// accumulate toward the 1.5M-page target, PageRank takes over.
//
//   node --experimental-sqlite src/recompute.js
//
// Env: FRONTIER_DB, MEILI_URL, MEILI_KEY, DAMPING, ITERS, PR_WEIGHT, INDEG_WEIGHT
import { DatabaseSync } from 'node:sqlite'

const DB_PATH      = process.env.FRONTIER_DB || './frontier.db'
const MEILI_URL    = process.env.MEILI_URL || 'http://localhost:7700'
const MEILI_KEY    = process.env.MEILI_KEY || 'masterKey'
const INDEX        = 'pages'
const DAMPING      = parseFloat(process.env.DAMPING || '0.85')
const ITERS        = parseInt(process.env.ITERS || '40')
const AUTH_SCALE   = 6_000_000                                  // max authority bonus layered on baseScore
const PR_WEIGHT    = parseFloat(process.env.PR_WEIGHT || '0.6')
const INDEG_WEIGHT = parseFloat(process.env.INDEG_WEIGHT || '0.4')
const PAGE         = 1000

// Seed authority from Majestic rank (rank 1 => ~10M). Mirrors indexer.js so the
// recomputed score stays on the same scale as freshly-crawled docs.
function baseScore(rank) {
  return Math.max(1, 10_000_000 - Math.min(rank ?? 9_999_999, 9_999_999))
}

async function meili(method, path, body) {
  const res = await fetch(`${MEILI_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`)
  return res.json()
}

// Pull the domain graph + priors out of the frontier DB.
function loadGraph(db) {
  const nodes = new Set()
  const out = new Map()                    // src -> [dst,...] (deduped by PK)
  for (const { src, dst } of db.prepare('SELECT src,dst FROM edges').all()) {
    nodes.add(src); nodes.add(dst)
    if (!out.has(src)) out.set(src, [])
    out.get(src).push(dst)
  }
  const indeg = new Map()                  // accumulated cross-domain in-degree
  for (const { domain, n } of db.prepare('SELECT domain,n FROM indeg').all()) {
    indeg.set(domain, n); nodes.add(domain)
  }
  const baseRank = new Map()               // domain -> best (lowest) Majestic rank seen
  for (const { domain, r } of db.prepare('SELECT domain, MIN(rank) r FROM frontier GROUP BY domain').all()) {
    baseRank.set(domain, r); nodes.add(domain)
  }
  return { nodes: [...nodes], out, indeg, baseRank }
}

// Standard PageRank with damping + dangling-node redistribution.
function pagerank(nodes, out) {
  const N = nodes.length
  if (N === 0) return new Map()
  const idx = new Map(nodes.map((d, i) => [d, i]))
  const outdeg = new Float64Array(N)
  const inlinks = Array.from({ length: N }, () => [])   // i -> [src indices]
  for (const [src, dsts] of out) {
    const si = idx.get(src)
    outdeg[si] = dsts.length
    for (const dst of dsts) inlinks[idx.get(dst)].push(si)
  }
  let pr = new Float64Array(N).fill(1 / N)
  const teleport = (1 - DAMPING) / N
  for (let it = 0; it < ITERS; it++) {
    let dangling = 0
    for (let i = 0; i < N; i++) if (outdeg[i] === 0) dangling += pr[i]
    const danglingShare = DAMPING * dangling / N
    const next = new Float64Array(N)
    for (let i = 0; i < N; i++) {
      let s = 0
      const ins = inlinks[i]
      for (let k = 0; k < ins.length; k++) { const j = ins[k]; s += pr[j] / outdeg[j] }
      next[i] = teleport + danglingShare + DAMPING * s
    }
    pr = next
  }
  const m = new Map()
  for (let i = 0; i < N; i++) m.set(nodes[i], pr[i])
  return m
}

async function main() {
  const db = new DatabaseSync(DB_PATH, { readOnly: true })
  console.log(`Loading link graph from ${DB_PATH} ...`)
  const { nodes, out, indeg, baseRank } = loadGraph(db)
  const edgeCount = [...out.values()].reduce((a, v) => a + v.length, 0)
  console.log(`Graph: ${nodes.length} domains, ${edgeCount} unique edges, ${indeg.size} with in-degree`)

  console.log(`PageRank: damping=${DAMPING} iters=${ITERS} ...`)
  const pr = pagerank(nodes, out)

  let maxPr = 0
  for (const v of pr.values()) if (v > maxPr) maxPr = v
  let maxLogIndeg = 0
  for (const v of indeg.values()) { const l = Math.log1p(v); if (l > maxLogIndeg) maxLogIndeg = l }

  // Per-domain final score: Majestic base + blended (PageRank, log-in-degree)
  // authority. Both authority terms normalized to [0,1] so the blend is stable
  // whether the graph is sparse (early) or dense (mature).
  function domainScore(d) {
    const prN = maxPr > 0 ? (pr.get(d) || 0) / maxPr : 0
    const inN = maxLogIndeg > 0 ? Math.log1p(indeg.get(d) || 0) / maxLogIndeg : 0
    const authority = AUTH_SCALE * (PR_WEIGHT * prN + INDEG_WEIGHT * inN)
    return Math.round(baseScore(baseRank.get(d)) + authority)
  }

  // Log the top domains this recompute promotes — a quick sanity check.
  const top = nodes
    .filter(d => pr.has(d))
    .sort((a, b) => domainScore(b) - domainScore(a))
    .slice(0, 15)
  console.log('Top domains by recomputed authority:')
  for (const d of top) {
    console.log(`  ${domainScore(d).toString().padStart(9)}  ${d}  (pr=${(pr.get(d) / (maxPr || 1)).toFixed(3)}, indeg=${indeg.get(d) || 0})`)
  }

  // Patch every indexed document's score via partial PUT updates.
  console.log('Patching document scores in Meili ...')
  let offset = 0, updated = 0, lastTask = null
  for (;;) {
    const res = await meili('GET', `/indexes/${INDEX}/documents?fields=id,domain&limit=${PAGE}&offset=${offset}`)
    const results = res.results || []
    if (results.length === 0) break
    const patch = results.map(r => ({ id: r.id, score: domainScore(r.domain) }))
    lastTask = await meili('PUT', `/indexes/${INDEX}/documents`, patch)  // partial: only `score` changes
    updated += patch.length
    offset += results.length
    process.stdout.write(`\r[recompute] queued score updates for ${updated} docs...`)
    if (results.length < PAGE) break
  }
  db.close()
  console.log(`\nDone. Queued authority scores for ${updated} documents. Last Meili task: ${lastTask?.taskUid ?? 'n/a'}`)
}

main().catch(e => { console.error(e); process.exit(1) })
