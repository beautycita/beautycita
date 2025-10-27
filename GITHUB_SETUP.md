# GitHub CI/CD Setup Instructions

## ✅ What's Been Created

1. **GitHub Actions Workflows**
   - `.github/workflows/deploy-production.yml` - Auto-deploy to production on push to `main`
   - `.github/workflows/deploy-staging.yml` - Auto-deploy to staging on push to `develop`

2. **Configuration Files**
   - `.env.example` - Template for environment variables
   - `DEPLOYMENT.md` - Complete deployment documentation
   - `FIX_PERMISSIONS.sh` - Script to fix file ownership issues

3. **Repository Structure**
   - Git repository already initialized
   - Remote: `github.com/beautycita/beautycita`
   - Current branch: `main`

---

## 🚀 Quick Start (5 Steps)

### Step 1: Generate Deployment SSH Key

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/beautycita_deploy -N ""
```

### Step 2: Add Public Key to Server

```bash
cat ~/.ssh/beautycita_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Copy Private Key

```bash
cat ~/.ssh/beautycita_deploy
```

Copy the entire output (including `-----BEGIN` and `-----END` lines)

### Step 4: Add GitHub Secrets

Go to: https://github.com/beautycita/beautycita/settings/secrets/actions

Click **"New repository secret"** and add these:

| Name | Value |
|------|-------|
| `PROD_HOST` | `beautycita.com` |
| `PROD_USERNAME` | `beautycita` |
| `PROD_SSH_KEY` | *paste private key from Step 3* |
| `PROD_SSH_PORT` | `22` |

### Step 5: Test Deployment

```bash
cd /var/www/beautycita.com

# Fix permissions first
sudo bash FIX_PERMISSIONS.sh

# Add new files
git add .github/workflows/ .env.example DEPLOYMENT.md GITHUB_SETUP.md FIX_PERMISSIONS.sh

# Commit
git commit -m "Add GitHub Actions CI/CD workflows"

# Push to GitHub (this will trigger deployment!)
git push origin main
```

---

## 📊 Monitor Deployment

1. **GitHub Actions:**
   - Go to: https://github.com/beautycita/beautycita/actions
   - Watch the deployment progress live
   - Check for errors in each step

2. **Server Health Check:**
   ```bash
   curl https://beautycita.com/api/health
   ```

3. **PM2 Status:**
   ```bash
   sudo -u www-data pm2 status
   sudo -u www-data pm2 logs beautycita-api --lines 50
   ```

---

## 🔄 Development Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes...

# 3. Test locally
cd frontend && npm run build && cd ..

# 4. Commit
git add .
git commit -m "Your commit message"

# 5. Push to GitHub
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub

# 7. Merge to main → Auto-deploys to production!
```

### Emergency Rollback

```bash
cd /var/www/beautycita.com
git reset --hard HEAD~1
sudo bash FIX_PERMISSIONS.sh
cd frontend && npm run build && cd ..
sudo -u www-data pm2 restart beautycita-api
```

---

## 🛠️ Troubleshooting

### "Permission denied" during deployment

**Fix:**
```bash
sudo bash /var/www/beautycita.com/FIX_PERMISSIONS.sh
```

### Deployment fails at SSH step

**Possible causes:**
1. SSH key not added to GitHub Secrets
2. Public key not added to server's `~/.ssh/authorized_keys`
3. Server firewall blocking SSH

**Test SSH access:**
```bash
ssh -i ~/.ssh/beautycita_deploy beautycita@beautycita.com "echo 'SSH works!'"
```

### Health check fails after deployment

**Check logs:**
```bash
sudo -u www-data pm2 logs beautycita-api --lines 100 --err
```

**Common causes:**
- Database connection error (check .env)
- Port already in use
- Missing dependencies (run `npm install`)

---

## 📝 Next Steps

1. ✅ **Fix file permissions:**
   ```bash
   sudo bash /var/www/beautycita.com/FIX_PERMISSIONS.sh
   ```

2. ✅ **Commit and push CI/CD files:**
   ```bash
   cd /var/www/beautycita.com
   git add .github/workflows/ .env.example DEPLOYMENT.md GITHUB_SETUP.md
   git commit -m "Add GitHub Actions CI/CD"
   git push origin main
   ```

3. ✅ **Set up GitHub Secrets** (see Step 4 above)

4. ✅ **Test deployment** by pushing a small change

5. ✅ **Monitor first deployment** in GitHub Actions tab

6. 🎯 **Resume subscription system development**

---

## 🎯 Subscription System TODO

After deployment is working, resume subscription system:

1. Run database migration: `backend/migrations/20251027_platform_monetization.sql`
2. Create subscription service file (with proper permissions!)
3. Add application fee calculation to payment flow
4. Create admin panel UI for fee toggles
5. Create stylist subscription upgrade flow
6. Create payout transparency dashboard
7. Add subscription tier badges
8. Test end-to-end

---

## 📚 Documentation

- **Full Deployment Guide:** `DEPLOYMENT.md`
- **Permission Fix Script:** `FIX_PERMISSIONS.sh`
- **Environment Template:** `.env.example`
- **CLAUDE.md:** Complete project documentation

---

**Ready to deploy? Run:**

```bash
sudo bash /var/www/beautycita.com/FIX_PERMISSIONS.sh
cd /var/www/beautycita.com
git add .
git commit -m "Setup GitHub Actions CI/CD"
git push origin main
```

Then watch it deploy at: https://github.com/beautycita/beautycita/actions
