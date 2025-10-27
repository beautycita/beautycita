# BeautyCita Backup & Automation System

## Overview

Complete backup and restore system with iOS build automation.

## Backup System

### What Gets Backed Up

Each backup package is a **fully installable snapshot** containing:

- ✅ PostgreSQL database (complete dump)
- ✅ Backend code (excluding node_modules)
- ✅ Frontend code (excluding node_modules, dist)
- ✅ User uploads (all files)
- ✅ Git repository (full history)
- ✅ Environment files (.env, ecosystem.config.js)
- ✅ Nginx configuration
- ✅ System state metadata

### Backup Schedule

**Daily Backups:**
- Schedule: Every day at 2:00 AM
- Retention: 3 days
- Location: `/var/www/backups/daily/`

**Weekly Backups:**
- Schedule: Every Sunday at 3:00 AM
- Retention: 4 weeks
- Location: `/var/www/backups/weekly/`

### Installation

```bash
# Run once to set up cron jobs
sudo bash /var/www/beautycita.com/scripts/setup-backup-cron.sh
```

### Manual Backup

```bash
# Create daily backup now
sudo -u www-data /var/www/beautycita.com/scripts/backup-full-system.sh daily

# Create weekly backup now
sudo -u www-data /var/www/beautycita.com/scripts/backup-full-system.sh weekly
```

### Restore from Backup

**One-Click Restore:**
```bash
# Navigate to any backup directory
cd /var/www/backups/daily/20251026

# Run restore script
sudo -u www-data bash restore.sh
```

The restore script will:
1. Stop all services
2. Backup current state to `.bak` directories
3. Restore database
4. Restore code and uploads
5. Install dependencies
6. Rebuild frontend
7. Restart services

**Manual Restoration:**

Each backup includes a `README.md` with detailed manual restoration steps.

### Backup Contents

```
/var/www/backups/daily/20251026/
├── database.sql.gz           # Complete database dump
├── backend.tar.gz            # Backend application
├── frontend.tar.gz           # Frontend application
├── uploads.tar.gz            # User files
├── git-repo.bundle           # Git repository
├── .env                      # Environment config
├── ecosystem.config.js       # PM2 config
├── nginx.conf                # Nginx config
├── system-state.json         # Metadata
├── restore.sh                # One-click restore
├── README.md                 # Documentation
└── MANIFEST.txt              # File listing
```

### Logs

Backup logs: `/var/www/backups/backup.log`

```bash
# View recent backup logs
tail -f /var/www/backups/backup.log

# Check last backup status
tail -100 /var/www/backups/backup.log | grep -A 20 "Starting"
```

## iOS Build Automation

### Overview

Automatically builds iOS app when changes are pushed to `beautycita-ios` repository.

### How It Works

1. **Monitor:** Cron job checks `beautycita-ios` repo every hour
2. **Detect:** New commit triggers build process
3. **Cancel:** Any pending builds are cancelled on new push
4. **Build:** iOS app is built (requires macOS or GitHub Actions)
5. **Upload:** IPA uploaded to Cloudflare R2
6. **Update:** Downloads page metadata updated
7. **Deploy:** Frontend rebuilt with new download link

### Setup

**Requirements:**
- macOS with Xcode (for local builds), OR
- GitHub Actions configured for macOS builds
- Cloudflare R2 configured with AWS CLI
- `gh` CLI tool installed

**Install Monitoring:**
```bash
# Add to crontab for www-data user
0 * * * * /var/www/beautycita.com/scripts/monitor-ios-repo.sh >> /var/www/backups/ios-build.log 2>&1
```

### Configuration

Edit `/var/www/beautycita.com/scripts/ios-build-automation.sh`:

```bash
R2_ENDPOINT="https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com"
R2_BUCKET="beautycita"
```

### Manual Build

```bash
sudo -u www-data /var/www/beautycita.com/scripts/ios-build-automation.sh
```

### Build Logs

```bash
tail -f /var/www/backups/ios-build.log
```

## Verification

### Check Backup Cron Jobs

```bash
sudo crontab -u www-data -l
```

Expected output:
```
# Daily backup at 2 AM
0 2 * * * /var/www/beautycita.com/scripts/backup-full-system.sh daily

# Weekly backup on Sundays at 3 AM
0 3 * * 0 /var/www/beautycita.com/scripts/backup-full-system.sh weekly
```

### List Available Backups

```bash
ls -lh /var/www/backups/daily/
ls -lh /var/www/backups/weekly/
```

### Test Restore (Dry Run)

```bash
# View what would be restored
cd /var/www/backups/daily/latest
cat README.md
cat system-state.json
```

## Disaster Recovery

### Complete System Loss

1. Set up fresh server (Ubuntu, PostgreSQL, Node.js, Nginx)
2. Create `www-data` user and `/var/www/beautycita.com` directory
3. Copy latest backup directory to server
4. Run: `sudo -u www-data bash restore.sh`
5. System fully restored in ~10 minutes

### Partial Data Loss

**Database only:**
```bash
cd /var/www/backups/daily/latest
gunzip -c database.sql.gz | PGPASSWORD='...' psql -U beautycita_app beautycita
```

**Uploads only:**
```bash
cd /var/www/backups/daily/latest
tar -xzf uploads.tar.gz -C /var/www/beautycita.com/backend/
```

### Time Travel

```bash
# Restore to 2 days ago
cd /var/www/backups/daily/20251024
sudo -u www-data bash restore.sh

# Restore to last week
cd /var/www/backups/weekly/20251019
sudo -u www-data bash restore.sh
```

## Best Practices

1. **Test Restores Monthly:** Actually run restore.sh on a test server
2. **Monitor Disk Space:** Backups consume ~500MB-2GB per day
3. **Off-Site Backups:** Periodically copy `/var/www/backups` to S3/R2
4. **Document Changes:** Update CLAUDE.md when infrastructure changes
5. **Version Control:** All scripts in git for auditability

## Troubleshooting

### Backup Fails

Check logs:
```bash
tail -100 /var/www/backups/backup.log
```

Common issues:
- Disk space full: `df -h`
- Permissions: Backups must run as `www-data`
- Database password: Check `.env` file

### Restore Fails

1. Check you're running as `www-data`
2. Verify backup integrity: `tar -tzf backend.tar.gz`
3. Check database credentials
4. Ensure sufficient disk space

### iOS Build Fails

Check build log:
```bash
tail -100 /var/www/backups/ios-build.log
```

Common issues:
- macOS not available: Use GitHub Actions
- Xcode not installed
- R2 credentials incorrect
- GitHub token expired

---

**Created:** October 26, 2025
**Maintained By:** AI Assistant & Development Team
**Review Frequency:** Monthly or after infrastructure changes
