# Grafana Dashboard Setup Guide - BeautyCita

## Current Status
✅ **Grafana is RUNNING** - Container started on port 3000
✅ **Prometheus is RUNNING** - Collecting metrics
⚠️ **Nginx Proxy NOT Configured** - https://beautycita.com/grafana/ returns main site
⚠️ **Data Sources NOT Configured** - Need to add Prometheus
⚠️ **Dashboards NOT Created** - Need to import/create

---

## Quick Access (Direct)

**Direct Access (bypassing nginx):**
```bash
# From server
curl http://localhost:3000/grafana/

# SSH Tunnel from your machine
ssh -L 3000:localhost:3000 beautycita@74.208.218.18
# Then visit: http://localhost:3000/grafana/
```

**Login Credentials:**
- Username: `admin`
- Password: `admin123`

---

## Step 1: Fix Nginx Proxy (5 minutes)

### Add Grafana Location Block to Nginx

Edit `/etc/nginx/sites-enabled/beautycita.com.conf` and add:

```nginx
# Grafana Dashboard
location /grafana/ {
    auth_basic "Monitoring";
    auth_basic_user_file /etc/nginx/.htpasswd-monitoring;

    proxy_pass http://localhost:3000/;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # WebSocket support
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

**Apply:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Test:**
```bash
curl -u admin:monitoring123 https://beautycita.com/grafana/
```

---

## Step 2: Configure Prometheus Data Source (3 minutes)

### Option A: Via Web UI
1. Log in to Grafana: https://beautycita.com/grafana/
2. Go to Configuration → Data Sources
3. Click "Add data source"
4. Select "Prometheus"
5. Configure:
   - Name: `Prometheus`
   - URL: `http://localhost:9090/prometheus`
   - Access: `Server (default)`
6. Click "Save & Test"

### Option B: Via Provisioning File

Create `/var/www/beautycita.com/monitoring/grafana/datasources/prometheus.yml`:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://host.docker.internal:9090/prometheus
    isDefault: true
    editable: true
    jsonData:
      httpMethod: POST
      timeInterval: 15s
```

**Apply:**
```bash
docker restart beautycita-grafana
```

---

## Step 3: Import Pre-Built Dashboards (10 minutes)

### Dashboard 1: Node.js Application Metrics
**Dashboard ID:** 11159 (Node.js Application Dashboard)

1. Go to Dashboards → Import
2. Enter Dashboard ID: `11159`
3. Click "Load"
4. Select Prometheus data source
5. Click "Import"

### Dashboard 2: PostgreSQL Database
**Dashboard ID:** 9628 (PostgreSQL Database)

1. Go to Dashboards → Import
2. Enter Dashboard ID: `9628`
3. Click "Load"
4. Select Prometheus data source
5. Click "Import"

### Dashboard 3: Node Exporter (System Metrics)
**Dashboard ID:** 1860 (Node Exporter Full)

1. Go to Dashboards → Import
2. Enter Dashboard ID: `1860`
3. Click "Load"
4. Select Prometheus data source
5. Click "Import"

### Dashboard 4: Nginx Metrics
**Dashboard ID:** 12708 (Nginx Prometheus Exporter)

1. Go to Dashboards → Import
2. Enter Dashboard ID: `12708`
3. Click "Load"
4. Select Prometheus data source
5. Click "Import"

---

## Step 4: Create Custom BeautyCita Dashboard (15 minutes)

### Create Dashboard JSON

File: `/var/www/beautycita.com/monitoring/grafana/dashboards/beautycita-overview.json`

```json
{
  "dashboard": {
    "title": "BeautyCita Platform Overview",
    "tags": ["beautycita", "api", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Request Rate",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"beautycita-api\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "API Response Time (p95)",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"beautycita-api\"}[5m]))",
            "legendFormat": "{{route}}"
          }
        ]
      },
      {
        "id": 3,
        "title": "Active Users (Last Hour)",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "count(up{job=\"beautycita-api\"} == 1)"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 8},
        "targets": [
          {
            "expr": "pg_stat_database_numbackends{datname=\"beautycita\"}"
          }
        ]
      },
      {
        "id": 5,
        "title": "Memory Usage",
        "type": "gauge",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 8},
        "targets": [
          {
            "expr": "process_resident_memory_bytes{job=\"beautycita-api\"} / 1024 / 1024"
          }
        ],
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
      },
      {
        "id": 6,
        "title": "Error Rate",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 18, "y": 8},
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"beautycita-api\",status=~\"5..\"}[5m])"
          }
        ],
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
      }
    ],
    "refresh": "30s",
    "time": {"from": "now-6h", "to": "now"},
    "timepicker": {}
  },
  "overwrite": true
}
```

**Apply:**
```bash
docker restart beautycita-grafana
```

---

## Step 5: Set Up Alerts (10 minutes)

### Alert 1: High API Error Rate

1. Go to Alerting → Alert rules
2. Click "New alert rule"
3. Configure:
   - **Name:** High API Error Rate
   - **Query:**
     ```promql
     rate(http_requests_total{job="beautycita-api",status=~"5.."}[5m]) > 0.1
     ```
   - **Condition:** `WHEN last() OF query(A) IS ABOVE 0.1`
   - **For:** 5m
   - **Annotations:**
     - Summary: `High error rate detected`
     - Description: `API is returning {{ $value }} errors per second`

### Alert 2: High Database Connections

1. Create new alert rule
2. Configure:
   - **Name:** High Database Connections
   - **Query:**
     ```promql
     pg_stat_database_numbackends{datname="beautycita"} > 50
     ```
   - **Condition:** `WHEN last() OF query(A) IS ABOVE 50`
   - **For:** 5m

### Alert 3: High Memory Usage

1. Create new alert rule
2. Configure:
   - **Name:** High Memory Usage
   - **Query:**
     ```promql
     process_resident_memory_bytes{job="beautycita-api"} / 1024 / 1024 / 1024 > 1
     ```
   - **Condition:** `WHEN last() OF query(A) IS ABOVE 1` (1 GB)
   - **For:** 10m

---

## Step 6: Configure Notification Channels (Optional)

### Slack Integration
1. Go to Alerting → Contact points
2. Click "New contact point"
3. Select "Slack"
4. Enter Webhook URL
5. Test and save

### Email Integration
1. Edit docker-compose.yml:
```yaml
grafana:
  environment:
    - GF_SMTP_ENABLED=true
    - GF_SMTP_HOST=smtp.gmail.com:587
    - GF_SMTP_USER=your-email@gmail.com
    - GF_SMTP_PASSWORD=your-app-password
    - GF_SMTP_FROM_ADDRESS=your-email@gmail.com
```

2. Restart Grafana:
```bash
docker compose restart grafana
```

---

## Key Metrics to Monitor

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

### Business Metrics (Custom)
- **New Users Today:** Query from database
- **Bookings Created:** Query from database
- **Revenue:** Query from database

---

## Troubleshooting

### Grafana Not Accessible
```bash
# Check if container is running
docker ps | grep grafana

# Check logs
docker logs beautycita-grafana

# Restart if needed
docker restart beautycita-grafana
```

### No Data in Dashboards
```bash
# Check Prometheus is scraping
curl http://localhost:9090/prometheus/api/v1/targets

# Check metrics endpoint
curl http://localhost:4000/api/metrics

# Verify data source connection in Grafana
```

### Dashboard Not Loading
```bash
# Check dashboard file syntax
cat /var/www/beautycita.com/monitoring/grafana/dashboards/beautycita-overview.json | python3 -m json.tool

# Check provisioning logs
docker logs beautycita-grafana | grep provisioning
```

---

## Quick Setup Commands (Copy-Paste)

```bash
# SSH to server
ssh beautycita@74.208.218.18

# Start Grafana if not running
cd /var/www/beautycita.com
docker compose --profile monitoring up -d grafana

# Check status
docker ps | grep grafana
docker logs beautycita-grafana --tail 50

# Test Prometheus connectivity
curl http://localhost:9090/prometheus/api/v1/targets

# Access Grafana
# Create SSH tunnel:
# ssh -L 3000:localhost:3000 beautycita@74.208.218.18
# Then visit: http://localhost:3000/grafana/
# Login: admin / admin123
```

---

## Next Steps

1. ✅ Grafana is running
2. ⚠️ **Fix Nginx proxy** (add location block for /grafana/)
3. ⚠️ **Add Prometheus data source** (via Web UI or provisioning)
4. ⚠️ **Import dashboards** (use dashboard IDs 11159, 9628, 1860, 12708)
5. ⚠️ **Create custom BeautyCita dashboard** (use JSON above)
6. ⚠️ **Set up alerts** (high error rate, database connections, memory)
7. ⚠️ **Configure notifications** (Slack, email, etc.)

---

## Estimated Time
- **Nginx Fix:** 5 minutes
- **Data Source:** 3 minutes
- **Import Dashboards:** 10 minutes
- **Custom Dashboard:** 15 minutes
- **Alerts:** 10 minutes
- **Total:** ~45 minutes

---

## Support Resources
- **Grafana Docs:** https://grafana.com/docs/
- **Prometheus Docs:** https://prometheus.io/docs/
- **Dashboard Library:** https://grafana.com/grafana/dashboards/
- **Node.js Dashboard:** https://grafana.com/grafana/dashboards/11159
- **PostgreSQL Dashboard:** https://grafana.com/grafana/dashboards/9628
