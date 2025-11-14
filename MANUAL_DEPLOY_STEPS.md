# Manual Deployment Steps

## Step 1: SSH into the server

```bash
ssh beautycita@74.208.218.18
# Password: JUs3f2m3Fa
```

## Step 2: Switch to bc user (if needed)

```bash
# If you're not already bc user
su - bc
# Or: sudo su - bc
```

## Step 3: Navigate to project directory

```bash
cd /var/www/beautycita.com
```

## Step 4: Create backups

```bash
sudo -u www-data cp docker-compose.yml docker-compose.yml.backup.$(date +%Y%m%d_%H%M%S)
sudo -u www-data cp monitoring/prometheus.yml monitoring/prometheus.yml.backup.$(date +%Y%m%d_%H%M%S)
```

## Step 5: Update docker-compose.yml

```bash
# Use nano or vi
sudo -u www-data nano docker-compose.yml
```

Find the `prometheus:` service section (around line 5-28) and add these 2 lines after `- beautycita-network`:

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**It should look like this:**

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: beautycita-prometheus
    restart: unless-stopped
    # ... other config ...
    networks:
      - beautycita-network
    extra_hosts:                              # ← ADD THIS LINE
      - "host.docker.internal:host-gateway"   # ← ADD THIS LINE
    profiles:
      - monitoring
```

Save and exit (Ctrl+O, Enter, Ctrl+X for nano)

## Step 6: Update prometheus.yml

```bash
sudo -u www-data nano monitoring/prometheus.yml
```

Find and replace all occurrences of `172.17.0.1` with `host.docker.internal`:

**Find these lines and update them:**

```yaml
# Line ~42: beautycita-backend
- targets: ['host.docker.internal:4000']  # WAS: 172.17.0.1:4000

# Line ~50: nginx-exporter
- targets: ['host.docker.internal:9113']  # WAS: 172.17.0.1:9113

# Line ~57: postgres-exporter
- targets: ['host.docker.internal:9187']  # WAS: 172.17.0.1:9187

# Line ~64: redis-exporter
- targets: ['host.docker.internal:9121']  # WAS: 172.17.0.1:9121

# Line ~114: beautycita-custom-metrics
- targets: ['host.docker.internal:4000']  # WAS: 172.17.0.1:4000

# Line ~124: beautycita-business-metrics
- targets: ['host.docker.internal:4000']  # WAS: 172.17.0.1:4000
```

**Or use sed (automated):**

```bash
sudo -u www-data sed -i 's/172\.17\.0\.1/host.docker.internal/g' monitoring/prometheus.yml
```

Save and exit

## Step 7: Verify changes

```bash
# Check docker-compose.yml has extra_hosts
grep -A 1 "extra_hosts:" docker-compose.yml

# Check prometheus.yml has new targets
grep "host.docker.internal" monitoring/prometheus.yml
```

You should see output like:
```
extra_hosts:
  - "host.docker.internal:host-gateway"

      - targets: ['host.docker.internal:4000']
      - targets: ['host.docker.internal:9113']
      ...
```

## Step 8: Restart Prometheus

```bash
sudo -u www-data docker-compose --profile monitoring restart prometheus
```

## Step 9: Wait and verify

```bash
# Wait 10 seconds for startup
sleep 10

# Check Prometheus is running
sudo -u www-data docker-compose ps prometheus

# Should show: beautycita-prometheus ... Up ...
```

## Step 10: Test metrics scraping

```bash
# Test backend metrics endpoint is accessible
curl -s http://localhost:4000/api/metrics | head -20

# Test Prometheus can see the metrics
curl -s 'http://localhost:9090/api/v1/query?query=beautycita_http_requests_total' | jq '.data.result | length'

# Should return a number > 0 (if jq is available)
# Or just check if you see "result":[...data...] instead of "result":[]
```

## Step 11: Verify in browser

1. **Check Prometheus Targets:**
   - Open: https://beautycita.com/prometheus/targets
   - Find `beautycita-backend` job
   - Status should be **UP** (green)
   - No errors shown

2. **Check Grafana Dashboards:**
   - Open: https://beautycita.com/grafana/
   - Login: admin / admin123
   - Navigate to any dashboard
   - Graphs should show data (may take 30-60 seconds)

## Success Criteria ✅

- [ ] `docker-compose.yml` has `extra_hosts` section
- [ ] `prometheus.yml` has `host.docker.internal` targets (6 places)
- [ ] Backups created (`.backup` files exist)
- [ ] Prometheus container is running
- [ ] Prometheus target `beautycita-backend` shows UP
- [ ] Query returns data (not empty array)
- [ ] Grafana shows metrics

## If Something Goes Wrong - Rollback

```bash
cd /var/www/beautycita.com

# Find your backup files
ls -lt docker-compose.yml.backup*
ls -lt monitoring/prometheus.yml.backup*

# Restore from latest backup (replace TIMESTAMP with actual)
sudo -u www-data cp docker-compose.yml.backup.TIMESTAMP docker-compose.yml
sudo -u www-data cp monitoring/prometheus.yml.backup.TIMESTAMP monitoring/prometheus.yml

# Restart Prometheus
sudo -u www-data docker-compose --profile monitoring restart prometheus
```

## Alternative: Use the deployment script

If you prefer automation, upload and run the deployment script:

```bash
# On your local machine, upload the script
scp deploy-prometheus-fix.sh beautycita@74.208.218.18:/tmp/

# On the server
ssh beautycita@74.208.218.18
cd /var/www/beautycita.com
sudo -u www-data bash /tmp/deploy-prometheus-fix.sh
```

---

## Quick Reference Commands

```bash
# Backup
sudo -u www-data cp docker-compose.yml docker-compose.yml.backup
sudo -u www-data cp monitoring/prometheus.yml monitoring/prometheus.yml.backup

# Update configs
sudo -u www-data nano docker-compose.yml  # Add extra_hosts
sudo -u www-data sed -i 's/172\.17\.0\.1/host.docker.internal/g' monitoring/prometheus.yml

# Restart
sudo -u www-data docker-compose --profile monitoring restart prometheus

# Verify
grep -A 1 "extra_hosts:" docker-compose.yml
grep "host.docker.internal" monitoring/prometheus.yml
curl -s 'http://localhost:9090/api/v1/query?query=up{job="beautycita-backend"}'
```

---

**Time Required:** 5-10 minutes
**Risk:** 🟢 Very Low (config-only, fully reversible)
**Downtime:** None (only Prometheus container restarts)
