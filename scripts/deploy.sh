#!/bin/bash
set -e

# Load VM credentials from git-ignored deploy.env (copy deploy.env.example).
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/deploy.env" ]; then
  set -a; . "$SCRIPT_DIR/deploy.env"; set +a
fi

VM_HOST="${VM_HOST:?set VM_HOST in scripts/deploy.env}"
VM_USER="${VM_USER:?set VM_USER in scripts/deploy.env}"
VM_PASS="${VM_PASS:?set VM_PASS in scripts/deploy.env}"

ssh_cmd() { sshpass -p "$VM_PASS" ssh -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" "$@"; }
scp_cmd() { sshpass -p "$VM_PASS" scp -o StrictHostKeyChecking=no -r "$@"; }

echo "=== Syncing files to VM ==="
ssh_cmd "mkdir -p /tmp/search-api /tmp/search-crawler"
scp_cmd ../api/. "$VM_USER@$VM_HOST:/tmp/search-api/"
scp_cmd ../crawler/. "$VM_USER@$VM_HOST:/tmp/search-crawler/"
scp_cmd install-vm.sh "$VM_USER@$VM_HOST:/tmp/install-vm.sh"

echo "=== Running install script ==="
ssh_cmd "bash /tmp/install-vm.sh"

echo "=== Done ==="
ssh_cmd "systemctl status meilisearch --no-pager && systemctl status search-api --no-pager"
