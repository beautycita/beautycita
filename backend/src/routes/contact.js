const express = require('express');
const router = express.Router();
const { query } = require('../db');

// POST /api/contact - Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, userType } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Store contact message in database
    await query(
      `INSERT INTO contact_messages (name, email, subject, message, user_type, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'new', NOW())`,
      [name, email, subject, message, userType || 'client']
    );

    res.json({
      success: true,
      message: 'Contact message received. We will respond within 24 hours.'
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit contact form',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
