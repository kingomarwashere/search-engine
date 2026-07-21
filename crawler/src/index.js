import pLimit from 'p-limit'
import { downloadTranco, readDomains } from './tranco.js'
import { fetchPage } from './fetcher.js'
import { parsePage } from './parser.js'
import { setupIndex, indexDoc, flush } from './indexer.js'

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '8')
const LIMIT = parseInt(process.env.LIMIT || '100000')

let crawled = 0
let failed = 0
let skipped = 0

function log() {
  if (crawled % 50 === 0) {
    process.stdout.write(`\r[crawled=${crawled} failed=${failed} skipped=${skipped}]`)
  }
}

async function crawlDomain({ rank, domain }) {
  const result = await fetchPage(domain)
  if (!result) { failed++; log(); return }

  const doc = parsePage(result.url, result.html)
  if (!doc.title && !doc.description) { skipped++; log(); return }

  doc.rank = rank
  await indexDoc(doc)
  crawled++
  log()
}

// Process domains in a bounded sliding window instead of creating all promises upfront
async function main() {
  await downloadTranco()
  await setupIndex()

  console.log(`Starting crawl: concurrency=${CONCURRENCY} limit=${LIMIT}`)

  const queue = []
  let active = 0

  async function runNext(entry) {
    active++
    try { await crawlDomain(entry) } catch {}
    active--
  }

  for (const entry of readDomains(LIMIT)) {
    while (active >= CONCURRENCY) {
      await new Promise(r => setTimeout(r, 10))
    }
    queue.push(runNext(entry))
    // Periodically drain settled promises to free memory
    if (queue.length >= 500) {
      await Promise.allSettled(queue.splice(0, 200))
    }
  }

  await Promise.allSettled(queue)
  await flush()

  console.log(`\nDone. crawled=${crawled} failed=${failed} skipped=${skipped}`)
}

main().catch(console.error)
