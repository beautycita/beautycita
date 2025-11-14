#!/bin/bash
#
# Prometheus Network Fix Deployment Script
# Deploys the host.docker.internal configuration fix
#
# Usage: Run this script on the production server
#   ssh www-data@beautycita.com
#   cd /var/www/beautycita.com
#   bash deploy-prometheus-fix.sh
#

set -e  # Exit on error

echo "========================================"
echo "Prometheus Network Fix Deployment"
echo "========================================"
echo ""

# Check we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Are you in /var/www/beautycita.com?"
    exit 1
fi

echo "📋 Step 1: Backing up current configuration..."
cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
cp monitoring/prometheus.yml monitoring/prometheus.yml.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backups created"
echo ""

echo "📝 Step 2: Updating docker-compose.yml..."
# Check if extra_hosts already exists
if grep -q "extra_hosts:" docker-compose.yml; then
    echo "⚠️  extra_hosts already exists in docker-compose.yml"
else
    # Add extra_hosts after networks line in prometheus service
    sed -i '/prometheus:/,/profiles:/ {
        /networks:/a\    extra_hosts:\n      - "host.docker.internal:host-gateway"
    }' docker-compose.yml
    echo "✅ Added extra_hosts to Prometheus service"
fi
echo ""

echo "📝 Step 3: Updating prometheus.yml targets..."
cd monitoring

# Update beautycita-backend
sed -i "s/172\.17\.0\.1:4000/host.docker.internal:4000/g" prometheus.yml

# Update nginx-exporter
sed -i "s/172\.17\.0\.1:9113/host.docker.internal:9113/g" prometheus.yml

# Update postgres-exporter
sed -i "s/172\.17\.0\.1:9187/host.docker.internal:9187/g" prometheus.yml

# Update redis-exporter
sed -i "s/172\.17\.0\.1:9121/host.docker.internal:9121/g" prometheus.yml

echo "✅ Updated all targets in prometheus.yml"
cd ..
echo ""

echo "🔍 Step 4: Verifying changes..."
echo "Checking docker-compose.yml:"
grep -A 2 "extra_hosts:" docker-compose.yml || echo "❌ extra_hosts not found"
echo ""
echo "Checking prometheus.yml targets:"
grep "host.docker.internal" monitoring/prometheus.yml | head -5
echo ""

echo "🔄 Step 5: Restarting Prometheus..."
docker-compose --profile monitoring restart prometheus

echo "⏳ Waiting for Prometheus to start (10 seconds)..."
sleep 10
echo ""

echo "✅ Step 6: Verifying Prometheus is running..."
if docker ps | grep -q "beautycita-prometheus"; then
    echo "✅ Prometheus container is running"
else
    echo "❌ Prometheus container not found!"
    echo "Check logs with: docker-compose logs prometheus"
    exit 1
fi
echo ""

echo "🔍 Step 7: Testing metrics endpoint..."
if curl -s -f http://localhost:4000/api/metrics > /dev/null; then
    echo "✅ Backend metrics endpoint is accessible"
else
    echo "⚠️  Backend metrics endpoint not accessible"
    echo "Check if backend is running: pm2 status"
fi
echo ""

echo "🎯 Step 8: Checking Prometheus targets..."
echo "Run this command to check target health:"
echo "  curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'"
echo ""
echo "Or visit: https://beautycita.com/prometheus/targets"
echo ""

echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Check Prometheus targets: https://beautycita.com/prometheus/targets"
echo "2. Query metrics: curl -s 'https://beautycita.com/prometheus/api/v1/query?query=beautycita_http_requests_total' -u admin:monitoring123"
echo "3. Check Grafana dashboards: https://beautycita.com/grafana/"
echo ""
echo "If issues occur, rollback with:"
echo "  cp docker-compose.yml.backup.* docker-compose.yml"
echo "  cp monitoring/prometheus.yml.backup.* monitoring/prometheus.yml"
echo "  docker-compose --profile monitoring restart prometheus"
echo ""
