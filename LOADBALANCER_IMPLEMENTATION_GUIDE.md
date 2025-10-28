# Load Balancer Implementation Guide for Primary Server

**Location:** Run this on PRIMARY server (74.208.218.18)  
**Purpose:** Configure primary to distribute traffic to secondary via Tailscale  
**Cost:** FREE  
**Complexity:** Low  

---

## What This Does

- Primary server continues serving beautycita.com on HTTPS
- 70% of traffic served locally by primary
- 30% of traffic proxied to secondary via Tailscale (100.103.122.4)
- Users always access `beautycita.com` - they never know about secondary
- Automatic failover if secondary is down

---

## Implementation Steps

### Step 1: Backup Current Config

```bash
cd /var/www/beautycita.com
sudo cp /etc/nginx/sites-available/beautycita.conf /etc/nginx/sites-available/beautycita.conf.backup-$(date +%Y%m%d)
```

### Step 2: Add Upstream Block

Edit the nginx config:
```bash
sudo nano /etc/nginx/sites-available/beautycita.conf
```

**ADD THIS AT THE TOP** (before any server blocks):

```nginx
# Load Balancer Upstream
upstream beautycita_cluster {
    # Primary server (local) - handles 70% of traffic
    server 127.0.0.1:8080 weight=7;
    
    # Secondary server (via Tailscale) - handles 30% as backup
    server 100.103.122.4:80 weight=3 backup;
    
    keepalive 32;
}

# Existing backend upstream (keep as-is)
upstream backend {
    server 127.0.0.1:4000;
    keepalive 64;
}
```

### Step 3: Modify HTTPS Server Block

Find the section that says:
```nginx
server {
    listen 443 ssl http2;
    ...
    root /var/www/frontend;
```

**CHANGE the root line to proxy instead:**

Replace:
```nginx
    root /var/www/frontend;
    index index.html;
```

With:
```nginx
    # Root moved to port 8080, we proxy here
```

### Step 4: Update Location Blocks

Find the frontend location block (usually at the end):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**REPLACE IT WITH:**
```nginx
location / {
    proxy_pass http://beautycita_cluster;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header Connection "";
    
    # Failover settings
    proxy_next_upstream error timeout http_502 http_503 http_504;
    proxy_connect_timeout 5s;
    proxy_read_timeout 60s;
}
```

### Step 5: Add Local Backend Server

**ADD THIS NEW SERVER BLOCK** at the end of the file:

```nginx
# Local backend server (serves actual content on port 8080)
server {
    listen 8080;
    server_name localhost;
    
    root /var/www/frontend;
    index index.html;
    
    # Frontend routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1d;
        add_header Cache-Control "public";
    }
}
```

### Step 6: Test and Apply

```bash
# Test configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx

# Check nginx is listening on 8080
sudo netstat -tlnp | grep :8080
```

### Step 7: Verify Load Balancing

```bash
# Test that both servers respond
curl -I http://127.0.0.1:8080/
curl -I http://100.103.122.4/

# Test HTTPS still works
curl -I https://beautycita.com/

# Watch nginx access logs to see traffic distribution
sudo tail -f /var/log/nginx/access.log
```

---

## How It Works

```
User requests https://beautycita.com
         ↓
Primary nginx (port 443 SSL)
         ↓
   beautycita_cluster upstream
         ↓
    ┌────┴────┐
    │         │
   70%       30%
    │         │
    ↓         ↓
localhost:8080  →  Tailscale  →  100.103.122.4:80
(Primary)                         (Secondary)
```

---

## Rollback if Needed

```bash
# Restore backup
sudo cp /etc/nginx/sites-available/beautycita.conf.backup-YYYYMMDD /etc/nginx/sites-available/beautycita.conf

# Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Benefits

✅ Simple configuration (just nginx changes)
✅ Free (no additional costs)
✅ Automatic load distribution
✅ Failover to secondary if primary overloaded
✅ Works with dynamic IP on secondary (via Tailscale)
✅ Users always see beautycita.com
✅ Secondary syncs automatically every 5 minutes

---

## Monitoring

```bash
# Check which backend is handling requests
sudo tail -f /var/log/nginx/access.log

# On secondary, check if receiving traffic
ssh kriket@100.103.122.4 "sudo tail -f /var/log/nginx/access.log"

# Test failover (stop secondary)
ssh kriket@100.103.122.4 "sudo systemctl stop nginx"
# Traffic should continue (backup mode)

# Restart secondary
ssh kriket@100.103.122.4 "sudo systemctl start nginx"
```

---

## Next Steps After Implementation

1. Monitor traffic distribution for a few hours
2. Adjust weights if needed (e.g., 80/20 instead of 70/30)
3. Test failover scenarios
4. Document in runbook
5. Set up monitoring alerts

---

**Ready to implement? Follow the steps above on the PRIMARY server.**

**Status:** Ready for implementation  
**Risk:** Low (easy to rollback)  
**Downtime:** None (reload is instant)
