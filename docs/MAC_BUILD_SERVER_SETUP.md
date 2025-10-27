# Mac Build Server Setup

## Current Status

- **Mac IP:** 192.168.0.42
- **Port:** 22
- **Username:** mackriket
- **Password:** Dv4801431a.
- **Network:** Local network access

## Option 1: GitHub Actions (Recommended)

GitHub Actions provides macOS runners with Xcode pre-installed. This is the easiest and most reliable option.

### Setup Required Secrets

In your `beautycita-ios` repository settings → Secrets and variables → Actions:

```
GH_TOKEN                 # Personal access token with repo access
R2_ACCESS_KEY_ID        # Cloudflare R2 access key
R2_SECRET_ACCESS_KEY    # Cloudflare R2 secret key
R2_ENDPOINT             # https://[account-id].r2.cloudflarestorage.com
R2_BUCKET               # beautycita
R2_PUBLIC_ID            # Your R2 public bucket ID
SERVER_SSH_KEY          # Private SSH key for www-data@beautycita.com
SERVER_HOST             # beautycita.com
SERVER_USER             # www-data
```

### Workflow File

Already created at `.github/workflows/ios-build.yml`

This workflow:
- ✅ Triggers on push to `beautycita-ios` main branch
- ✅ Builds iOS app on macOS runner
- ✅ Uploads IPA to Cloudflare R2
- ✅ Creates release on GitHub
- ✅ Triggers frontend rebuild on server
- ✅ Updates downloads page

## Option 2: Direct Mac Access

If you want to use the Mac directly for builds:

### 1. Enable SSH on Mac

On the Mac:
```bash
# Open System Preferences
# Go to: Sharing
# Enable: Remote Login
# Allow access for: mackriket (or All Users)
```

### 2. Configure Firewall

```bash
# On Mac
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/sbin/sshd
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /usr/sbin/sshd
```

### 3. Test Connection

From beautycita.com server:
```bash
ssh mackriket@192.168.230.128
```

### 4. Setup Build Environment

On the Mac:
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@20

# Install CocoaPods
sudo gem install cocoapods

# Verify Xcode
xcodebuild -version

# Accept Xcode license
sudo xcodebuild -license accept

# Install iOS simulators
xcodebuild -downloadPlatform iOS
```

### 5. Setup SSH Key Authentication

On beautycita.com server:
```bash
# Generate SSH key (if not exists)
ssh-keygen -t ed25519 -C "beautycita-build-server" -f ~/.ssh/mac_build

# Copy public key to Mac
ssh-copy-id -i ~/.ssh/mac_build.pub mackriket@192.168.230.128
```

### 6. Configure Build Script

Update `/var/www/beautycita.com/scripts/ios-build-automation.sh`:

```bash
# Add at top
MAC_HOST="192.168.230.128"
MAC_USER="mackriket"
MAC_SSH_KEY="/var/www/.ssh/mac_build"

# Use SSH for remote builds
ssh -i "${MAC_SSH_KEY}" "${MAC_USER}@${MAC_HOST}" "cd /path/to/ios && ./build.sh"
```

## Option 3: Mac Mini as Always-On Build Server

### Hardware Setup

1. **Network:** Connect Mac to same network as beautycita.com server OR set up VPN
2. **Power:** Enable "Start up automatically after a power failure" in Energy Saver
3. **Keep Awake:** Prevent Mac from sleeping:
   ```bash
   sudo pmset -a displaysleep 0 sleep 0 disksleep 0
   ```

### Software Setup

```bash
# On Mac
cd /Users/mackriket/beautycita-builds

# Clone iOS repo
git clone https://github.com/beautycita/beautycita-ios.git

# Create build script
cat > build-and-upload.sh <<'EOF'
#!/bin/bash
set -e

cd /Users/mackriket/beautycita-builds/beautycita-ios

# Pull latest
git pull origin main

# Install deps
npm ci

# Sync Capacitor
npx cap sync ios

# Build
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -archivePath /tmp/BeautyCita.xcarchive \
  clean archive

# Export
xcodebuild -exportArchive \
  -archivePath /tmp/BeautyCita.xcarchive \
  -exportPath /tmp \
  -exportOptionsPlist ios/ExportOptions.plist

# Upload to R2 (via rclone or aws cli)
aws s3 cp /tmp/App.ipa s3://beautycita/downloads/ios/latest.ipa \
  --endpoint-url=https://[account-id].r2.cloudflarestorage.com
EOF

chmod +x build-and-upload.sh
```

### Automated Polling (launchd)

Create `/Users/mackriket/Library/LaunchAgents/com.beautycita.ios-builder.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.beautycita.ios-builder</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/mackriket/beautycita-builds/build-and-upload.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>3600</integer>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/Users/mackriket/beautycita-builds/build-error.log</string>
    <key>StandardOutPath</key>
    <string>/Users/mackriket/beautycita-builds/build-output.log</string>
</dict>
</plist>
```

Load the job:
```bash
launchctl load ~/Library/LaunchAgents/com.beautycita.ios-builder.plist
```

## Troubleshooting

### SSH Connection Times Out

```bash
# Check if Mac is reachable
ping 192.168.230.128

# Check if SSH port is open
nc -zv 192.168.230.128 22

# Check from Mac side
netstat -an | grep :22
```

### Firewall Blocking

On Mac:
```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# Allow incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

### Xcode Build Fails

```bash
# Clean build folder
xcodebuild clean -workspace ios/App/App.xcworkspace -scheme App

# Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Reset Xcode
sudo xcode-select --reset
```

### Network Routing

If Mac and server are on different networks:

1. **VPN Solution:** Set up WireGuard or Tailscale
2. **SSH Tunnel:** Use reverse SSH tunnel
3. **GitHub Actions:** Use cloud runners (recommended)

## Recommended Approach

**Use GitHub Actions** (Option 1) because:
- ✅ No network configuration needed
- ✅ macOS runners with Xcode pre-installed
- ✅ Automatic on every push
- ✅ Free for public repos
- ✅ Scalable and reliable
- ✅ Built-in secret management

The local Mac can still be used for development and testing, while production builds run on GitHub Actions.

---

**Created:** October 26, 2025
**Last Updated:** October 26, 2025
