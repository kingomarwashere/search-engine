#!/bin/bash
set -e

echo "=== Installing Meilisearch ==="
curl -L https://install.meilisearch.com | sh
mv ./meilisearch /usr/local/bin/meilisearch

echo "=== Creating Meilisearch systemd service ==="
cat > /etc/systemd/system/meilisearch.service << 'EOF'
[Unit]
Description=Meilisearch Search Engine
After=network.target

[Service]
User=root
ExecStart=/usr/local/bin/meilisearch --http-addr 0.0.0.0:7700 --master-key masterKey --db-path /var/lib/meilisearch/data
Restart=always
RestartSec=5
Environment=MEILI_NO_ANALYTICS=true

[Install]
WantedBy=multi-user.target
EOF

mkdir -p /var/lib/meilisearch/data
systemctl daemon-reload
systemctl enable meilisearch
systemctl start meilisearch
echo "Meilisearch started"

echo "=== Deploying Search API ==="
mkdir -p /opt/search-api
cp -r /tmp/search-api/. /opt/search-api/
cd /opt/search-api
npm install --production

cat > /etc/systemd/system/search-api.service << 'EOF'
[Unit]
Description=Search Engine API
After=network.target meilisearch.service

[Service]
User=root
WorkingDirectory=/opt/search-api
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=PORT=3000
Environment=MEILI_URL=http://localhost:7700
Environment=MEILI_KEY=masterKey
Environment=NODE_ID=main

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable search-api
systemctl start search-api
echo "Search API started on :3000"

echo "=== Deploying Crawler ==="
mkdir -p /opt/search-crawler
cp -r /tmp/search-crawler/. /opt/search-crawler/
cd /opt/search-crawler
npm install

echo "=== Installing cloudflared tunnel (exposes API over HTTPS/443) ==="
# A deployed Cloudflare Worker's fetch() can't reach :3000, so the API is
# published at https://search-api.theradicalparty.com via a Cloudflare Tunnel.
# Provide CLOUDFLARED_TOKEN (connector token from the Zero Trust dashboard);
# route the public hostname search-api.theradicalparty.com -> http://localhost:3000 there.
if [ -n "$CLOUDFLARED_TOKEN" ]; then
  if ! command -v cloudflared >/dev/null 2>&1; then
    curl -L --output /tmp/cloudflared.deb \
      https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    dpkg -i /tmp/cloudflared.deb
  fi
  cloudflared service install "$CLOUDFLARED_TOKEN"
  systemctl enable cloudflared
  systemctl restart cloudflared
  echo "cloudflared installed and running"
else
  echo "CLOUDFLARED_TOKEN not set — skipping tunnel install (see docs/DEPLOY.md)"
fi

echo ""
echo "Done! Services running:"
echo "  Meilisearch: http://localhost:7700"
echo "  Search API:  http://localhost:3000 (published via tunnel at https://search-api.theradicalparty.com)"
echo ""
echo "To start crawling:"
echo "  cd /opt/search-crawler && LIMIT=50000 CONCURRENCY=8 npm start"
