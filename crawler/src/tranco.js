import { createWriteStream, existsSync, readFileSync } from 'fs'
import { pipeline } from 'stream/promises'

// Majestic Million - stable URL, updated daily, rank,domain format
const LIST_URL = 'https://downloads.majestic.com/majestic_million.csv'
const LIST_FILE = './domains.csv'

export async function downloadTranco() {
  if (existsSync(LIST_FILE)) {
    console.log('Domain list already downloaded')
    return
  }
  console.log('Downloading Majestic Million domain list...')
  const res = await fetch(LIST_URL)
  if (!res.ok) throw new Error(`Failed: ${res.status}`)
  await pipeline(res.body, createWriteStream(LIST_FILE))
  console.log('Download complete')
}

export function* readDomains(limit = Infinity) {
  const csv = readFileSync(LIST_FILE, 'utf8')
  let count = 0
  let header = true
  for (const line of csv.split('\n')) {
    if (!line.trim()) continue
    // Skip header row
    if (header) { header = false; continue }
    const cols = line.split(',')
    const rank = parseInt(cols[0])
    const domain = cols[2]?.trim()  // Majestic: GlobalRank,TldRank,Domain,...
    if (!domain || isNaN(rank)) continue
    yield { rank, domain }
    if (++count >= limit) break
  }
}

if (process.argv[1].endsWith('tranco.js')) {
  await downloadTranco()
  let i = 0
  for (const entry of readDomains(10)) {
    console.log(entry)
    i++
  }
}
