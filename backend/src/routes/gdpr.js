const express = require('express');
const router = express.Router();
const { query } = require('../db');
const crypto = require('crypto');

// Middleware to ensure user is authenticated
const validateJWT = (req, res, next) => {
  // This should be imported from your auth middleware
  // For now, assuming it's already applied at app level
  if (!req.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
};

// Log GDPR action to audit trail
async function logGDPRAction(userId, actionType, details, req) {
  try {
    await query(
      `INSERT INTO gdpr_audit_log (user_id, action_type, details, ip_address, user_agent)
       VALUES (, , , , )`,
      [
        userId,
        actionType,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      ]
    );
  } catch (error) {
    console.error('Failed to log GDPR action:', error);
  }
}

// GET /api/users/privacy-settings
// Get user's current privacy settings
router.get('/privacy-settings', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Get or create privacy settings
    let result = await query(
      'SELECT * FROM user_privacy_settings WHERE user_id = ',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings
      result = await query(
        `INSERT INTO user_privacy_settings (user_id)
         VALUES ()
         RETURNING *`,
        [userId]
      );
    }

    res.json({
      success: true,
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch privacy settings'
    });
  }
});

// PUT /api/users/privacy-settings
// Update user's privacy settings
router.put('/privacy-settings', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const {
      marketing_emails,
      promotional_emails,
      booking_reminders,
      sms_notifications,
      share_data_with_stylists,
      show_profile_in_search,
      analytics_tracking
    } = req.body;

    const result = await query(
      `INSERT INTO user_privacy_settings (
        user_id, marketing_emails, promotional_emails, booking_reminders,
        sms_notifications, share_data_with_stylists, show_profile_in_search,
        analytics_tracking, updated_at
      ) VALUES (, , , , , , , , CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        marketing_emails = EXCLUDED.marketing_emails,
        promotional_emails = EXCLUDED.promotional_emails,
        booking_reminders = EXCLUDED.booking_reminders,
        sms_notifications = EXCLUDED.sms_notifications,
        share_data_with_stylists = EXCLUDED.share_data_with_stylists,
        show_profile_in_search = EXCLUDED.show_profile_in_search,
        analytics_tracking = EXCLUDED.analytics_tracking,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        userId,
        marketing_emails,
        promotional_emails,
        booking_reminders,
        sms_notifications,
        share_data_with_stylists,
        show_profile_in_search,
        analytics_tracking
      ]
    );

    await logGDPRAction(userId, 'update_privacy', req.body, req);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      settings: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update privacy settings'
    });
  }
});

// POST /api/users/export-data
// Request personal data export (GDPR Article 15)
router.post('/export-data', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user info
    const userResult = await query(
      'SELECT id, email, name, phone, created_at FROM users WHERE id = ',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Gather all user data
    const [
      bookings,
      services,
      reviews,
      payments,
      privacySettings,
      stylistProfile
    ] = await Promise.all([
      query('SELECT * FROM bookings WHERE client_id =  OR stylist_id = (SELECT id FROM stylists WHERE user_id = )', [userId]),
      query('SELECT * FROM services WHERE stylist_id = (SELECT id FROM stylists WHERE user_id = )', [userId]),
      query('SELECT * FROM reviews WHERE reviewer_id = ', [userId]),
      query('SELECT * FROM payments WHERE user_id = ', [userId]),
      query('SELECT * FROM user_privacy_settings WHERE user_id = ', [userId]),
      query('SELECT * FROM stylists WHERE user_id = ', [userId])
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      user_info: user,
      bookings: bookings.rows,
      services: services.rows,
      reviews: reviews.rows,
      payment_history: payments.rows.map(p => ({
        ...p,
        // Redact sensitive payment info
        card_last4: p.card_last4,
        card_brand: p.card_brand
      })),
      privacy_settings: privacySettings.rows[0] || null,
      stylist_profile: stylistProfile.rows[0] || null
    };

    // Create export request record
    await query(
      `INSERT INTO data_export_requests (user_id, email, status, completed_at)
       VALUES (, , 'completed', CURRENT_TIMESTAMP)`,
      [userId, user.email]
    );

    await logGDPRAction(userId, 'export_data', { email: user.email }, req);

    res.json({
      success: true,
      message: 'Data export generated successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user data'
    });
  }
});

// POST /api/users/delete-account
// Request account deletion (GDPR Article 17 - Right to be forgotten)
router.post('/delete-account', validateJWT, async (req, res) => {
  try {
    const userId = req.userId;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        success: false,
        message: 'Invalid confirmation text. Please type DELETE MY ACCOUNT to confirm.'
      });
    }

    // Get user info
    const userResult = await query(
      'SELECT id, email, name FROM users WHERE id = ',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Check for pending bookings
    const pendingBookings = await query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE (client_id =  OR stylist_id = (SELECT id FROM stylists WHERE user_id = ))
       AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
       AND scheduled_date > CURRENT_TIMESTAMP`,
      [userId]
    );

    if (parseInt(pendingBookings.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with pending bookings. Please cancel all future bookings first.',
        pending_bookings: parseInt(pendingBookings.rows[0].count)
      });
    }

    // Generate cancellation token
    const cancellationToken = crypto.randomBytes(32).toString('hex');
    
    // Schedule deletion for 30 days from now (GDPR grace period)
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 30);

    // Create deletion request
    await query(
      `INSERT INTO data_deletion_requests (
        user_id, email, scheduled_deletion_date, status, cancellation_token
      ) VALUES (, , , 'pending', )`,
      [userId, user.email, scheduledDate, cancellationToken]
    );

    // Mark user as inactive
    await query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ',
      [userId]
    );

    await logGDPRAction(userId, 'delete_account', {
      scheduled_deletion_date: scheduledDate,
      email: user.email
    }, req);

    res.json({
      success: true,
      message: 'Account deletion scheduled',
      scheduled_deletion_date: scheduledDate,
      cancellation_url: `/cancel-deletion/${cancellationToken}`,
      grace_period_days: 30
    });
  } catch (error) {
    console.error('Error requesting account deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request account deletion'
    });
  }
});

// POST /api/users/cancel-deletion
// Cancel a pending account deletion request
router.post('/cancel-deletion', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation token is required'
      });
    }

    // Find deletion request
    const deletionRequest = await query(
      `SELECT * FROM data_deletion_requests 
       WHERE cancellation_token =  AND status = 'pending'`,
      [token]
    );

    if (deletionRequest.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Deletion request not found or already processed'
      });
    }

    const request = deletionRequest.rows[0];

    // Cancel the deletion request
    await query(
      `UPDATE data_deletion_requests 
       SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP
       WHERE id = `,
      [request.id]
    );

    // Reactivate user account
    await query(
      'UPDATE users SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = ',
      [request.user_id]
    );

    await logGDPRAction(request.user_id, 'cancel_deletion', {
      request_id: request.id
    }, req);

    res.json({
      success: true,
      message: 'Account deletion cancelled. Your account has been reactivated.'
    });
  } catch (error) {
    console.error('Error cancelling deletion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel deletion request'
    });
  }
});

// POST /api/users/cookie-consent
// Record user's cookie consent choices
router.post('/cookie-consent', async (req, res) => {
  try {
    const {
      necessary_cookies = true,
      functional_cookies = false,
      analytics_cookies = false,
      marketing_cookies = false,
      session_id
    } = req.body;

    const userId = req.userId || null; // May be null for non-authenticated users

    await query(
      `INSERT INTO cookie_consents (
        user_id, session_id, necessary_cookies, functional_cookies,
        analytics_cookies, marketing_cookies, ip_address, user_agent
      ) VALUES (, , , , , , , )`,
      [
        userId,
        session_id,
        necessary_cookies,
        functional_cookies,
        analytics_cookies,
        marketing_cookies,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent')
      ]
    );

    if (userId) {
      await logGDPRAction(userId, 'cookie_consent', req.body, req);
    }

    res.json({
      success: true,
      message: 'Cookie preferences saved'
    });
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save cookie preferences'
    });
  }
});

module.exports = router;
