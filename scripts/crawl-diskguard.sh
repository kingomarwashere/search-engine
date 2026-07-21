#!/bin/sh
# Autonomous safety: stop the crawler if disk gets low, so it can never fill
# the shared VM and break other services. Runs from cron every 5 min.
THRESHOLD_KB=800000   # 800 MB
FREE=$(df --output=avail / | tail -1 | tr -d ' ')
if [ "$FREE" -lt "$THRESHOLD_KB" ]; then
  systemctl stop search-crawler
  curl -s -d "RADICAL_SEARCH crawler STOPPED on adrian-bingo: disk free ${FREE}KB < ${THRESHOLD_KB}KB" \
    ntfy.sh/radicalparty-vm-alerts-x7k2q9 >/dev/null 2>&1
fi
