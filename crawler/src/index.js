import pLimit from 'p-limit'
import { downloadTranco, readDomains } from './tranco.js'
import { fetchPage } from './fetcher.js'
import { parsePage, regDomain } from './parser.js'
import { setupIndex, clearIndex, indexDoc, flush } from './indexer.js'
import { allowed } from './robots.js'
import { sitemapUrls } from './sitemap.js'
import * as F from './frontier.js'

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '16')
const LIMIT = parseInt(process.env.LIMIT || '200000')                    // max pages to index this run
const SEED_DOMAINS = parseInt(process.env.SEED_DOMAINS || '20000')       // top Majestic domains to seed
const MAX_DEPTH = parseInt(process.env.MAX_DEPTH || '2')                 // link-follow depth
const MAX_PAGES_PER_DOMAIN = parseInt(process.env.MAX_PAGES_PER_DOMAIN || '30')
const HOST_DELAY_MS = parseInt(process.env.HOST_DELAY_MS || '1000')      // politeness per host
const FRESH = process.env.FRESH === '1'
// Distributed crawling: each worker owns a disjoint slice of the seed domains
// (hash(domain) % SHARD_COUNT === SHARD_ID). Defaults = single-node (all domains).
const SHARD_ID = parseInt(process.env.SHARD_ID || '0')
const SHARD_COUNT = parseInt(process.env.SHARD_COUNT || '1')

// FNV-1a — cheap, stable hash so every worker agrees on who owns a domain.
function hashDomain(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return h >>> 0
}
const ownsDomain = domain => SHARD_COUNT <= 1 || hashDomain(domain) % SHARD_COUNT === SHARD_ID

const sleep = ms => new Promise(r => setTimeout(r, ms))
const lastHit = new Map()      // host -> last fetch ts (politeness)
let indexed = 0, active = 0, crawled = 0, failed = 0

function stats() {
  process.stdout.write(`\r[indexed=${indexed} crawled=${crawled} failed=${failed} queued=${F.queued()} active=${active}]   `)
}

function seed() {
  let n = 0, skipped = 0
  for (const { rank, domain } of readDomains(SEED_DOMAINS)) {
    if (!ownsDomain(regDomain(domain))) { skipped++; continue }
    F.enqueue(`https://${domain}`, regDomain(domain), 0, rank)
    n++
  }
  console.log(`Seeded ${n} domains (shard ${SHARD_ID}/${SHARD_COUNT}, skipped ${skipped} out-of-shard)`)
}

async function politeWait(host) {
  const wait = (lastHit.get(host) || 0) + HOST_DELAY_MS - Date.now()
  if (wait > 0) await sleep(wait)
  lastHit.set(host, Date.now())
}

async function crawlOne(row) {
  const host = new URL(row.url).host
  await politeWait(host)

  if (!(await allowed(row.url))) { F.markDone(row.url); return }

  const result = await fetchPage(row.url)
  if (!result) { failed++; F.markFail(row.url); return }
  crawled++

  const doc = parsePage(result.url, result.html)
  const links = doc.links

  if ((doc.title || doc.description) && F.domainPages(doc.domain) < MAX_PAGES_PER_DOMAIN) {
    doc.rank = row.rank
    doc.indeg = F.indegOf(doc.domain)
    await indexDoc(doc)
    indexed++
    F.incDomainPages(doc.domain)
  }
  F.markDone(row.url)

  // depth-0: also seed from the sitemap
  if (row.depth === 0) {
    for (const u of await sitemapUrls(new URL(result.url).origin)) {
      try { F.enqueue(u, regDomain(new URL(u).hostname), 1, row.rank) } catch { /* skip */ }
    }
  }

  // enqueue links / record authority
  if (row.depth < MAX_DEPTH) {
    for (const l of links) {
      if (l.sameDomain) {
        if (F.domainPages(l.domain) < MAX_PAGES_PER_DOMAIN) F.enqueue(l.url, l.domain, row.depth + 1, row.rank)
      } else {
        F.incIndeg(l.domain)          // inbound cross-domain link = authority signal
        F.addEdge(doc.domain, l.domain) // record edge for PageRank recompute
      }
    }
  }
}

async function main() {
  await downloadTranco()
  await setupIndex()
  if (FRESH) await clearIndex()

  F.resetInProgress()
  if (F.queued() === 0 && F.finished() === 0) seed()

  console.log(`Crawl: concurrency=${CONCURRENCY} limit=${LIMIT} depth=${MAX_DEPTH} pages/domain=${MAX_PAGES_PER_DOMAIN}`)
  const limit = pLimit(CONCURRENCY)
  const statTimer = setInterval(stats, 1000)

  while (indexed < LIMIT) {
    const rows = F.claimBatch(CONCURRENCY * 2)
    if (rows.length === 0) {
      if (active === 0) break
      await sleep(200)
      continue
    }
    for (const row of rows) {
      active++
      limit(() => crawlOne(row).catch(() => F.markFail(row.url)).finally(() => { active-- }))
    }
    // don't outrun the worker pool
    while (active >= CONCURRENCY * 2) await sleep(20)
  }

  while (active > 0) await sleep(200)
  await flush()
  clearInterval(statTimer)
  stats()
  console.log(`\nDone. indexed=${indexed} crawled=${crawled} failed=${failed}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
