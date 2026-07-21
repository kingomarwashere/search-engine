# 🔍 RADICAL_SEARCH

> **The open web — unfiltered.** A self-hosted, from-scratch web search engine.

RADICAL_SEARCH crawls the most-linked domains on the web, indexes them in
[Meilisearch](https://www.meilisearch.com/), and serves results through a
Cloudflare Worker frontend at **[search.theradicalparty.com](https://search.theradicalparty.com)**.
The search API also supports optional **P2P federation** — nodes can register as
peers and fan queries out across a cluster.

## Architecture

```
                    ┌─────────────────────────────┐
   browser  ───▶    │  frontend/  (Cloudflare Worker)  │  search.theradicalparty.com
                    │  SSR UI, dark/light, proxies /search │
                    └───────────────┬─────────────┘
                                    │  fetch(API_URL)  (HTTPS :443)
                                    ▼
                    ┌─────────────────────────────┐
                    │  api/  (Hono, Node, on VM)   │  search-api.theradicalparty.com
                    │  /search /peers /stats /health │
                    └───────────────┬─────────────┘
                                    │  localhost:7700
                                    ▼
                    ┌─────────────────────────────┐
                    │  Meilisearch  (index: pages) │
                    └───────────────▲─────────────┘
                                    │  batched docs
                    ┌───────────────┴─────────────┐
                    │  crawler/  (Node, on VM)     │  Majestic Million → fetch → parse → index
                    └─────────────────────────────┘
```

## Components

| Dir | What it is | Runtime |
|-----|-----------|---------|
| `crawler/` | Downloads the [Majestic Million](https://majestic.com/reports/majestic-million) domain list, crawls each domain (undici, 8s timeout, HTML-only, 500 KB cap), parses with cheerio (title/description/body/outlinks), and batches docs into Meilisearch. | Node on the VM |
| `api/` | Hono search API. `/search` proxies to Meilisearch with highlighting and optional P2P peer fan-out. Also `/peers`, `/peers/register`, `/stats`, `/health`. | Node on the VM (`:PORT`) |
| `frontend/` | Cloudflare Worker. Server-rendered UI (Roboto Mono, dark/light theme), proxies `/search` to `API_URL`. | Cloudflare Workers |
| `scripts/` | `install-vm.sh` provisions Meilisearch + api + crawler as systemd services; `deploy.sh` syncs & runs it over SSH. | local → VM |

## Local development

```bash
# 1. Meilisearch (Docker)
docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest --master-key masterKey

# 2. API
cd api && npm install && MEILI_KEY=masterKey npm run dev      # :3000

# 3. A small crawl
cd crawler && npm install && LIMIT=500 CONCURRENCY=8 npm start

# 4. Frontend
cd frontend && npm install && npm run dev                     # wrangler dev
```

## Deploy

**Frontend (Cloudflare Worker):**
```bash
cd frontend && npm run deploy
```

**API + crawler (VM):** copy `scripts/deploy.env.example` → `scripts/deploy.env`,
fill in the VM host/user/password (this file is git-ignored), then:
```bash
cd scripts && ./deploy.sh
```

### API exposure

The frontend Worker reaches the API over **HTTPS on port 443** — a deployed
Cloudflare Worker's `fetch()` cannot reliably use non-standard ports like 3000.
The API is fronted at `search-api.theradicalparty.com` (see
[`docs/DEPLOY.md`](docs/DEPLOY.md) for the port/DNS setup).

## Configuration

| Var | Component | Default | Notes |
|-----|-----------|---------|-------|
| `MEILI_URL` | api, crawler | `http://localhost:7700` | Meilisearch endpoint |
| `MEILI_KEY` | api, crawler | `masterKey` | Meilisearch master key (VM-local only) |
| `PORT` | api | `3000` | API listen port |
| `NODE_ID` | api | `main` | P2P node identity |
| `CONCURRENCY` | crawler | `8` | Parallel fetches |
| `LIMIT` | crawler | `100000` | Max domains to crawl |
| `API_URL` | frontend | — | Set in `frontend/wrangler.jsonc` `vars` |

## License

Private / unlicensed — © the maintainer.
