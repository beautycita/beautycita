# BeautyCita Deployment Guide

## Automated Deployment Workflow

After pushing to the repository, you can now trigger a complete automated deployment that handles:

1. ✅ **Frontend Build** - Builds React app with Vite
2. ✅ **Backend Restart** - Restarts Node.js API server
3. ✅ **Health Check** - Verifies backend is running
4. ✅ **Android APK Build** - Compiles release APK with Gradle
5. ✅ **Cloudflare R2 Upload** - Uploads APK to CDN
6. ✅ **Downloads Page Update** - Auto-updates version info

## Quick Start

### Windows
```bash
deploy.bat
```

### Linux/Mac/Unix
```bash
chmod +x deploy.sh
./deploy.sh
```

## Current Version

- **Version:** 2.5.1
- **Build:** 7
- **Release Date:** November 13, 2025
- **APK Size:** ~33 MB

## Recent Changes (v2.5.1)

✅ Removed confirm password field from registration
🔒 Consolidated all auth to modal-based system
🚫 Removed stylist registration routes (CLIENT-only signup)
🎯 All "Join as Stylist" links point to /stylist-application
⏱️ Fixed popup sequence (GDPR first, then register modal)
📱 Updated frontend build with auth improvements

---

**Last Updated:** November 13, 2025
