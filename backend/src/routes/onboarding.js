const express = require('express');
const { query } = require('../db');
const { validateJWT } = require('../middleware/auth');
const winston = require('winston');

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'beautycita-onboarding' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: '/var/www/beautycita.com/backend/logs/onboarding.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

/**
 * GET /api/onboarding/status
 * Get stylist onboarding progress and status
 */
router.get('/status', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user and stylist info
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Only stylists have onboarding
    if (user.role !== 'STYLIST') {
      return res.status(400).json({
        success: false,
        message: 'Onboarding is only for stylists'
      });
    }

    // Get stylist record
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Get onboarding progress
    const progressResult = await query(
      'SELECT * FROM onboarding_progress WHERE stylist_id = $1',
      [stylist.id]
    );

    // Get approval checklist
    const checklistResult = await query(
      'SELECT * FROM stylist_approval_checklist WHERE stylist_id = $1',
      [stylist.id]
    );

    res.json({
      success: true,
      progress: progressResult.rows[0] || null,
      checklist: checklistResult.rows[0] || null,
      stylist: {
        id: stylist.id,
        business_name: stylist.business_name,
        onboarding_step: stylist.onboarding_step,
        onboarding_started_at: stylist.onboarding_started_at,
        onboarding_completed_at: stylist.onboarding_completed_at
      },
      user: {
        user_status: user.user_status
      }
    });

  } catch (error) {
    logger.error('Get onboarding status error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get onboarding status'
    });
  }
});

/**
 * POST /api/onboarding/start
 * Initialize onboarding for a new stylist
 */
router.post('/start', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Create or update onboarding progress
    const progressResult = await query(`
      INSERT INTO onboarding_progress (stylist_id, user_id, current_step, started_at)
      VALUES ($1, $2, 1, NOW())
      ON CONFLICT (stylist_id) DO UPDATE
      SET current_step = 1, updated_at = NOW()
      RETURNING *
    `, [stylist.id, userId]);

    // Update stylist onboarding status
    await query(`
      UPDATE stylists
      SET onboarding_started_at = NOW(), onboarding_step = 1
      WHERE id = $1
    `, [stylist.id]);

    // Update user status
    await query(`
      UPDATE users
      SET user_status = 'PENDING_ONBOARDING'
      WHERE id = $1
    `, [userId]);

    logger.info('Onboarding started', { userId, stylistId: stylist.id });

    res.json({
      success: true,
      message: 'Onboarding initialized',
      progress: progressResult.rows[0]
    });

  } catch (error) {
    logger.error('Start onboarding error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to start onboarding'
    });
  }
});

/**
 * PUT /api/onboarding/step/:stepNumber
 * Save progress for a specific onboarding step
 */
router.put('/step/:stepNumber', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const stepNumber = parseInt(req.params.stepNumber);
    const { stepData } = req.body;

    if (stepNumber < 1 || stepNumber > 5) {
      return res.status(400).json({
        success: false,
        message: 'Invalid step number. Must be 1-5.'
      });
    }

    // Get stylist
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Prepare column names
    const stepDataColumn = `step${stepNumber}_professional_identity`;
    const stepCompletedColumn = `step${stepNumber}_completed`;
    const stepCompletedAtColumn = `step${stepNumber}_completed_at`;

    // Update step data and mark as completed
    const updateQuery = `
      UPDATE onboarding_progress
      SET
        current_step = $1,
        ${stepDataColumn} = $2,
        ${stepCompletedColumn} = true,
        ${stepCompletedAtColumn} = NOW(),
        updated_at = NOW()
      WHERE stylist_id = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [
      stepNumber,
      JSON.stringify(stepData),
      stylist.id
    ]);

    // Update stylist record
    await query(`
      UPDATE stylists
      SET onboarding_step = $1, last_onboarding_update = NOW()
      WHERE id = $2
    `, [stepNumber, stylist.id]);

    logger.info('Onboarding step saved', {
      userId,
      stylistId: stylist.id,
      step: stepNumber
    });

    res.json({
      success: true,
      message: `Step ${stepNumber} saved`,
      progress: result.rows[0]
    });

  } catch (error) {
    logger.error('Save onboarding step error', {
      error: error.message,
      step: req.params.stepNumber
    });
    res.status(500).json({
      success: false,
      message: 'Failed to save step progress'
    });
  }
});

/**
 * POST /api/onboarding/submit
 * Submit completed onboarding for approval
 */
router.post('/submit', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Check if all steps are completed
    const progressResult = await query(
      'SELECT * FROM onboarding_progress WHERE stylist_id = $1',
      [stylist.id]
    );

    if (progressResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No onboarding progress found'
      });
    }

    const progress = progressResult.rows[0];

    if (!progress.all_steps_completed) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all onboarding steps before submitting'
      });
    }

    // Mark onboarding as completed
    await query(`
      UPDATE onboarding_progress
      SET completed_at = NOW()
      WHERE stylist_id = $1
    `, [stylist.id]);

    // Update stylist
    await query(`
      UPDATE stylists
      SET
        onboarding_completed_at = NOW(),
        onboarding_submitted_at = NOW()
      WHERE id = $1
    `, [stylist.id]);

    // Update user status to pending verification
    await query(`
      UPDATE users
      SET user_status = 'PENDING_VERIFICATION'
      WHERE id = $1
    `, [userId]);

    // Get checklist and check if ready for approval
    const checklistResult = await query(
      'SELECT * FROM stylist_approval_checklist WHERE stylist_id = $1',
      [stylist.id]
    );

    let readyForApproval = false;
    if (checklistResult.rows.length > 0) {
      readyForApproval = checklistResult.rows[0].ready_for_approval;

      // If ready, move to pending approval status
      if (readyForApproval) {
        await query(`
          UPDATE users
          SET user_status = 'PENDING_APPROVAL'
          WHERE id = $1
        `, [userId]);
      }
    }

    logger.info('Onboarding submitted', {
      userId,
      stylistId: stylist.id,
      readyForApproval
    });

    // TODO: Send notification email/SMS

    res.json({
      success: true,
      message: 'Onboarding submitted successfully!',
      readyForApproval,
      nextSteps: readyForApproval
        ? 'Your profile is ready for approval. You\'ll hear from us within 24-48 hours.'
        : 'Please complete payment verification (Stripe and Bitcoin) to finalize your profile.'
    });

  } catch (error) {
    logger.error('Submit onboarding error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to submit onboarding'
    });
  }
});

/**
 * GET /api/onboarding/checklist
 * Get approval checklist status
 */
router.get('/checklist', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get stylist
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Get checklist
    const checklistResult = await query(
      'SELECT * FROM stylist_approval_checklist WHERE stylist_id = $1',
      [stylist.id]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Approval checklist not found'
      });
    }

    res.json({
      success: true,
      checklist: checklistResult.rows[0]
    });

  } catch (error) {
    logger.error('Get checklist error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get checklist'
    });
  }
});

/**
 * PUT /api/onboarding/checklist/payment
 * Update payment verification status
 */
router.put('/checklist/payment', validateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { stripeVerified, bitcoinVerified } = req.body;

    // Get stylist
    const stylistResult = await query('SELECT * FROM stylists WHERE user_id = $1', [userId]);
    if (stylistResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Stylist profile not found' });
    }

    const stylist = stylistResult.rows[0];

    // Update checklist
    const updateFields = [];
    const updateValues = [];
    let valueIndex = 1;

    if (stripeVerified !== undefined) {
      updateFields.push(`stripe_verified = $${valueIndex}`);
      updateFields.push(`stripe_verification_date = ${stripeVerified ? 'NOW()' : 'NULL'}`);
      updateValues.push(stripeVerified);
      valueIndex++;
    }

    if (bitcoinVerified !== undefined) {
      updateFields.push(`bitcoin_verified = $${valueIndex}`);
      updateFields.push(`bitcoin_verification_date = ${bitcoinVerified ? 'NOW()' : 'NULL'}`);
      updateValues.push(bitcoinVerified);
      valueIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment verification status provided'
      });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(stylist.id);

    const updateQuery = `
      UPDATE stylist_approval_checklist
      SET ${updateFields.join(', ')}
      WHERE stylist_id = $${valueIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);

    const checklist = result.rows[0];

    // If ready for approval, update user status
    if (checklist.ready_for_approval) {
      await query(`
        UPDATE users
        SET user_status = 'PENDING_APPROVAL'
        WHERE id = $1
      `, [userId]);

      logger.info('Stylist ready for approval', { userId, stylistId: stylist.id });
    }

    res.json({
      success: true,
      message: 'Payment verification status updated',
      checklist,
      readyForApproval: checklist.ready_for_approval
    });

  } catch (error) {
    logger.error('Update payment verification error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to update payment verification'
    });
  }
});

module.exports = router;
