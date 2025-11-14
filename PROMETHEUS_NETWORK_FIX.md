# Prometheus Network Fix - Deployment Guide

**Issue:** Prometheus container cannot scrape metrics from backend running on host (port 4000)

**Root Cause:** Prometheus runs in Docker container on `beautycita-network`, but tries to reach host services at `172.17.0.1:4000` which is inaccessible from within the container network.

**Solution:** Use `host.docker.internal` DNS name to allow container to reach host services.

---

## Changes Made

### 1. docker-compose.yml
Added `extra_hosts` to Prometheus service to enable host network access:

```yaml
prometheus:
  # ... existing config ...
  extra_hosts:
    - "host.docker.internal:host-gateway"
```

### 2. monitoring/prometheus.yml
Updated all host-based targets from `172.17.0.1` to `host.docker.internal`:

- `beautycita-backend`: `host.docker.internal:4000`
- `nginx-exporter`: `host.docker.internal:9113`
- `postgres-exporter`: `host.docker.internal:9187`
- `redis-exporter`: `host.docker.internal:9121`
- `beautycita-custom-metrics`: `host.docker.internal:4000`
- `beautycita-business-metrics`: `host.docker.internal:4000`

---

## Deployment Steps

### Option 1: Quick Reload (Recommended)

If Prometheus supports hot reload:

```bash
# SSH into server
ssh www-data@beautycita.com

# Navigate to project directory
cd /var/www/beautycita.com

# Copy updated files (if working locally, use scp first)
# Then reload Prometheus config without restart
curl -X POST http://localhost:9090/prometheus/-/reload \
  -u admin:monitoring123

# Or via public URL:
curl -X POST https://beautycita.com/prometheus/-/reload \
  -u admin:monitoring123
```

### Option 2: Docker Compose Restart

Full restart of monitoring stack:

```bash
# SSH into server
ssh www-data@beautycita.com

# Navigate to project directory
cd /var/www/beautycita.com

# Stop Prometheus container
docker-compose --profile monitoring stop prometheus

# Start with new configuration
docker-compose --profile monitoring up -d prometheus

# Verify container is running
docker-compose ps prometheus

# Check logs for errors
docker-compose logs -f prometheus
```

### Option 3: Complete Stack Restart

If other services also need the update:

```bash
# SSH into server
ssh www-data@beautycita.com

# Navigate to project directory
cd /var/www/beautycita.com

# Restart entire monitoring stack
docker-compose --profile monitoring down
docker-compose --profile monitoring up -d

# Verify all services are up
docker-compose --profile monitoring ps
```

---

## Verification Steps

### 1. Check Prometheus Targets

```bash
# Via browser
https://beautycita.com/prometheus/targets

# Via API
curl -s "https://beautycita.com/prometheus/api/v1/targets" \
  -u admin:monitoring123 | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

**Expected:** All targets should show `health: "up"` without errors

### 2. Query Backend Metrics

```bash
# Check if HTTP request metrics are available
curl -s "https://beautycita.com/prometheus/api/v1/query?query=beautycita_http_requests_total" \
  -u admin:monitoring123 | jq '.data.result'
```

**Expected:** Should return array of metrics with actual data, not empty `[]`

### 3. Verify Direct Endpoint Access

```bash
# Test that metrics endpoint still works directly
curl -s https://beautycita.com/api/metrics | head -20

# Check for specific metrics
curl -s https://beautycita.com/api/metrics | grep "beautycita_http_requests_total"
```

**Expected:** Should return Prometheus-formatted metrics

### 4. Check Grafana Dashboards

1. Open https://beautycita.com/grafana/
2. Login: admin / admin123
3. Navigate to dashboards
4. Verify graphs show data (may take 15-30 seconds after restart)

---

## Troubleshooting

### Issue: Targets still show as "down"

**Check 1:** Verify host.docker.internal resolves inside container
```bash
docker exec beautycita-prometheus ping -c 3 host.docker.internal
```

**Check 2:** Test if backend port 4000 is accessible from container
```bash
docker exec beautycita-prometheus wget -O- http://host.docker.internal:4000/api/metrics
```

**Check 3:** Verify backend is actually running on port 4000
```bash
sudo -u www-data pm2 status
netstat -tlnp | grep 4000
```

### Issue: "host.docker.internal: Name or service not known"

This means your Docker version doesn't support `host.docker.internal`. Alternative solutions:

**Solution A:** Use host network mode for Prometheus (less secure)
```yaml
prometheus:
  network_mode: host
  # Remove: networks, ports sections
```

**Solution B:** Use server's actual IP address
```bash
# Find server IP
ip addr show | grep "inet "

# Update prometheus.yml targets to use actual IP
# Example: 192.168.1.100:4000 instead of host.docker.internal:4000
```

**Solution C:** Add custom network route
```yaml
extra_hosts:
  - "host.docker.internal:192.168.1.100"  # Use your actual host IP
```

### Issue: Metrics endpoint returns 404

**Check:** Verify backend is running and metrics endpoint exists
```bash
curl -v https://beautycita.com/api/metrics 2>&1 | grep "< HTTP"
curl -v https://beautycita.com/api/metrics/business 2>&1 | grep "< HTTP"
```

Should return `HTTP/1.1 200 OK`, not 404

### Issue: Authentication errors in Prometheus

**Check:** Verify Prometheus doesn't have auth on `/api/metrics`
```bash
# This should work without authentication
curl -s http://localhost:4000/api/metrics | head -5
```

If it requires auth, you'll need to add basic_auth to prometheus.yml

---

## Rollback Plan

If issues occur after deployment:

```bash
# SSH into server
ssh www-data@beautycita.com
cd /var/www/beautycita.com

# Revert prometheus.yml changes
git checkout monitoring/prometheus.yml

# Revert docker-compose.yml changes
git checkout docker-compose.yml

# Restart Prometheus with old config
docker-compose --profile monitoring restart prometheus
```

---

## Success Metrics

After deployment, you should see:

1. ✅ All Prometheus targets showing `health: "up"`
2. ✅ Query `beautycita_http_requests_total` returns data
3. ✅ Grafana dashboards populate with metrics
4. ✅ No errors in Prometheus logs
5. ✅ Metrics endpoint accessible: https://beautycita.com/api/metrics

---

## Next Steps After Fix

Once metrics are flowing:

1. **Create Grafana Dashboards:**
   - HTTP request rates and latency
   - Database query performance
   - Business metrics (bookings, revenue, users)
   - System resources (CPU, memory, disk)

2. **Set Up Alerts:**
   - High error rate (5xx responses)
   - Slow response times (>2s)
   - Database connection pool exhaustion
   - High memory usage (>80%)

3. **Document Metrics:**
   - Create metrics catalog
   - Add descriptions for custom metrics
   - Document dashboard usage

---

## Additional Files Created

- `backend/src/metrics.js` - Comprehensive metrics module (25+ metrics)
- `backend/src/middleware/metricsMiddleware.js` - HTTP metrics middleware
- `backend/__tests__/__mocks__/redis.js` - Redis mock for testing

These are more comprehensive than current implementation and ready to use if needed.

---

**Last Updated:** 2025-11-05
**Author:** AI Assistant
**Related Issues:** Prometheus scraping, Docker networking, host-to-container communication
