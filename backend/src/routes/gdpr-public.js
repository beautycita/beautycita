const express = require('express');
const router = express.Router();
const { query } = require('../db');

// POST /api/cookie-consent
// Record user's cookie consent choices (PUBLIC - no auth required)
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
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        session_id || null,
        necessary_cookies,
        functional_cookies,
        analytics_cookies,
        marketing_cookies,
        req.ip || req.connection.remoteAddress,
        req.get('user-agent') || 'Unknown'
      ]
    );

    res.json({
      success: true,
      message: 'Cookie consent recorded'
    });
  } catch (error) {
    console.error('Cookie consent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record cookie consent'
    });
  }
});

module.exports = router;
