const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { validateJWT } = require('../middleware/auth');

// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole;
    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient privileges - Admin access required'
      });
    }

    next();
  };
};

// Serve the download page (HTML) - Admin/Superadmin only
router.get('/page', validateJWT, requireRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Download BeautyCita App</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
            min-height: 100vh;
        }
        .card {
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        h1 {
            color: #ec4899;
            margin-bottom: 10px;
        }
        .badge {
            display: inline-block;
            background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .btn {
            background: linear-gradient(135deg, #ec4899 0%, #9333ea 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 10px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: transform 0.2s;
            width: 100%;
            text-align: center;
            box-sizing: border-box;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(236, 72, 153, 0.4);
        }
        .btn-secondary {
            background: #6b7280;
        }
        .btn-secondary:hover {
            box-shadow: 0 5px 20px rgba(107, 114, 128, 0.4);
        }
        .info {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
            text-align: left;
            font-size: 14px;
            line-height: 1.6;
        }
        .info strong {
            color: #ec4899;
        }
        .file-info {
            background: #fff3f8;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #ec4899;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .downloads {
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <div class="badge">🔒 ADMIN ACCESS</div>
            <h1>📱 BeautyCita Android App</h1>
            <p class="subtitle">Internal Testing - Admin & Superadmin Only</p>
        </div>

        <div class="warning">
            <strong>⚠️ Internal Release</strong><br>
            This app is in internal testing phase and is only accessible to admin and superadmin users.
            Do not distribute these files publicly.
        </div>

        <div class="file-info">
            <strong>Package:</strong> com.beautycita.app<br>
            <strong>Version:</strong> 1.0.3 (Build 5)<br>
            <strong>Release Date:</strong> October 16, 2025<br>
            <strong>Size:</strong> ~570 MB<br>
            <strong>Signed:</strong> Yes - Production Ready<br>
            <strong>Your Role:</strong> ${req.userRole}
        </div>

        <div class="info" style="background: #f0fdf4; border-left: 4px solid #10b981;">
            <strong style="color: #10b981;">📋 What's New in v1.0.3:</strong><br>
            • Fixed QR code generator - codes now scan properly<br>
            • Updated Press page with real company data (Puerto Vallarta, 10K bookings, theme song)<br>
            • Updated Careers page - removed unfilled positions, improved story<br>
            • All pages reflect authentic BeautyCita data and growth trajectory<br>
            • Maintained pink-purple gradient brand identity
        </div>

        <div class="downloads">
            <h3 style="color: #333; margin-bottom: 15px;">Available Downloads:</h3>

            <a href="/api/app-downloads/aab" class="btn">
                📦 Download AAB Bundle
                <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">
                    For Google Play Console Upload
                </div>
            </a>

            <a href="/api/app-downloads/apk" class="btn btn-secondary">
                📲 Download APK
                <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">
                    For Direct Device Installation
                </div>
            </a>
        </div>

        <div class="info">
            <strong>📦 About AAB Format:</strong><br>
            Android App Bundle (AAB) is Google Play's publishing format. Upload this to Play Console for testing or production release.
            <br><br>
            <strong>📲 About APK Format:</strong><br>
            APK can be installed directly on Android devices for testing. Enable "Install from Unknown Sources" in device settings.
            <br><br>
            <strong>🔐 Security Features:</strong><br>
            This build includes hardware-backed encryption for sensitive data storage on Android devices (Android Keystore + EncryptedSharedPreferences).
        </div>
    </div>
</body>
</html>
  `);
});

// Download AAB file - Admin/Superadmin only
router.get('/aab', validateJWT, requireRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const aabPath = path.join(__dirname, '../../../frontend/android/app/build/outputs/bundle/release/app-release.aab');

  if (!fs.existsSync(aabPath)) {
    return res.status(404).json({
      success: false,
      message: 'AAB file not found. Please rebuild the app.'
    });
  }

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', 'attachment; filename="BeautyCita-release.aab"');
  res.download(aabPath, 'BeautyCita-release.aab', (err) => {
    if (err) {
      console.error('Error downloading AAB:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading AAB file'
        });
      }
    }
  });
});

// Download APK file - Admin/Superadmin only
router.get('/apk', validateJWT, requireRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const apkPath = path.join(__dirname, '../../../frontend/android/app/build/outputs/apk/release/app-release.apk');

  if (!fs.existsSync(apkPath)) {
    return res.status(404).json({
      success: false,
      message: 'APK file not found. Please rebuild the app.'
    });
  }

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', 'attachment; filename="BeautyCita-release.apk"');
  res.download(apkPath, 'BeautyCita-release.apk', (err) => {
    if (err) {
      console.error('Error downloading APK:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error downloading APK file'
        });
      }
    }
  });
});

// Get app info - Admin/Superadmin only
router.get('/info', validateJWT, requireRole(['ADMIN', 'SUPERADMIN']), (req, res) => {
  const aabPath = path.join(__dirname, '../../../frontend/android/app/build/outputs/bundle/release/app-release.aab');
  const apkPath = path.join(__dirname, '../../../frontend/android/app/build/outputs/apk/release/app-release.apk');

  const aabExists = fs.existsSync(aabPath);
  const apkExists = fs.existsSync(apkPath);

  let aabSize = null;
  let apkSize = null;

  if (aabExists) {
    const stats = fs.statSync(aabPath);
    aabSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
  }

  if (apkExists) {
    const stats = fs.statSync(apkPath);
    apkSize = (stats.size / (1024 * 1024)).toFixed(2) + ' MB';
  }

  res.json({
    success: true,
    data: {
      package: 'com.beautycita.app',
      version: '1.0.3',
      versionCode: 5,
      releaseDate: '2025-10-16',
      releaseNotes: {
        version: '1.0.3',
        date: 'October 16, 2025',
        changes: [
          '✅ Fixed QR code generator - QR codes now scan properly (reduced gradient opacity from 85% to 25%, removed edge fading)',
          '📄 Updated Press page with real BeautyCita data (Puerto Vallarta origins, 10K bookings milestone, theme song, in-house artwork)',
          '💼 Updated Careers page - removed unfilled positions, improved grassroots story',
          '🌐 All frontend pages now reflect authentic company data and growth trajectory',
          '🎨 Maintained BeautyCita brand identity with pink-purple gradient theme'
        ]
      },
      previousVersions: [
        {
          version: '1.0.2',
          versionCode: 4,
          date: 'October 2025',
          notes: 'Error pages redesign with official BeautyCita branding'
        },
        {
          version: '1.0.1',
          versionCode: 3,
          date: 'October 2025',
          notes: 'Translation fixes and UI improvements'
        },
        {
          version: '1.0.0',
          versionCode: 1,
          date: 'September 2025',
          notes: 'Initial release'
        }
      ],
      files: {
        aab: {
          available: aabExists,
          size: aabSize,
          path: aabExists ? '/api/app-downloads/aab' : null
        },
        apk: {
          available: apkExists,
          size: apkSize,
          path: apkExists ? '/api/app-downloads/apk' : null
        }
      },
      userRole: req.userRole,
      downloadPageUrl: '/api/app-downloads/page'
    }
  });
});

module.exports = router;
