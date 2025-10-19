const express = require('express');
const router = express.Router();
const TwilioVerifyPasskeys = require('../services/twilioVerifyPasskeys');

/**
 * Twilio Verify Authentication Routes
 * Hybrid approach: Twilio Verify for SMS + Custom WebAuthn for biometrics
 */

/**
 * POST /api/verify/send-code
 * Send SMS verification code via Twilio Verify
 * Replaces custom SMS code generation
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    console.log('📱 SEND CODE REQUEST:', {
      phoneNumber,
      extractedCountryCode: phoneNumber.substring(0, 3),
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
    });

    // Validate E.164 format
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      console.log('❌ Invalid phone format:', phoneNumber);
      return res.status(400).json({
        error: 'Invalid phone number format. Use E.164 format: +1234567890'
      });
    }

    // Generate 6-digit code
    const crypto = require('crypto');
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // Store in database with 10-minute expiration
    const { query } = require('../db');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(`
      INSERT INTO verification_codes (phone, code, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (phone)
      DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()
    `, [phoneNumber, verificationCode, expiresAt]);

    // Send SMS with Web OTP format for auto-fill
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Web OTP format: @domain #code
    const message = `Your BeautyCita verification code is: ${verificationCode}\n\n@beautycita.com #${verificationCode}`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('✅ SMS sent successfully with Web OTP format to:', phoneNumber);

    res.json({
      success: true,
      message: 'Verification code sent via SMS'
    });

  } catch (error) {
    console.error('SMS send error:', error);

    if (error.code === 21211) {
      return res.status(400).json({
        error: 'Invalid phone number'
      });
    }

    if (error.code === 21614) {
      return res.status(429).json({
        error: 'Too many requests. Please wait before requesting another code.'
      });
    }

    res.status(500).json({
      error: 'Failed to send verification code',
      details: error.message
    });
  }
});

/**
 * POST /api/verify/check-code
 * Verify SMS code via Twilio Verify
 * Returns verification status
 */
router.post('/check-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        error: 'Phone number and verification code are required'
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        error: 'Verification code must be 6 digits'
      });
    }

    // Check code against database
    const { query } = require('../db');
    const result = await query(`
      SELECT code, expires_at
      FROM verification_codes
      WHERE phone = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [phoneNumber]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'No verification code found for this number'
      });
    }

    const storedCode = result.rows[0].code;
    const expiresAt = new Date(result.rows[0].expires_at);

    // Check if code has expired
    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Verification code has expired'
      });
    }

    // Check if code matches
    if (code !== storedCode) {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid verification code'
      });
    }

    // Code is valid - delete it so it can't be reused
    await query('DELETE FROM verification_codes WHERE phone = $1', [phoneNumber]);

    res.json({
      success: true,
      verified: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Twilio Verify check error:', error);

    if (error.code === 60202) {
      return res.status(429).json({
        error: 'Maximum verification attempts exceeded'
      });
    }

    if (error.code === 60200) {
      return res.status(400).json({
        error: 'Invalid verification code'
      });
    }

    res.status(500).json({
      error: 'Failed to verify code',
      details: error.message
    });
  }
});

/**
 * POST /api/verify/resend-code
 * Resend verification code to same phone number
 */
router.post('/resend-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const verifyService = new TwilioVerifyPasskeys();
    const result = await verifyService.sendSMSOnly(phoneNumber);

    res.json({
      success: true,
      message: 'Verification code resent via SMS',
      verificationSid: result.verificationSid
    });

  } catch (error) {
    console.error('Twilio Verify resend error:', error);

    if (error.code === 60203) {
      return res.status(429).json({
        error: 'Too many requests. Please wait 60 seconds before requesting another code.'
      });
    }

    res.status(500).json({
      error: 'Failed to resend verification code',
      details: error.message
    });
  }
});

/**
 * POST /api/verify/send-email-code
 * Send email verification code (6-digit code, not token link)
 */
router.post('/send-email-code', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    console.log('📧 SEND EMAIL CODE REQUEST:', { email });

    // Generate 6-digit code
    const crypto = require('crypto');
    const verificationCode = crypto.randomInt(100000, 999999).toString();

    // Store in database with 10-minute expiration
    const { query } = require('../db');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(`
      INSERT INTO email_verification_codes (email, code, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (email)
      DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()
    `, [email, verificationCode, expiresAt]);

    // Send email with code
    const emailService = require('../emailService');
    await emailService.sendEmailVerificationCode(email, verificationCode);

    console.log('✅ Email verification code sent to:', email);

    res.json({
      success: true,
      message: 'Verification code sent to your email'
    });

  } catch (error) {
    console.error('Email code send error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send verification code',
      details: error.message
    });
  }
});

/**
 * POST /api/verify/verify-email
 * Verify email using 6-digit code
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required'
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({
        success: false,
        error: 'Verification code must be 6 digits'
      });
    }

    console.log('📧 VERIFY EMAIL CODE REQUEST:', { email });

    // Check code against database
    const { query } = require('../db');
    const result = await query(`
      SELECT code, expires_at
      FROM email_verification_codes
      WHERE email = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found for this email'
      });
    }

    const storedCode = result.rows[0].code;
    const expiresAt = new Date(result.rows[0].expires_at);

    // Check if code has expired
    if (new Date() > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired'
      });
    }

    // Check if code matches
    if (code !== storedCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // Code is valid - delete it so it can't be reused
    await query('DELETE FROM email_verification_codes WHERE email = $1', [email]);

    console.log('✅ Email verified successfully:', email);

    res.json({
      success: true,
      verified: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify email',
      details: error.message
    });
  }
});

module.exports = router;
