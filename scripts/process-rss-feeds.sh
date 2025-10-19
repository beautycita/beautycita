#!/bin/bash

# RSS Feed Processing Script for BeautyCita
# Processes new articles from RSS feeds and enhances them with AI

cd /var/www/beautycita.com

echo "[$(date)] Starting RSS feed processing..."

# Run the standalone RSS enhancer script
node /var/www/beautycita.com/scripts/run-rss-enhancer.js

# Capture exit code
exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "[$(date)] RSS processing completed successfully"
else
    echo "[$(date)] RSS processing failed with exit code: $exit_code"
fi

exit $exit_code