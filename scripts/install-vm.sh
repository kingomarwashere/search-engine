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

echo ""
echo "Done! Services running:"
echo "  Meilisearch: http://localhost:7700"
echo "  Search API:  http://localhost:3000"
echo ""
echo "To start crawling:"
echo "  cd /opt/search-crawler && LIMIT=50000 CONCURRENCY=8 npm start"
