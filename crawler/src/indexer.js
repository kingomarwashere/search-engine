const MEILI_URL = process.env.MEILI_URL || 'http://localhost:7700'
const MEILI_KEY = process.env.MEILI_KEY || 'masterKey'
const INDEX = 'pages'
const BATCH_SIZE = 200

let buffer = []

async function meili(method, path, body) {
  const res = await fetch(`${MEILI_URL}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${MEILI_KEY}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function setupIndex() {
  await meili('POST', '/indexes', { uid: INDEX, primaryKey: 'id' })
  await meili('PATCH', `/indexes/${INDEX}/settings`, {
    searchableAttributes: ['title', 'description', 'body', 'domain'],
    displayedAttributes: ['id', 'url', 'domain', 'title', 'description', 'crawledAt', 'score'],
    // 'score:desc' as the last custom rule: authority breaks ties between similarly-relevant hits.
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'exactness', 'score:desc'],
    filterableAttributes: ['lang', 'domain'],
    sortableAttributes: ['score'],
  })
  console.log('Index ready')
}

// Wipe all documents for a clean rebuild (FRESH=1).
export async function clearIndex() {
  await meili('DELETE', `/indexes/${INDEX}/documents`)
  console.log('Index cleared')
}

// Base authority score from Majestic rank (rank 1 => ~10M). Folded with in-degree later.
function baseScore(rank) {
  return Math.max(1, 10_000_000 - Math.min(rank ?? 9_999_999, 9_999_999))
}

export async function indexDoc(doc) {
  doc.score = baseScore(doc.rank) + (doc.indeg || 0) * 500
  delete doc.links
  buffer.push(doc)
  if (buffer.length >= BATCH_SIZE) await flush()
}

export async function flush() {
  if (buffer.length === 0) return
  const docs = buffer.splice(0)
  await meili('POST', `/indexes/${INDEX}/documents`, docs)
}

export { meili, baseScore }
