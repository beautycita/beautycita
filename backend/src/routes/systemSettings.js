const express = require('express');
const router = express.Router();
const { query } = require('../db');

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || (req.user.role !== 'SUPERADMIN' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Get all system settings
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query('SELECT * FROM system_settings ORDER BY key');

    // Map database settings to frontend format
    const settings = result.rows.map((row, index) => {
      // Determine type based on value
      let type = 'string';
      let category = 'general';

      if (!isNaN(parseFloat(row.value)) && isFinite(row.value)) {
        type = 'number';
      } else if (row.value === 'true' || row.value === 'false') {
        type = 'boolean';
      }

      // Categorize based on key
      if (row.key.includes('commission') || row.key.includes('payout') || row.key.includes('payment')) {
        category = 'payments';
      } else if (row.key.includes('notification') || row.key.includes('sms') || row.key.includes('email')) {
        category = 'notifications';
      } else if (row.key.includes('security') || row.key.includes('login') || row.key.includes('session')) {
        category = 'security';
      } else if (row.key.includes('booking') || row.key.includes('review') || row.key.includes('cancellation')) {
        category = 'features';
      }

      return {
        id: String(index + 1),
        key: row.key,
        value: row.value,
        category,
        type,
        description: row.description || '',
        isEditable: true
      };
    });

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system settings'
    });
  }
});

// Update system settings
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { settings } = req.body;

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        success: false,
        message: 'Settings must be an array'
      });
    }

    // Update each setting
    for (const setting of settings) {
      await query(
        `INSERT INTO system_settings (key, value, description, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = $2, description = $3, updated_at = NOW()`,
        [setting.key, setting.value, setting.description]
      );
    }

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update system settings'
    });
  }
});

// Update a single setting
router.patch('/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const result = await query(
      `UPDATE system_settings
       SET value = $1, updated_at = NOW()
       WHERE key = $2
       RETURNING *`,
      [value, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

module.exports = router;
