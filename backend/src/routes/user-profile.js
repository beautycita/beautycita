const express = require('express');
const router = express.Router();
const { query } = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

/**
 * GET /api/user/profile
 * Get current user's profile
 */
router.get('/profile', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(
      `SELECT id, email, name, first_name, last_name, username, phone, role, profile_picture_url,
              language_preference, timezone, notification_preferences,
              email_verified, phone_verified, is_active, last_active,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
router.put('/profile', async (req, res) => {
  try {
    const { user } = req;
    const {
      name,
      firstName,
      lastName,
      username,
      phone,
      language_preference,
      timezone,
      notification_preferences
    } = req.body;

    const updateFields = [];
    const updateParams = [];
    let paramCounter = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramCounter}`);
      updateParams.push(name);
      paramCounter++;
    }

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramCounter}`);
      updateParams.push(firstName);
      paramCounter++;
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramCounter}`);
      updateParams.push(lastName);
      paramCounter++;
    }

    if (username !== undefined) {
      // Check if user has already changed username once
      const userCheck = await query(
        'SELECT username_last_changed FROM users WHERE id = $1',
        [user.id]
      );

      // If username_last_changed is not NULL, they've already changed it once
      if (userCheck.rows[0]?.username_last_changed !== null) {
        return res.status(403).json({
          success: false,
          message: 'Username can only be changed once. Please submit a username change request from your profile settings.',
          requiresRequest: true
        });
      }

      // Validate username format
      const cleanUsername = username.trim().toLowerCase();
      const usernameRegex = /^[a-z0-9_]{3,30}$/;
      if (!usernameRegex.test(cleanUsername)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
        });
      }

      // Check if username is already taken
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [cleanUsername, user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }

      updateFields.push(`username = $${paramCounter}`);
      updateParams.push(cleanUsername);
      paramCounter++;

      // Set username_last_changed to NOW() on first edit
      updateFields.push(`username_last_changed = NOW()`);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCounter}`);
      updateParams.push(phone);
      paramCounter++;
    }

    if (language_preference !== undefined) {
      updateFields.push(`language_preference = $${paramCounter}`);
      updateParams.push(language_preference);
      paramCounter++;
    }

    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramCounter}`);
      updateParams.push(timezone);
      paramCounter++;
    }

    if (notification_preferences !== undefined) {
      updateFields.push(`notification_preferences = $${paramCounter}`);
      updateParams.push(JSON.stringify(notification_preferences));
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(user.id);

    await query(`
      UPDATE users
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCounter}
    `, updateParams);

    // Fetch updated profile
    const result = await query(
      `SELECT id, email, name, first_name, last_name, username, phone, role, profile_picture_url,
              language_preference, timezone, notification_preferences,
              email_verified, phone_verified, is_active, last_active,
              created_at, updated_at
       FROM users
       WHERE id = $1`,
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * POST /api/user/profile/picture
 * Upload profile picture
 */
router.post('/profile/picture', upload.single('profilePicture'), async (req, res) => {
  try {
    const { user } = req;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old profile picture if exists
    const oldPicResult = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [user.id]
    );

    if (oldPicResult.rows[0]?.profile_picture_url) {
      const oldPicPath = path.join(__dirname, '../../', oldPicResult.rows[0].profile_picture_url);
      try {
        await fs.unlink(oldPicPath);
      } catch (err) {
        console.error('Error deleting old profile picture:', err);
        // Continue even if deletion fails
      }
    }

    // Update database with new profile picture URL
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    await query(
      'UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2',
      [profilePictureUrl, user.id]
    );

    return res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePictureUrl: profilePictureUrl
      }
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);

    // Clean up uploaded file if database update fails
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/profile/picture
 * Remove profile picture
 */
router.delete('/profile/picture', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [user.id]
    );

    if (!result.rows[0]?.profile_picture_url) {
      return res.status(404).json({
        success: false,
        message: 'No profile picture found'
      });
    }

    const picPath = path.join(__dirname, '../../', result.rows[0].profile_picture_url);

    // Delete file
    try {
      await fs.unlink(picPath);
    } catch (err) {
      console.error('Error deleting profile picture file:', err);
      // Continue to update database even if file deletion fails
    }

    // Update database
    await query(
      'UPDATE users SET profile_picture_url = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    return res.json({
      success: true,
      message: 'Profile picture removed successfully'
    });

  } catch (error) {
    console.error('Error removing profile picture:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/password
 * Change password
 */
router.put('/password', async (req, res) => {
  try {
    const { user } = req;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const userResult = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    );

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, user.id]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * PUT /api/user/username
 * Update username with 8-hour grace period
 */
router.put('/username', async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    // Validate username
    if (!username || typeof username !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Validate username format (alphanumeric and underscores only, 3-30 chars)
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
      });
    }

    // Check if username is already taken
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [cleanUsername, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Username is already taken'
      });
    }

    // Check when username was last changed
    const userResult = await query(
      'SELECT username_last_changed FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const lastChanged = userResult.rows[0].username_last_changed;
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    // If username was changed more than 8 hours ago, deny the change
    if (lastChanged && new Date(lastChanged) < eightHoursAgo) {
      return res.status(403).json({
        success: false,
        message: 'Username can only be changed within 8 hours of the last change. Please contact support to request a username change.',
        canChange: false,
        lastChanged: lastChanged
      });
    }

    // Update username
    await query(
      'UPDATE users SET username = $1, username_last_changed = $2, updated_at = $3 WHERE id = $4',
      [cleanUsername, now, now, userId]
    );

    // Calculate when the window closes
    const windowClosesAt = new Date(now.getTime() + (8 * 60 * 60 * 1000));

    return res.json({
      success: true,
      message: 'Username updated successfully',
      username: cleanUsername,
      canChangeUntil: windowClosesAt
    });

  } catch (error) {
    console.error('Error updating username:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/username/availability/:username
 * Check if username is available
 */
router.get('/username/availability/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user?.id;

    const cleanUsername = username.trim().toLowerCase();

    // Validate format
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.json({
        available: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
      });
    }

    // Check availability
    const existingUser = await query(
      userId
        ? 'SELECT id FROM users WHERE username = $1 AND id != $2'
        : 'SELECT id FROM users WHERE username = $1',
      userId ? [cleanUsername, userId] : [cleanUsername]
    );

    return res.json({
      available: existingUser.rows.length === 0,
      username: cleanUsername
    });

  } catch (error) {
    console.error('Error checking username availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/username/change-status
 * Check if user can change their username
 */
router.get('/username/change-status', async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await query(
      'SELECT username, username_last_changed FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { username, username_last_changed } = userResult.rows[0];
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - (8 * 60 * 60 * 1000));

    const canChange = !username_last_changed || new Date(username_last_changed) >= eightHoursAgo;
    const windowClosesAt = username_last_changed
      ? new Date(new Date(username_last_changed).getTime() + (8 * 60 * 60 * 1000))
      : null;

    return res.json({
      success: true,
      username,
      canChange,
      lastChanged: username_last_changed,
      windowClosesAt: canChange ? windowClosesAt : null,
      message: canChange
        ? 'You can change your username'
        : 'Username change window has closed. Contact support to request a change.'
    });

  } catch (error) {
    console.error('Error checking username change status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/account
 * Delete user account (soft delete with data anonymization)
 * Requires password verification for security
 */
router.delete('/account', async (req, res) => {
  try {
    const { user } = req;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to delete account'
      });
    }

    // Verify password
    const bcrypt = require('bcryptjs');
    const userResult = await query(
      'SELECT password_hash, role FROM users WHERE id = $1',
      [user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      userResult.rows[0].password_hash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }

    // Soft delete: Mark account as deleted and anonymize personal data
    // Financial records kept for 7 years (legal requirement)
    // Full deletion happens after 30 days via scheduled job

    const deletedAt = new Date();
    const anonymizedEmail = `deleted_${user.id}_${Date.now()}@deleted.beautycita.com`;
    const anonymizedPhone = null;

    await query(`
      UPDATE users
      SET
        email = $1,
        first_name = 'Deleted',
        last_name = 'User',
        phone = $2,
        profile_picture_url = NULL,
        bio = NULL,
        is_active = false,
        deleted_at = $3,
        updated_at = $4
      WHERE id = $5
    `, [anonymizedEmail, anonymizedPhone, deletedAt, deletedAt, user.id]);

    // Delete profile picture file if exists
    const picResult = await query(
      'SELECT profile_picture_url FROM users WHERE id = $1',
      [user.id]
    );

    if (picResult.rows[0]?.profile_picture_url) {
      const picPath = path.join(__dirname, '../../', picResult.rows[0].profile_picture_url);
      try {
        await fs.unlink(picPath);
      } catch (err) {
        console.error('Error deleting profile picture during account deletion:', err);
      }
    }

    // Anonymize or delete non-financial related data
    // Keep bookings and payments for financial/legal compliance

    // Delete portfolio images
    await query('DELETE FROM portfolio_images WHERE user_id = $1', [user.id]);

    // Delete reviews written by user
    await query('DELETE FROM reviews WHERE user_id = $1', [user.id]);

    // Delete AI chat history
    await query('DELETE FROM ai_conversations WHERE user_id = $1', [user.id]);

    // Delete favorites
    await query('DELETE FROM favorites WHERE user_id = $1', [user.id]);

    // Delete search history (if such table exists)
    // await query('DELETE FROM search_history WHERE user_id = $1', [user.id]);

    // Log the deletion for audit purposes
    console.log(`Account deletion requested for user ${user.id} at ${deletedAt.toISOString()}`);

    return res.json({
      success: true,
      message: 'Account deleted successfully. Your personal data has been anonymized. Financial records will be retained for legal compliance.'
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error while deleting account'
    });
  }
});

/**
 * POST /api/user/username-change-request
 * Submit a username change request (after first change)
 */
router.post('/username-change-request', async (req, res) => {
  try {
    const { user } = req;
    const { requestedUsername, reason } = req.body;

    if (!requestedUsername) {
      return res.status(400).json({
        success: false,
        message: 'Requested username is required'
      });
    }

    // Validate username format
    const cleanUsername = requestedUsername.trim().toLowerCase();
    const usernameRegex = /^[a-z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
      });
    }

    // Check if username is already taken
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [cleanUsername, user.id]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken'
      });
    }

    // Check if user already has a pending request
    const pendingRequest = await query(
      'SELECT id FROM username_change_requests WHERE user_id = $1 AND status = $2',
      [user.id, 'PENDING']
    );

    if (pendingRequest.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending username change request. Please wait for it to be reviewed.'
      });
    }

    // Get current username
    const currentUser = await query(
      'SELECT username FROM users WHERE id = $1',
      [user.id]
    );

    // Create the request
    await query(
      `INSERT INTO username_change_requests
       (user_id, current_username, requested_username, reason, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, currentUser.rows[0].username, cleanUsername, reason || null, 'PENDING']
    );

    return res.json({
      success: true,
      message: 'Username change request submitted successfully. An administrator will review it soon.'
    });

  } catch (error) {
    console.error('Error submitting username change request:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/username-change-request/status
 * Check status of current username change request
 */
router.get('/username-change-request/status', async (req, res) => {
  try {
    const { user } = req;

    const request = await query(
      `SELECT id, current_username, requested_username, reason, status,
              reviewed_by, reviewed_at, review_notes, created_at
       FROM username_change_requests
       WHERE user_id = $1 AND status = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.id, 'PENDING']
    );

    if (request.rows.length === 0) {
      return res.json({
        success: true,
        hasPendingRequest: false,
        canSubmitNew: true
      });
    }

    return res.json({
      success: true,
      hasPendingRequest: true,
      canSubmitNew: false,
      request: request.rows[0]
    });

  } catch (error) {
    console.error('Error checking username change request status:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/passkeys
 * Get all passkeys (webauthn credentials) for current user
 */
router.get('/passkeys', async (req, res) => {
  try {
    const { user } = req;

    const result = await query(
      `SELECT id, credential_id, device_name, transports, last_used_at, created_at
       FROM webauthn_credentials
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user.id]
    );

    return res.json({
      success: true,
      passkeys: result.rows
    });

  } catch (error) {
    console.error('Error fetching passkeys:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/user/passkeys/:credentialId
 * Delete a specific passkey
 */
router.delete('/passkeys/:credentialId', async (req, res) => {
  try {
    const { user } = req;
    const { credentialId } = req.params;

    // Check if credential belongs to user
    const checkResult = await query(
      'SELECT id FROM webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
      [credentialId, user.id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Passkey not found'
      });
    }

    // Delete the credential
    await query(
      'DELETE FROM webauthn_credentials WHERE credential_id = $1 AND user_id = $2',
      [credentialId, user.id]
    );

    return res.json({
      success: true,
      message: 'Passkey deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting passkey:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * GET /api/user/login-history
 * Get login history for current user
 */
router.get('/login-history', async (req, res) => {
  try {
    const { user } = req;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT id, login_method, ip_address, user_agent, device_info, location,
              success, failure_reason, created_at
       FROM login_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user.id, parseInt(limit), parseInt(offset)]
    );

    const countResult = await query(
      'SELECT COUNT(*) as total FROM login_history WHERE user_id = $1',
      [user.id]
    );

    return res.json({
      success: true,
      history: result.rows,
      total: parseInt(countResult.rows[0].total)
    });

  } catch (error) {
    console.error('Error fetching login history:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;