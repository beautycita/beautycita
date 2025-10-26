const express = require('express');
const { query } = require('../db');
const router = express.Router();
const SMSService = require('../smsService');
const smsService = new SMSService();

// GET /api/onboarding/client/status
// Check if client has completed onboarding
router.get('/client/status', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(
      `SELECT onboarding_completed, onboarding_completed_at FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      completed: user.onboarding_completed || false,
      completedAt: user.onboarding_completed_at
    });
  } catch (error) {
    console.error('Check onboarding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check onboarding status'
    });
  }
});

// POST /api/onboarding/send-verification
// Send phone verification code
router.post('/send-verification', async (req, res) => {
  try {
    const userId = req.userId;
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    await query(
      `INSERT INTO user_phone_verification (user_id, phone_number, verification_code, created_at, expires_at, verified)
       VALUES ($1, $2, $3, NOW(), $4, false)
       ON CONFLICT (user_id) DO UPDATE SET
         phone_number = $2,
         verification_code = $3,
         created_at = NOW(),
         expires_at = $4,
         verified = false`,
      [userId, phone, verificationCode, expiresAt]
    );

    // Send SMS
    const smsResult = await smsService.sendSMS(
      userId,
      phone,
      `Your BeautyCita verification code is: ${verificationCode}. This code expires in 10 minutes.`,
      'PHONE_VERIFICATION'
    );

    if (smsResult.success) {
      res.json({
        success: true,
        message: 'Verification code sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification code'
      });
    }
  } catch (error) {
    console.error('Send verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
});

// POST /api/onboarding/verify-phone
// Verify phone number with code
router.post('/verify-phone', async (req, res) => {
  try {
    const userId = req.userId;
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and verification code are required'
      });
    }

    // Check verification code
    const result = await query(
      `SELECT * FROM user_phone_verification
       WHERE user_id = $1 AND phone_number = $2 AND verification_code = $3
       AND expires_at > NOW() AND verified = false`,
      [userId, phone, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification code'
      });
    }

    // Mark as verified
    await query(
      `UPDATE user_phone_verification
       SET verified = true, verified_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    // Update user phone and phone_verified status
    await query(
      `UPDATE users
       SET phone = $1, phone_verified = true, updated_at = NOW()
       WHERE id = $2`,
      [phone, userId]
    );

    res.json({
      success: true,
      message: 'Phone verified successfully'
    });
  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone'
    });
  }
});

// POST /api/onboarding/save-location
// Save user location
router.post('/save-location', async (req, res) => {
  try {
    const userId = req.userId;
    const { city, state, zip, latitude, longitude } = req.body;

    if (!city || !zip) {
      return res.status(400).json({
        success: false,
        message: 'City and zip code are required'
      });
    }

    // Update client preferences with location
    const clientResult = await query(
      `SELECT id, preferences FROM clients WHERE user_id = $1`,
      [userId]
    );

    if (clientResult.rows.length === 0) {
      // Create client record if doesn't exist
      const preferences = {
        location: { city, state, zip, latitude, longitude }
      };

      await query(
        `INSERT INTO clients (user_id, preferences, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(preferences)]
      );
    } else {
      // Update existing preferences
      const client = clientResult.rows[0];
      const preferences = client.preferences || {};
      preferences.location = { city, state, zip, latitude, longitude };

      await query(
        `UPDATE clients SET preferences = $1, updated_at = NOW() WHERE user_id = $2`,
        [JSON.stringify(preferences), userId]
      );
    }

    res.json({
      success: true,
      message: 'Location saved successfully'
    });
  } catch (error) {
    console.error('Save location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save location'
    });
  }
});

// POST /api/onboarding/save-preferences
// Save service preferences
router.post('/save-preferences', async (req, res) => {
  try {
    const userId = req.userId;
    const { services } = req.body;

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({
        success: false,
        message: 'Services array is required'
      });
    }

    // Get or create client record
    const clientResult = await query(
      `SELECT id, preferences FROM clients WHERE user_id = $1`,
      [userId]
    );

    if (clientResult.rows.length === 0) {
      const preferences = {
        favoriteServices: services
      };

      await query(
        `INSERT INTO clients (user_id, preferences, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())`,
        [userId, JSON.stringify(preferences)]
      );
    } else {
      const client = clientResult.rows[0];
      const preferences = client.preferences || {};
      preferences.favoriteServices = services;

      await query(
        `UPDATE clients SET preferences = $1, updated_at = NOW() WHERE user_id = $2`,
        [JSON.stringify(preferences), userId]
      );
    }

    res.json({
      success: true,
      message: 'Service preferences saved successfully'
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save preferences'
    });
  }
});

// POST /api/onboarding/upload-picture
// Upload profile picture
router.post('/upload-picture', async (req, res) => {
  try {
    const userId = req.userId;

    // Check if file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const file = req.files.profilePicture;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, and GIF are allowed'
      });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: 'File size must be less than 5MB'
      });
    }

    // Generate unique filename
    const extension = file.name.split('.').pop();
    const filename = `profile-${userId}-${Date.now()}.${extension}`;
    const uploadPath = `/var/www/beautycita.com/backend/uploads/profiles/${filename}`;

    // Move file to uploads directory
    await file.mv(uploadPath);

    // Update user profile picture URL
    const profilePictureUrl = `/uploads/profiles/${filename}`;
    await query(
      `UPDATE users SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2`,
      [profilePictureUrl, userId]
    );

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      url: profilePictureUrl
    });
  } catch (error) {
    console.error('Upload picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
});

// POST /api/onboarding/complete
// Mark onboarding as complete
router.post('/complete', async (req, res) => {
  try {
    const userId = req.userId;

    await query(
      `UPDATE users
       SET onboarding_completed = true,
           onboarding_completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      message: 'Onboarding completed successfully'
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding'
    });
  }
});

module.exports = router;
