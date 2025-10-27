# BeautyCita Deployment Guide

## Overview

BeautyCita uses GitHub Actions for automated CI/CD deployment to production and staging environments.

---

## Architecture

```
┌─────────────┐
│   GitHub    │
│ Repository  │
└──────┬──────┘
       │
       │ Push to main
       ▼
┌─────────────┐
│GitHub Actions│
│   CI/CD     │
└──────┬──────┘
       │
       ├── Test
       ├── Build
       └── Deploy
              │
              ▼
       ┌─────────────┐
       │ Production  │
       │   Server    │
       └─────────────┘
```

---

## Environments

### Production
- **Branch:** `main`
- **URL:** https://beautycita.com
- **Server:** beautycita.com (Spain/US)
- **Auto-deploy:** On push to `main`

### Staging
- **Branch:** `develop` or `staging`
- **URL:** https://staging.beautycita.com (if configured)
- **Server:** Staging server
- **Auto-deploy:** On push to `develop`/`staging`

---

## GitHub Secrets Setup

Navigate to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

### Production Secrets

```
PROD_HOST=beautycita.com
PROD_USERNAME=beautycita
PROD_SSH_KEY=<your_private_ssh_key>
PROD_SSH_PORT=22
```

### Staging Secrets (if using staging)

```
STAGING_HOST=staging.beautycita.com
STAGING_USERNAME=beautycita
STAGING_SSH_KEY=<your_private_ssh_key>
STAGING_SSH_PORT=22
```

### Database Secrets (for migrations)

```
DB_PASSWORD=<your_database_password>
```

---

## SSH Key Setup

### 1. Generate SSH Key for Deployment

On your local machine or CI server:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/beautycita_deploy
```

### 2. Add Public Key to Server

Copy the public key to the server:

```bash
ssh-copy-id -i ~/.ssh/beautycita_deploy.pub beautycita@beautycita.com
```

Or manually add to `~/.ssh/authorized_keys` on the server:

```bash
cat ~/.ssh/beautycita_deploy.pub | ssh beautycita@beautycita.com "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### 3. Add Private Key to GitHub Secrets

Copy the ENTIRE private key:

```bash
cat ~/.ssh/beautycita_deploy
```

Add it to GitHub Secrets as `PROD_SSH_KEY`

---

## Workflow Files

### `deploy-production.yml`

Triggers on:
- Push to `main` branch
- Manual trigger via GitHub UI

Steps:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build frontend
5. SSH to production server
6. Pull latest code
7. Fix file permissions
8. Install dependencies (if changed)
9. Build frontend
10. Run database migrations
11. Restart PM2 backend
12. Health check
13. Notify status

### `deploy-staging.yml`

Triggers on:
- Push to `develop` or `staging` branch
- Pull requests to `main`
- Manual trigger

Steps:
1. Run tests
2. Build frontend (test)
3. Deploy to staging (if not PR)

---

## Manual Deployment

### Trigger via GitHub UI

1. Go to **Actions** tab in GitHub
2. Select workflow (Deploy to Production/Staging)
3. Click **Run workflow**
4. Select branch
5. Click **Run workflow**

### Manual SSH Deployment

If GitHub Actions fails, deploy manually:

```bash
# SSH into server
ssh beautycita@beautycita.com

# Navigate to project
cd /var/www/beautycita.com

# Pull latest code
git pull origin main

# Fix permissions
sudo bash FIX_PERMISSIONS.sh

# Install dependencies (if needed)
npm install
cd frontend && npm install && cd ..

# Build frontend
cd frontend && npm run build && cd ..

# Restart backend
sudo -u www-data pm2 restart beautycita-api

# Check status
sudo -u www-data pm2 status
curl https://beautycita.com/api/health
```

---

## Database Migrations

### Automated (via CI/CD)

Migrations in `backend/migrations/*.sql` are automatically detected and can be run by the workflow.

**To enable:** Uncomment the migration step in `deploy-production.yml`

### Manual Migration

```bash
# SSH into server
ssh beautycita@beautycita.com

# Run migration
cd /var/www/beautycita.com
PGPASSWORD='your_password' psql -h localhost -U beautycita_app -d beautycita -f backend/migrations/YOUR_MIGRATION.sql
```

---

## Rollback Procedure

### Quick Rollback (Git)

```bash
# SSH into server
ssh beautycita@beautycita.com
cd /var/www/beautycita.com

# Find previous commit
git log --oneline -10

# Rollback to previous commit
git reset --hard <commit_hash>

# Rebuild and restart
cd frontend && npm run build && cd ..
sudo -u www-data pm2 restart beautycita-api
```

### Rollback via GitHub

1. Go to repository → Actions
2. Find successful previous deployment
3. Click **Re-run all jobs**

---

## Monitoring Deployment

### GitHub Actions Logs

- View live logs in GitHub Actions tab
- Check for errors in each step
- Review health check results

### Server Logs

```bash
# PM2 logs
sudo -u www-data pm2 logs beautycita-api

# Nginx access logs
sudo tail -f /var/log/nginx/beautycita.com.access.log

# Nginx error logs
sudo tail -f /var/log/nginx/beautycita.com.error.log
```

### Health Check

```bash
# API health
curl https://beautycita.com/api/health

# Frontend
curl -I https://beautycita.com

# Check PM2 status
sudo -u www-data pm2 status
```

---

## Deployment Checklist

### Before Deployment

- [ ] All tests pass locally
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables updated (if needed)
- [ ] Breaking changes documented
- [ ] Backup database (for major changes)

### After Deployment

- [ ] Health check passes
- [ ] Frontend loads correctly
- [ ] API responds correctly
- [ ] Check PM2 logs for errors
- [ ] Test critical user flows
- [ ] Monitor error rates (Sentry)
- [ ] Check Prometheus metrics

---

## Troubleshooting

### Deployment Fails at SSH Step

**Issue:** Cannot connect to server

**Solutions:**
1. Verify SSH key is correct in GitHub Secrets
2. Check server is online: `ping beautycita.com`
3. Verify SSH port is open: `nc -zv beautycita.com 22`
4. Check SSH key permissions on server

### Health Check Fails

**Issue:** API returns non-200 status

**Solutions:**
1. Check PM2 status: `sudo -u www-data pm2 status`
2. View logs: `sudo -u www-data pm2 logs beautycita-api --lines 100`
3. Check database connection
4. Verify .env variables are correct

### Frontend Build Fails

**Issue:** npm run build fails

**Solutions:**
1. Check Node.js version (should be 20)
2. Clear cache: `rm -rf node_modules && npm install`
3. Check for TypeScript errors
4. Verify all dependencies are installed

### Permission Errors

**Issue:** "Permission denied" during deployment

**Solutions:**
1. Run: `sudo bash /var/www/beautycita.com/FIX_PERMISSIONS.sh`
2. Ensure PM2 runs as www-data user
3. Check file ownership: `ls -la /var/www/beautycita.com/backend/src/`

---

## Environment Variables

### Production Environment

Location: `/var/www/beautycita.com/.env`

**Never commit this file to Git!**

Use `.env.example` as template.

### Updating Environment Variables

1. SSH into server
2. Edit .env file: `nano /var/www/beautycita.com/.env`
3. Restart backend: `sudo -u www-data pm2 restart beautycita-api`

---

## Branch Strategy

```
main (production)
  ↑
  │ PR + Review
  │
develop (staging)
  ↑
  │ PR
  │
feature/* (local)
```

### Workflow

1. Create feature branch from `develop`
2. Develop and test locally
3. Push feature branch
4. Create PR to `develop`
5. Deploy to staging automatically
6. Test on staging
7. Create PR from `develop` to `main`
8. Deploy to production automatically

---

## Performance

### Build Times

- Frontend build: ~15 seconds
- Backend tests: ~30 seconds
- Full deployment: ~2-3 minutes

### Downtime

- Zero-downtime deployment (PM2 restarts gracefully)
- Frontend served statically (always available)
- Backend restart: ~2-5 seconds

---

## Security

### Secrets Management

- ✅ All secrets stored in GitHub Secrets (encrypted)
- ✅ Never commit .env to repository
- ✅ SSH keys are deployment-specific
- ✅ Database credentials not in code

### Access Control

- ✅ Only `main` branch triggers production deploy
- ✅ Staging requires test pass
- ✅ Manual approvals can be added for production

---

## Future Improvements

- [ ] Add deployment approval workflow for production
- [ ] Implement blue-green deployment
- [ ] Add automated rollback on health check fail
- [ ] Slack/Discord notifications for deployments
- [ ] Database backup before migrations
- [ ] Automated security scanning
- [ ] Performance regression testing

---

## Support

**Deployment Issues:**
- Check GitHub Actions logs
- Review server logs: `sudo -u www-data pm2 logs`
- Contact: support@beautycita.com

**Emergency Rollback:**
```bash
ssh beautycita@beautycita.com
cd /var/www/beautycita.com
git reset --hard HEAD~1
sudo bash FIX_PERMISSIONS.sh
cd frontend && npm run build && cd ..
sudo -u www-data pm2 restart beautycita-api
```

---

**Last Updated:** October 27, 2025
**Maintained By:** BeautyCita Development Team
