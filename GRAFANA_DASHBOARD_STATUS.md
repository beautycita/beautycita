# Grafana Dashboard Setup Status - BeautyCita

**Date:** November 12, 2025
**Status:** Partially Complete

---

## ✅ Completed Steps

### 1. Grafana Container Running
- Container `beautycita-grafana` is UP and running
- Listening on port 3000 inside Docker
- Configured with correct subpath settings:
  - `GF_SERVER_ROOT_URL=https://beautycita.com/grafana/`
  - `GF_SERVER_SERVE_FROM_SUB_PATH=true`
- Login credentials: admin / admin123

### 2. Prometheus Data Source Configured
- Created provisioning file: `/var/www/beautycita.com/monitoring/grafana/datasources/prometheus.yml`
- Data source automatically configured on Grafana startup:
  - Name: Prometheus
  - URL: http://host.docker.internal:9090
  - Access: proxy (server-side)
  - Default: true

**File content:**
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://host.docker.internal:9090
    isDefault: true
    editable: true
    jsonData:
      httpMethod: POST
      timeInterval: 15s
```

---

## ⚠️ Pending Steps

### Critical: Fix Nginx Configuration

**Problem:** The nginx configuration file `/etc/nginx/sites-enabled/beautycita.com.conf` has malformed Grafana location blocks. Multiple duplicate blocks were added on single lines during automated editing.

**Required Action:** Manually edit the nginx config to add the proper Grafana location block.

**Location:** Insert after the `/debug/` location block and before the Prometheus block (around line 164).

**Correct configuration to add:**
```nginx
    # Grafana Dashboard
    location ^~ /grafana/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for real-time logs
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;

        # WebSocket support for live dashboards
        proxy_read_timeout 86400;
    }
```

**Manual fix steps:**
```bash
# SSH to server
ssh beautycita@74.208.218.18

# Edit nginx config
sudo nano /etc/nginx/sites-enabled/beautycita.com.conf

# Find all the malformed "# Grafana Dashboard" blocks (lines 164-196)
# Delete ALL of them completely

# Then add the correct block shown above after the /debug/ section

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Test access
curl -I https://beautycita.com/grafana/
```

---

## 📊 Next Steps After Nginx Fix

### 3. Import Pre-Built Dashboards (10 minutes)

Once Grafana is accessible at https://beautycita.com/grafana/:

1. **Login:** admin / admin123

2. **Import Node.js Dashboard (ID: 11159)**
   - Go to: Dashboards → Import
   - Enter ID: `11159`
   - Select Prometheus data source
   - Click Import

3. **Import PostgreSQL Dashboard (ID: 9628)**
   - Go to: Dashboards → Import
   - Enter ID: `9628`
   - Select Prometheus data source
   - Click Import

4. **Import Node Exporter Dashboard (ID: 1860)**
   - Go to: Dashboards → Import
   - Enter ID: `1860`
   - Select Prometheus data source
   - Click Import

5. **Import Nginx Dashboard (ID: 12708)**
   - Go to: Dashboards → Import
   - Enter ID: `12708`
   - Select Prometheus data source
   - Click Import

### 4. Create Custom BeautyCita Dashboard (15 minutes)

Create a dashboard JSON file and import it:

**File:** `/var/www/beautycita.com/monitoring/grafana/dashboards/beautycita-overview.json`

```json
{
  "dashboard": {
    "title": "BeautyCita Platform Overview",
    "tags": ["beautycita", "api", "overview"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {
        "id": 1,
        "title": "API Request Rate",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [{
          "expr": "rate(http_requests_total{job=\"beautycita-api\"}[5m])",
          "legendFormat": "{{method}} {{route}}"
        }]
      },
      {
        "id": 2,
        "title": "API Response Time (p95)",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"beautycita-api\"}[5m]))",
          "legendFormat": "{{route}}"
        }]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8},
        "targets": [{
          "expr": "rate(http_requests_total{job=\"beautycita-api\",status=~\"5..\"}[5m])"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "reqps",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 0.1, "color": "yellow"},
                {"value": 1, "color": "red"}
              ]
            }
          }
        }
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8},
        "targets": [{
          "expr": "pg_stat_database_numbackends{datname=\"beautycita\"}"
        }]
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 8},
        "targets": [{
          "expr": "process_resident_memory_bytes{job=\"beautycita-api\"} / 1024 / 1024"
        }],
        "fieldConfig": {
          "defaults": {
            "unit": "mbytes",
            "thresholds": {
              "steps": [
                {"value": 0, "color": "green"},
                {"value": 500, "color": "yellow"},
                {"value": 1000, "color": "red"}
              ]
            }
          }
        }
      }
    ]
  },
  "overwrite": true
}
```

### 5. Configure Alert Rules (10 minutes)

In Grafana:

1. **Go to:** Alerting → Alert rules → New alert rule

2. **High API Error Rate:**
   - Name: High API Error Rate
   - Query: `rate(http_requests_total{job="beautycita-api",status=~"5.."}[5m]) > 0.1`
   - Condition: WHEN last() IS ABOVE 0.1
   - For: 5m

3. **High Database Connections:**
   - Name: High Database Connections
   - Query: `pg_stat_database_numbackends{datname="beautycita"} > 50`
   - Condition: WHEN last() IS ABOVE 50
   - For: 5m

4. **High Memory Usage:**
   - Name: High Memory Usage
   - Query: `process_resident_memory_bytes{job="beautycita-api"} / 1024 / 1024 / 1024 > 1`
   - Condition: WHEN last() IS ABOVE 1 (1 GB)
   - For: 10m

---

## 🔍 Verification

Once everything is set up:

```bash
# 1. Check Grafana is accessible
curl -I https://beautycita.com/grafana/

# 2. Check Prometheus is accessible
curl -I https://beautycita.com/prometheus/

# 3. Check Prometheus has targets
curl -s http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | {job: .labels.job, health: .health}'

# 4. Check backend metrics endpoint
curl -s https://beautycita.com/api/metrics | head -20

# 5. Test Grafana login
# Visit: https://beautycita.com/grafana/
# Login: admin / admin123
```

---

## 📈 Key Metrics to Monitor

### API Performance
- **Request Rate:** `rate(http_requests_total[5m])`
- **Response Time (p95):** `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Error Rate:** `rate(http_requests_total{status=~"5.."}[5m])`

### Database
- **Active Connections:** `pg_stat_database_numbackends{datname="beautycita"}`
- **Query Rate:** `rate(pg_stat_database_xact_commit{datname="beautycita"}[5m])`
- **Database Size:** `pg_database_size_bytes{datname="beautycita"}`

### System Resources
- **CPU Usage:** `rate(process_cpu_seconds_total[5m]) * 100`
- **Memory Usage:** `process_resident_memory_bytes / 1024 / 1024` (MB)
- **Disk Usage:** `node_filesystem_avail_bytes / node_filesystem_size_bytes * 100`

---

## 🎯 Summary

**What Works:**
- ✅ Grafana container running on port 3000
- ✅ Prometheus data source configured
- ✅ Prometheus collecting metrics from backend
- ✅ Backend `/api/metrics` endpoint exposed
- ✅ All monitoring containers running (Grafana, Prometheus, Loki, Promtail, Node Exporter)

**What Needs Manual Fix:**
- ⚠️ Nginx configuration for /grafana/ endpoint (malformed during automated editing)

**What Needs To Be Done After Fix:**
- ⏳ Import 4 pre-built dashboards
- ⏳ Create custom BeautyCita dashboard
- ⏳ Configure 3 alert rules
- ⏳ Test dashboard functionality

**Estimated Time to Complete:** 35-45 minutes after nginx fix

---

## 🛠️ Troubleshooting

### Issue: Grafana shows 502 Bad Gateway
**Solution:** Check if Grafana container is running: `docker ps | grep grafana`

### Issue: Grafana shows "Unable to connect to data source"
**Solution:**
```bash
# Check Prometheus is accessible from within Grafana container
docker exec beautycita-grafana curl -s http://host.docker.internal:9090/-/healthy
```

### Issue: Dashboards show "No data"
**Solution:**
```bash
# 1. Check backend metrics endpoint
curl https://beautycita.com/api/metrics

# 2. Check Prometheus is scraping
curl http://localhost:9090/api/v1/targets

# 3. Verify data exists in Prometheus
curl -s 'http://localhost:9090/api/v1/query?query=up' | jq
```

---

## 📚 Resources

- **Grafana Docs:** https://grafana.com/docs/
- **Prometheus Docs:** https://prometheus.io/docs/
- **Dashboard Library:** https://grafana.com/grafana/dashboards/
- **Setup Guide:** `/var/www/beautycita.com/GRAFANA_SETUP_COMPLETE.md`

---

**Last Updated:** November 12, 2025, 11:40 AM
**Status:** Nginx configuration needs manual fix, then proceed with dashboard imports
