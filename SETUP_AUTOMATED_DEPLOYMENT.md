# Automated Deployment Setup Guide

## Current Status
✅ **Primary Server (beautycita-main)**: Manually deployed and working
❌ **Secondary Server (beautifulsol)**: SSH keys not configured for automated deployment

## SSH Key for GitHub Actions

**Public Key (already exists):**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPKa9Ekxw8PjVnerx95E+87myAv3u9LkLY4zbZ+/Ap/i beautycita-server@beautycita.com
```

## Steps to Fix Automated Deployment

### Option 1: Add SSH Key to Secondary Server (Recommended)

1. **Access the secondary server (beautifulsol)**:
   - Login via console or physical access
   - Or enable password authentication temporarily

2. **Add the public key to authorized_keys**:
   ```bash
   # On beautifulsol server
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPKa9Ekxw8PjVnerx95E+87myAv3u9LkLY4zbZ+/Ap/i beautycita-server@beautycita.com" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. **For www-data user (if deployments run as www-data)**:
   ```bash
   sudo mkdir -p /var/www/.ssh
   sudo bash -c 'echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPKa9Ekxw8PjVnerx95E+87myAv3u9LkLY4zbZ+/Ap/i beautycita-server@beautycita.com" >> /var/www/.ssh/authorized_keys'
   sudo chown -R www-data:www-data /var/www/.ssh
   sudo chmod 700 /var/www/.ssh
   sudo chmod 600 /var/www/.ssh/authorized_keys
   ```

4. **Test from primary server**:
   ```bash
   ssh beautifulsol "whoami"
   # Should connect without password
   ```

### Option 2: Update GitHub Actions Secrets

The workflow uses these secrets (need to be configured in GitHub):

1. **For Primary Server**:
   - `PROD_HOST`: beautycita.com (or IP)
   - `PROD_USERNAME`: beautycita or www-data
   - `PROD_SSH_KEY`: Private key from `~/.ssh/id_ed25519`
   - `PROD_SSH_PORT`: 22

2. **For Secondary Server**:
   - `STAGING_HOST`: beautifulsol or 100.103.122.4
   - `STAGING_USERNAME`: beautycita or www-data
   - `STAGING_SSH_KEY`: Private key (same as primary or separate)
   - `STAGING_SSH_PORT`: 22

**To get the private key**:
```bash
cat ~/.ssh/id_ed25519
```

**Add to GitHub**:
1. Go to: https://github.com/beautycita/beautycita/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret with the name and value

### Option 3: Generate New Deploy Key (Alternative)

If you want a separate key for deployments:

```bash
# Generate new key
ssh-keygen -t ed25519 -f ~/.ssh/beautycita_deploy -C "github-actions@beautycita.com"

# Add public key to both servers
cat ~/.ssh/beautycita_deploy.pub
# Copy this to ~/.ssh/authorized_keys on both servers

# Add private key to GitHub Secrets
cat ~/.ssh/beautycita_deploy
# Add this as PROD_SSH_KEY and STAGING_SSH_KEY in GitHub
```

## Manual Deployment to Secondary Server

Until automated deployment is fixed, deploy manually:

```bash
# From primary server
ssh beautifulsol "cd /var/www/beautycita.com && git pull origin main && cd frontend && npm run build && sudo -u www-data pm2 restart beautycita-api"
```

## Testing Deployment

After configuring SSH keys:

1. **Test SSH access**:
   ```bash
   ssh beautifulsol "echo 'SSH works!'"
   ```

2. **Trigger GitHub Actions manually**:
   - Go to: https://github.com/beautycita/beautycita/actions/workflows/deploy-dual-servers.yml
   - Click "Run workflow"
   - Select branch: main
   - Click "Run workflow"

3. **Monitor logs**:
   - Watch the workflow run in GitHub Actions
   - Check for "Deploy to Secondary Server" step success

## Current Deployment Flow

```
┌─────────────┐
│ Git Push    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ GitHub Actions      │
│ - Build Frontend    │ ✅ Working
└──────┬──────────────┘
       │
       ├───────────────────┐
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Primary      │    │ Secondary    │
│ (SSH Deploy) │    │ (SSH Deploy) │
│ ❌ Failed    │    │ ⏭️ Skipped   │
└──────────────┘    └──────────────┘
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Manual       │    │ Not Yet      │
│ Deploy ✅    │    │ Deployed ❌  │
└──────────────┘    └──────────────┘
```

## What's Currently Working

✅ **On Primary Server**:
- `/api/client/favorites` - Favorite stylists API
- `/api/sms-preferences` - SMS notification preferences
- Frontend built and deployed
- PM2 running with new code

❌ **On Secondary Server**:
- Still on old code (before favorites feature)
- Needs manual deployment or SSH fix

## Priority

Since 100% of traffic goes to the primary server (no load balancing active yet), the secondary deployment is **not urgent**. However, for true redundancy, it should be synced.

---

**Created:** 2025-10-28
**Status:** SSH keys need configuration on secondary server
