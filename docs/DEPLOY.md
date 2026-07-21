# Deploying RADICAL_SEARCH

Two moving parts: the **frontend** (Cloudflare Worker) and the **backend**
(Meilisearch + API + crawler on a VM, published through a Cloudflare Tunnel).

## Why a tunnel?

The frontend Worker calls the API server-side with `fetch(API_URL)`. A deployed
Cloudflare Worker's `fetch()` can only reliably reach **ports 80 and 443** — it
cannot talk to a non-standard port like `:3000`, even for a DNS-only (grey-cloud)
origin. So the API is published at **`https://search-api.theradicalparty.com`**
(port 443) via a **Cloudflare Tunnel**, which also gives TLS and requires no open
inbound ports on the VM.

```
Worker ──https:443──▶ Cloudflare ──tunnel──▶ cloudflared (VM) ──▶ 127.0.0.1:3000 (API)
```

## Backend (VM)

### 1. One-time: create the tunnel

In the Cloudflare **Zero Trust** dashboard → **Networks → Tunnels**:

1. **Create a tunnel** (type: *Cloudflared*), name it e.g. `search-api`.
2. Copy the **connector token** (the long string in the `cloudflared service
   install <TOKEN>` snippet).
3. Add a **Public Hostname**:
   - Subdomain `search-api`, domain `theradicalparty.com`
   - Service: **HTTP** `://localhost:3000`

   Cloudflare automatically creates the orange-cloud CNAME
   `search-api.theradicalparty.com → <tunnel-id>.cfargotunnel.com`.

### 2. Configure credentials

Copy the template and fill it in (this file is git-ignored):

```bash
cp scripts/deploy.env.example scripts/deploy.env
# set VM_HOST / VM_USER / VM_PASS and CLOUDFLARED_TOKEN
```

> ⚠️ The VM password previously committed in `deploy.sh` was rejected by the VM
> on 2026-07-22. Confirm working SSH credentials before deploying.

### 3. Deploy

```bash
cd scripts && ./deploy.sh
```

This syncs `api/` and `crawler/` to the VM and runs `install-vm.sh`, which:
- installs Meilisearch (systemd `meilisearch.service`, `:7700`, master key)
- installs the API (systemd `search-api.service`, `:3000`)
- installs the crawler under `/opt/search-crawler`
- if `CLOUDFLARED_TOKEN` is set: installs `cloudflared` as a systemd service

### 4. Crawl

```bash
ssh root@<VM> 'cd /opt/search-crawler && LIMIT=50000 CONCURRENCY=8 npm start'
```

### 5. Verify

```bash
curl https://search-api.theradicalparty.com/health
curl 'https://search-api.theradicalparty.com/search?q=news'
```

## Frontend (Cloudflare Worker)

`frontend/wrangler.jsonc` already points `API_URL` at
`https://search-api.theradicalparty.com` and routes
`search.theradicalparty.com/*`. Deploy with:

```bash
cd frontend && npm install && npm run deploy
```

> Deploy the frontend **after** the tunnel + API are live, otherwise
> `search.theradicalparty.com` will return API errors until the backend answers.

## Hardening (optional)

- Firewall the VM so `:3000` and `:7700` are not reachable from the public
  internet — all external access should go through the tunnel.
- Rotate the Meilisearch master key (currently `masterKey`) and update the
  `MEILI_KEY` env in `install-vm.sh`.
