const MEILI_URL = process.env.MEILI_URL || 'http://localhost:7700'
const MEILI_KEY = process.env.MEILI_KEY || 'masterKey'
const INDEX = 'pages'
const BATCH_SIZE = 100

let buffer = []

async function meili(method, path, body) {
  const res = await fetch(`${MEILI_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${MEILI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export async function setupIndex() {
  await meili('POST', '/indexes', { uid: INDEX, primaryKey: 'id' })
  await meili('PATCH', `/indexes/${INDEX}/settings`, {
    searchableAttributes: ['title', 'description', 'domain', 'body'],
    displayedAttributes: ['id', 'url', 'domain', 'title', 'description', 'crawledAt'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    filterableAttributes: ['lang', 'domain'],
  })
  console.log('Index ready')
}

export async function indexDoc(doc) {
  buffer.push(doc)
  if (buffer.length >= BATCH_SIZE) await flush()
}

export async function flush() {
  if (buffer.length === 0) return
  const docs = buffer.splice(0)
  await meili('POST', `/indexes/${INDEX}/documents`, docs)
}
