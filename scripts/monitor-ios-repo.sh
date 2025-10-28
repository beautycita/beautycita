#!/bin/bash
#
# BeautyCita iOS Repository Monitor
# Checks for updates every hour, cancels pending builds if new push detected
#

LOCK_FILE="/tmp/ios-build.lock"
LAST_COMMIT_FILE="/tmp/ios-last-commit"
IOS_REPO_URL="https://github.com/beautycita/beautycita-ios.git"
BUILD_SCRIPT="/var/www/beautycita.com/scripts/ios-build-automation.sh"

# Check for updates
cd /tmp
LATEST_COMMIT=$(git ls-remote "${IOS_REPO_URL}" HEAD | awk '{print $1}')
LAST_COMMIT=$(cat "${LAST_COMMIT_FILE}" 2>/dev/null || echo "")

if [ "${LATEST_COMMIT}" != "${LAST_COMMIT}" ]; then
    echo "[$(date)] New commit detected: ${LATEST_COMMIT}"

    # Cancel any running builds
    if [ -f "${LOCK_FILE}" ]; then
        PID=$(cat "${LOCK_FILE}")
        if ps -p "${PID}" > /dev/null; then
            echo "Canceling previous build (PID: ${PID})"
            kill "${PID}" 2>/dev/null || true
        fi
        rm -f "${LOCK_FILE}"
    fi

    # Start new build (in background with lock)
    echo $$ > "${LOCK_FILE}"
    echo "${LATEST_COMMIT}" > "${LAST_COMMIT_FILE}"

    # Run build script
    sudo -u www-data "${BUILD_SCRIPT}"

    # Remove lock when done
    rm -f "${LOCK_FILE}"
else
    echo "[$(date)] No changes detected"
fi
