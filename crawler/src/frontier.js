// SQLite-backed crawl frontier + link graph (Node built-in node:sqlite).
// Run node with --experimental-sqlite. Durable across restarts.
import { DatabaseSync } from 'node:sqlite'

const DB_PATH = process.env.FRONTIER_DB || './frontier.db'
const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  CREATE TABLE IF NOT EXISTS frontier (
    url    TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    depth  INTEGER NOT NULL,
    rank   INTEGER NOT NULL DEFAULT 999999999,
    status INTEGER NOT NULL DEFAULT 0   -- 0 queued, 1 done, 2 failed, 3 in-progress
  );
  CREATE INDEX IF NOT EXISTS idx_frontier_status ON frontier(status);
  CREATE TABLE IF NOT EXISTS domain_pages (domain TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS indeg        (domain TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0);
  -- Cross-domain link graph for PageRank. Deduped src->dst (unique pairs), so a
  -- single authoritative edge isn't over-counted by many links between two sites.
  CREATE TABLE IF NOT EXISTS edges (src TEXT NOT NULL, dst TEXT NOT NULL, PRIMARY KEY(src,dst)) WITHOUT ROWID;
`)

const q = {
  add:       db.prepare('INSERT OR IGNORE INTO frontier(url,domain,depth,rank) VALUES(?,?,?,?)'),
  // Randomize the claim so a batch spans many hosts — otherwise contiguous
  // same-host internal links get serialized by per-host politeness (stall).
  next:      db.prepare('SELECT url,domain,depth,rank FROM frontier WHERE status=0 ORDER BY RANDOM() LIMIT ?'),
  claim:     db.prepare('UPDATE frontier SET status=3 WHERE url=?'),
  done:      db.prepare('UPDATE frontier SET status=1 WHERE url=?'),
  fail:      db.prepare('UPDATE frontier SET status=2 WHERE url=?'),
  reset:     db.prepare('UPDATE frontier SET status=0 WHERE status=3'),
  queued:    db.prepare('SELECT count(*) c FROM frontier WHERE status=0'),
  finished:  db.prepare('SELECT count(*) c FROM frontier WHERE status=1'),
  pages:     db.prepare('SELECT n FROM domain_pages WHERE domain=?'),
  incPages:  db.prepare('INSERT INTO domain_pages(domain,n) VALUES(?,1) ON CONFLICT(domain) DO UPDATE SET n=n+1'),
  incIndeg:  db.prepare('INSERT INTO indeg(domain,n) VALUES(?,1) ON CONFLICT(domain) DO UPDATE SET n=n+1'),
  indeg:     db.prepare('SELECT n FROM indeg WHERE domain=?'),
  addEdge:   db.prepare('INSERT OR IGNORE INTO edges(src,dst) VALUES(?,?)'),
}

export function enqueue(url, domain, depth, rank = 999999999) { q.add.run(url, domain, depth, rank) }
export function resetInProgress() { q.reset.run() }
export function markDone(url) { q.done.run(url) }
export function markFail(url) { q.fail.run(url) }
export function queued() { return q.queued.get().c }
export function finished() { return q.finished.get().c }
export function domainPages(domain) { return q.pages.get(domain)?.n ?? 0 }
export function incDomainPages(domain) { q.incPages.run(domain) }
export function incIndeg(domain) { q.incIndeg.run(domain) }
export function indegOf(domain) { return q.indeg.get(domain)?.n ?? 0 }
// Record a cross-domain link src->dst for the PageRank graph (skip self-loops).
export function addEdge(src, dst) { if (src && dst && src !== dst) q.addEdge.run(src, dst) }

// Atomically claim up to n queued URLs (single-threaded JS => select+update is atomic).
export function claimBatch(n) {
  const rows = q.next.all(n)
  for (const r of rows) q.claim.run(r.url)
  return rows
}
