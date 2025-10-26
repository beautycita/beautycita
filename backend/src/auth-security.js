/**
 * Authentication Security Features - BeautyCita
 * JWT Refresh Tokens + 2FA for Admins
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// ==================== JWT REFRESH TOKENS ====================

/**
 * Generate access token (short-lived, 15 minutes)
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id || user.user_id,
    email: user.email,
    role: user.role,
    type: 'access',
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m', // 15 minutes
    issuer: 'beautycita-api',
    audience: 'beautycita-client',
  });
}

/**
 * Generate refresh token (long-lived, 7 days)
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id || user.user_id,
    email: user.email,
    type: 'refresh',
    jti: crypto.randomBytes(16).toString('hex'), // JWT ID for revocation
  };

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: '7d', // 7 days
    issuer: 'beautycita-api',
    audience: 'beautycita-client',
  });
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'beautycita-api',
      audience: 'beautycita-client',
    });

    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid access token: ${error.message}`);
  }
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
      issuer: 'beautycita-api',
      audience: 'beautycita-client',
    });

    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    return decoded;
  } catch (error) {
    throw new Error(`Invalid refresh token: ${error.message}`);
  }
}

/**
 * Middleware to verify access token
 */
function requireAccessToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No access token provided',
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired access token',
      message: error.message,
    });
  }
}

/**
 * Refresh token endpoint handler
 */
async function refreshTokenHandler(db) {
  return async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if token is revoked
      const revokedCheck = await db.query(
        'SELECT 1 FROM revoked_tokens WHERE jti = $1',
        [decoded.jti]
      );

      if (revokedCheck.rows.length > 0) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token has been revoked',
        });
      }

      // Get user from database
      const userResult = await db.query(
        'SELECT id, email, role, phone_verified FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
        });
      }

      const user = userResult.rows[0];

      // Generate new tokens
      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);

      // Revoke old refresh token
      await db.query(
        `INSERT INTO revoked_tokens (jti, user_id, revoked_at, reason)
         VALUES ($1, $2, NOW(), 'Token refreshed')`,
        [decoded.jti, decoded.userId]
      );

      res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900, // 15 minutes in seconds
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({
        success: false,
        error: 'Failed to refresh token',
        message: error.message,
      });
    }
  };
}

/**
 * Revoke refresh token (for logout)
 */
async function revokeRefreshToken(db, refreshToken, reason = 'User logout') {
  try {
    const decoded = verifyRefreshToken(refreshToken);

    await db.query(
      `INSERT INTO revoked_tokens (jti, user_id, revoked_at, reason)
       VALUES ($1, $2, NOW(), $3)
       ON CONFLICT (jti) DO NOTHING`,
      [decoded.jti, decoded.userId, reason]
    );

    return true;
  } catch (error) {
    console.error('Token revocation error:', error);
    return false;
  }
}

// ==================== 2FA (Two-Factor Authentication) ====================

/**
 * Generate 2FA secret for user
 */
async function generate2FASecret(user) {
  const secret = speakeasy.generateSecret({
    name: `BeautyCita (${user.email})`,
    issuer: 'BeautyCita',
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

/**
 * Generate QR code for 2FA setup
 */
async function generate2FAQRCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
}

/**
 * Verify 2FA token
 */
function verify2FAToken(secret, token) {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 2, // Allow 2 time steps before/after for clock drift
  });
}

/**
 * Enable 2FA for user
 */
async function enable2FA(db, userId) {
  try {
    const userResult = await db.query(
      'SELECT email, role FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];

    // Generate secret
    const { secret, otpauthUrl } = await generate2FASecret({ email: user.email });

    // Store secret temporarily (not enabled until verified)
    await db.query(
      `INSERT INTO user_2fa (user_id, secret, enabled, created_at)
       VALUES ($1, $2, false, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET secret = $2, enabled = false, created_at = NOW()`,
      [userId, secret]
    );

    // Generate QR code
    const qrCode = await generate2FAQRCode(otpauthUrl);

    return {
      secret,
      qrCode,
    };
  } catch (error) {
    throw new Error(`Failed to enable 2FA: ${error.message}`);
  }
}

/**
 * Verify and confirm 2FA setup
 */
async function confirm2FASetup(db, userId, token) {
  try {
    const result = await db.query(
      'SELECT secret FROM user_2fa WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('2FA not initialized for this user');
    }

    const { secret } = result.rows[0];

    // Verify token
    const isValid = verify2FAToken(secret, token);

    if (!isValid) {
      throw new Error('Invalid 2FA token');
    }

    // Enable 2FA
    await db.query(
      'UPDATE user_2fa SET enabled = true, verified_at = NOW() WHERE user_id = $1',
      [userId]
    );

    // Generate backup codes
    const backupCodes = generateBackupCodes(8);

    // Store hashed backup codes
    for (const code of backupCodes) {
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      await db.query(
        'INSERT INTO user_2fa_backup_codes (user_id, code_hash, created_at) VALUES ($1, $2, NOW())',
        [userId, hashedCode]
      );
    }

    return {
      success: true,
      backupCodes,
    };
  } catch (error) {
    throw new Error(`Failed to confirm 2FA: ${error.message}`);
  }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify backup code
 */
async function verifyBackupCode(db, userId, code) {
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  const result = await db.query(
    `SELECT id FROM user_2fa_backup_codes
     WHERE user_id = $1 AND code_hash = $2 AND used_at IS NULL`,
    [userId, hashedCode]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Mark code as used
  await db.query(
    'UPDATE user_2fa_backup_codes SET used_at = NOW() WHERE id = $1',
    [result.rows[0].id]
  );

  return true;
}

/**
 * Disable 2FA for user
 */
async function disable2FA(db, userId, password) {
  // Verify password before disabling 2FA
  const userResult = await db.query(
    'SELECT password FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  // Note: Password verification should be done before calling this function

  await db.query('DELETE FROM user_2fa WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM user_2fa_backup_codes WHERE user_id = $1', [userId]);

  return true;
}

/**
 * Middleware to require 2FA for SUPERADMIN
 */
function require2FAForSuperAdmin(db) {
  return async (req, res, next) => {
    // Only check for SUPERADMIN
    if (req.user?.role !== 'SUPERADMIN') {
      return next();
    }

    // Check if 2FA is enabled
    const result = await db.query(
      'SELECT enabled FROM user_2fa WHERE user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].enabled) {
      return res.status(403).json({
        success: false,
        error: '2FA is required for SUPERADMIN accounts',
        requireSetup: true,
      });
    }

    // Check if 2FA was verified in this session
    const twoFAVerified = req.session?.twoFAVerified;

    if (!twoFAVerified) {
      return res.status(403).json({
        success: false,
        error: '2FA verification required',
        requireVerification: true,
      });
    }

    next();
  };
}

/**
 * Login with 2FA
 */
async function loginWith2FA(db, email, password, twoFAToken = null, backupCode = null) {
  // Get user
  const userResult = await db.query(
    'SELECT id, email, password, role, phone_verified FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    throw new Error('Invalid credentials');
  }

  const user = userResult.rows[0];

  // Verify password (assuming bcrypt)
  const bcrypt = require('bcrypt');
  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw new Error('Invalid credentials');
  }

  // Check if 2FA is enabled
  const twoFAResult = await db.query(
    'SELECT secret, enabled FROM user_2fa WHERE user_id = $1',
    [user.id]
  );

  const has2FA = twoFAResult.rows.length > 0 && twoFAResult.rows[0].enabled;

  if (has2FA) {
    // 2FA is enabled, verify token or backup code
    if (!twoFAToken && !backupCode) {
      return {
        success: false,
        requires2FA: true,
        message: '2FA token required',
      };
    }

    let verified = false;

    if (twoFAToken) {
      verified = verify2FAToken(twoFAResult.rows[0].secret, twoFAToken);
    } else if (backupCode) {
      verified = await verifyBackupCode(db, user.id, backupCode);
    }

    if (!verified) {
      throw new Error('Invalid 2FA token or backup code');
    }
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  return {
    success: true,
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      has2FA,
    },
  };
}

// ==================== EXPORTS ====================
module.exports = {
  // JWT Functions
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  requireAccessToken,
  refreshTokenHandler,
  revokeRefreshToken,

  // 2FA Functions
  generate2FASecret,
  generate2FAQRCode,
  verify2FAToken,
  enable2FA,
  confirm2FASetup,
  disable2FA,
  verifyBackupCode,
  require2FAForSuperAdmin,
  loginWith2FA,
  generateBackupCodes,
};
