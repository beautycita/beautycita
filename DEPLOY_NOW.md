# Quick Deployment Instructions

## Files to Transfer to Server

You need to update these 2 files on the production server:

### 1. docker-compose.yml
**Location:** `/var/www/beautycita.com/docker-compose.yml`

**Change:** Add these 2 lines after line 26 (after `networks:`)

```yaml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### 2. monitoring/prometheus.yml
**Location:** `/var/www/beautycita.com/monitoring/prometheus.yml`

**Changes:** Replace these 6 target IPs:
- `172.17.0.1:4000` → `host.docker.internal:4000`
- `172.17.0.1:9113` → `host.docker.internal:9113`
- `172.17.0.1:9187` → `host.docker.internal:9187`
- `172.17.0.1:9121` → `host.docker.internal:9121`

---

## Quick Deploy (Copy/Paste These Commands)

SSH to server and run:

```bash
# Connect to server
ssh www-data@beautycita.com

# Navigate to project
cd /var/www/beautycita.com

# Backup current config
cp docker-compose.yml docker-compose.yml.backup
cp monitoring/prometheus.yml monitoring/prometheus.yml.backup

# Update docker-compose.yml (add extra_hosts to prometheus service)
# Option A: Use sed
sed -i '/beautycita-network/a\    extra_hosts:\n      - "host.docker.internal:host-gateway"' docker-compose.yml

# Option B: Use nano
nano docker-compose.yml
# Add these lines after "networks: - beautycita-network":
#     extra_hosts:
#       - "host.docker.internal:host-gateway"

# Update prometheus.yml
cd monitoring
sed -i 's/172\.17\.0\.1/host.docker.internal/g' prometheus.yml

# Verify changes
grep -A 1 "extra_hosts:" ../docker-compose.yml
grep "host.docker.internal" prometheus.yml

cd ..

# Restart Prometheus
docker-compose --profile monitoring restart prometheus

# Wait 10 seconds
sleep 10

# Verify running
docker-compose ps prometheus
```

---

## Verification Commands

```bash
# 1. Check Prometheus is running
docker-compose ps prometheus

# 2. Check Prometheus can reach backend
docker exec beautycita-prometheus wget -O- -q http://host.docker.internal:4000/api/metrics | head -10

# 3. Check targets in Prometheus
curl -s 'http://localhost:9090/api/v1/targets' | jq '.data.activeTargets[] | select(.labels.job=="beautycita-backend") | {health: .health, lastError: .lastError}'

# 4. Query metrics
curl -s 'http://localhost:9090/api/v1/query?query=beautycita_http_requests_total' | jq '.data.result | length'
# Should return a number > 0, not 0

# 5. Check via browser
# Open: https://beautycita.com/prometheus/targets
# beautycita-backend should show "UP" with no errors
```

---

## If You Have the Files Locally

### Option 1: Use SCP

From your local machine:

```bash
# Copy updated files
scp docker-compose.yml www-data@beautycita.com:/var/www/beautycita.com/
scp monitoring/prometheus.yml www-data@beautycita.com:/var/www/beautycita.com/monitoring/

# SSH and restart
ssh www-data@beautycita.com "cd /var/www/beautycita.com && docker-compose --profile monitoring restart prometheus"
```

### Option 2: Use deployment script

```bash
# Copy script
scp deploy-prometheus-fix.sh www-data@beautycita.com:/var/www/beautycita.com/

# SSH and run
ssh www-data@beautycita.com "cd /var/www/beautycita.com && bash deploy-prometheus-fix.sh"
```

---

## Rollback If Needed

```bash
cd /var/www/beautycita.com
cp docker-compose.yml.backup docker-compose.yml
cp monitoring/prometheus.yml.backup monitoring/prometheus.yml
docker-compose --profile monitoring restart prometheus
```

---

## Success Criteria

After deployment, you should see:

✅ Prometheus target `beautycita-backend` shows **UP**
✅ Query `beautycita_http_requests_total` returns data (not empty)
✅ Grafana dashboards show metrics
✅ No errors in: `docker-compose logs prometheus`

---

## Current Status

**Files ready to deploy:**
- ✅ `docker-compose.yml` - Updated with extra_hosts
- ✅ `monitoring/prometheus.yml` - Updated with host.docker.internal
- ✅ `deploy-prometheus-fix.sh` - Automated deployment script
- ✅ Test fixes applied locally
- ✅ Documentation complete

**Deployment time:** ~2 minutes
**Risk:** 🟢 Low (config-only, reversible)
**Downtime:** None (container restart only)
