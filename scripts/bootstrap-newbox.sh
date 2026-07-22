#!/bin/bash
# Provision a fresh dedicated search box: Node 22 + Meilisearch + api + crawler.
# Secrets passed via env: MEILI_KEY, ANTHROPIC_API_KEY. Idempotent-ish.
set -e
: "${MEILI_KEY:?set MEILI_KEY}" "${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

echo "=== packages ==="
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq git curl ca-certificates >/dev/null

echo "=== Node 22 ==="
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
  apt-get install -y -qq nodejs >/dev/null
fi
node -v

echo "=== clone repo ==="
rm -rf /opt/search-engine
git clone --depth 1 https://github.com/kingomarwashere/search-engine /opt/search-engine >/dev/null 2>&1
cd /opt/search-engine/api && npm install --omit=dev --no-audit --no-fund >/dev/null 2>&1
cd /opt/search-engine/crawler && npm install --no-audit --no-fund >/dev/null 2>&1
echo "deps installed"

echo "=== Meilisearch ==="
if [ ! -x /usr/local/bin/meilisearch ]; then
  curl -sL https://install.meilisearch.com | sh >/dev/null 2>&1
  mv ./meilisearch /usr/local/bin/meilisearch
fi
mkdir -p /var/lib/meilisearch/data
cat > /etc/systemd/system/meilisearch.service <<EOF
[Unit]
Description=Meilisearch
After=network.target
[Service]
ExecStart=/usr/local/bin/meilisearch --http-addr 127.0.0.1:7700 --master-key ${MEILI_KEY} --db-path /var/lib/meilisearch/data --env production
Restart=always
RestartSec=5
Environment=MEILI_NO_ANALYTICS=true
[Install]
WantedBy=multi-user.target
EOF

echo "=== search-api service ==="
cat > /etc/systemd/system/search-api.service <<EOF
[Unit]
Description=Search API
After=network.target meilisearch.service
[Service]
WorkingDirectory=/opt/search-engine/api
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=MEILI_URL=http://127.0.0.1:7700
Environment=MEILI_KEY=${MEILI_KEY}
Environment=ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
Environment=ANSWER_MODEL=claude-haiku-4-5
Environment=NODE_ID=main
[Install]
WantedBy=multi-user.target
EOF

echo "=== search-crawler service (bigger crawl for the 93GB box) ==="
cat > /etc/systemd/system/search-crawler.service <<EOF
[Unit]
Description=RADICAL_SEARCH crawler
After=network.target meilisearch.service
Requires=meilisearch.service
[Service]
Type=simple
WorkingDirectory=/opt/search-engine/crawler
ExecStart=/usr/bin/node --experimental-sqlite src/index.js
Restart=on-failure
RestartSec=15
Environment=LIMIT=1500000
Environment=SEED_DOMAINS=60000
Environment=CONCURRENCY=48
Environment=MAX_DEPTH=2
Environment=MAX_PAGES_PER_DOMAIN=40
Environment=HOST_DELAY_MS=500
Environment=FETCH_TIMEOUT_MS=5000
Environment=BODY_CHARS=2500
Environment=FRONTIER_DB=/opt/search-engine/crawler/frontier.db
Environment=MEILI_URL=http://127.0.0.1:7700
Environment=MEILI_KEY=${MEILI_KEY}
[Install]
WantedBy=multi-user.target
EOF

echo "=== disk guard (stop crawl if <5GB free) ==="
cat > /usr/local/bin/crawl-diskguard.sh <<'EOF'
#!/bin/sh
FREE=$(df --output=avail / | tail -1 | tr -d ' ')
if [ "$FREE" -lt 5000000 ]; then
  systemctl stop search-crawler
  curl -s -d "RADICAL_SEARCH crawler STOPPED on search-engine box: disk free ${FREE}KB <5GB" ntfy.sh/radicalparty-vm-alerts-x7k2q9 >/dev/null 2>&1
fi
EOF
chmod +x /usr/local/bin/crawl-diskguard.sh
( crontab -l 2>/dev/null | grep -v crawl-diskguard; echo "*/5 * * * * /usr/local/bin/crawl-diskguard.sh" ) | crontab -

echo "=== start meili + api ==="
systemctl daemon-reload
systemctl enable --now meilisearch search-api >/dev/null 2>&1
sleep 4
systemctl is-active meilisearch search-api
echo "BOOTSTRAP DONE"
