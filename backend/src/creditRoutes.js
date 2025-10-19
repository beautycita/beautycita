const express = require('express');
const { query } = require('./db');
const router = express.Router();

// Credit distribution percentages
const PLATFORM_FEE = 0.03; // 3%
const CLIENT_SHARE_NO_SHOW = 0.60; // 60% of remaining 97%
const STYLIST_SHARE_NO_SHOW = 0.40; // 40% of remaining 97%

// Helper function to add credits to user account
async function addUserCredits(userId, amount, creditType, transactionType, description, bookingId = null, referenceId = null) {
  const client = await query('BEGIN');

  try {
    // Get or create user credits record
    let userCredits = await query(`
      SELECT * FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (userCredits.rows.length === 0) {
      await query(`
        INSERT INTO user_credits (user_id, pending_credits, available_credits)
        VALUES ($1, 0.00, 0.00)
      `, [userId]);

      userCredits = await query(`
        SELECT * FROM user_credits WHERE user_id = $1
      `, [userId]);
    }

    const currentCredits = userCredits.rows[0];

    // Update appropriate credit type
    const updateField = creditType === 'PENDING' ? 'pending_credits' : 'available_credits';
    await query(`
      UPDATE user_credits
      SET ${updateField} = ${updateField} + $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [amount, userId]);

    // Record transaction
    await query(`
      INSERT INTO credit_transactions (
        user_id, booking_id, transaction_type, amount, credit_type,
        description, reference_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
    `, [userId, bookingId, transactionType, amount, creditType, description, referenceId]);

    await query('COMMIT');

    console.log(`Added $${amount} ${creditType} credits to user ${userId}: ${description}`);
    return { success: true };

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error adding user credits:', error);
    return { success: false, error: error.message };
  }
}

// Helper function to process payment distribution
async function distributeBookingPayment(bookingId, totalAmount, distributionType) {
  try {
    // Get booking details
    const bookingResult = await query(`
      SELECT b.*, u_client.id as client_user_id, u_stylist.id as stylist_user_id
      FROM bookings b
      JOIN users u_client ON b.client_id = u_client.id
      JOIN stylists s ON b.stylist_id = s.id
      JOIN users u_stylist ON s.user_id = u_stylist.id
      WHERE b.id = $1
    `, [bookingId]);

    if (bookingResult.rows.length === 0) {
      throw new Error('Booking not found');
    }

    const booking = bookingResult.rows[0];
    const platformAmount = totalAmount * PLATFORM_FEE;
    const remainingAmount = totalAmount - platformAmount;

    let distributions = [];

    switch (distributionType) {
      case 'STYLIST_SUCCESS':
        // Successful booking: 97% to stylist
        distributions.push({
          userId: booking.stylist_user_id,
          amount: remainingAmount,
          creditType: 'AVAILABLE',
          transactionType: 'BOOKING_PAYMENT',
          description: `Payment for completed booking #${bookingId}`
        });
        break;

      case 'STYLIST_DECLINE':
      case 'STYLIST_NO_RESPONSE':
      case 'CLIENT_NO_CONFIRM':
        // Failed booking: 97% to client
        distributions.push({
          userId: booking.client_user_id,
          amount: remainingAmount,
          creditType: 'AVAILABLE',
          transactionType: 'BOOKING_REFUND',
          description: `Refund for failed booking #${bookingId}`
        });
        break;

      case 'CLIENT_NO_SHOW':
        // Client no-show: 97% split 60/40
        const clientAmount = remainingAmount * CLIENT_SHARE_NO_SHOW;
        const stylistAmount = remainingAmount * STYLIST_SHARE_NO_SHOW;

        distributions.push({
          userId: booking.client_user_id,
          amount: clientAmount,
          creditType: 'AVAILABLE',
          transactionType: 'NO_SHOW_PARTIAL_REFUND',
          description: `Partial refund for no-show booking #${bookingId} (60%)`
        });

        distributions.push({
          userId: booking.stylist_user_id,
          amount: stylistAmount,
          creditType: 'AVAILABLE',
          transactionType: 'NO_SHOW_COMPENSATION',
          description: `No-show compensation for booking #${bookingId} (40%)`
        });
        break;

      case 'STYLIST_NO_SHOW':
        // Stylist no-show: 97% to client
        distributions.push({
          userId: booking.client_user_id,
          amount: remainingAmount,
          creditType: 'AVAILABLE',
          transactionType: 'STYLIST_NO_SHOW_REFUND',
          description: `Full refund for stylist no-show booking #${bookingId}`
        });
        break;

      default:
        throw new Error(`Unknown distribution type: ${distributionType}`);
    }

    // Process all distributions
    for (const dist of distributions) {
      await addUserCredits(
        dist.userId,
        dist.amount,
        dist.creditType,
        dist.transactionType,
        dist.description,
        bookingId,
        booking.payment_intent_id
      );
    }

    // Log platform fee
    console.log(`Platform fee collected: $${platformAmount.toFixed(2)} from booking #${bookingId}`);

    return { success: true, platformFee: platformAmount, distributions };

  } catch (error) {
    console.error('Error distributing booking payment:', error);
    return { success: false, error: error.message };
  }
}

// Get user credit balance
router.get('/balance', async (req, res) => {
  try {
    const userId = req.userId;

    const result = await query(`
      SELECT pending_credits, available_credits,
             (pending_credits + available_credits) as total_credits
      FROM user_credits
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Create credits record if it doesn't exist
      await query(`
        INSERT INTO user_credits (user_id, pending_credits, available_credits)
        VALUES ($1, 0.00, 0.00)
      `, [userId]);

      res.json({
        success: true,
        credits: {
          pending: 0.00,
          available: 0.00,
          total: 0.00
        }
      });
    } else {
      const credits = result.rows[0];
      res.json({
        success: true,
        credits: {
          pending: parseFloat(credits.pending_credits),
          available: parseFloat(credits.available_credits),
          total: parseFloat(credits.total_credits)
        }
      });
    }
  } catch (error) {
    console.error('Error getting credit balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit balance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get credit transaction history
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(`
      SELECT ct.*, b.appointment_date, b.appointment_time
      FROM credit_transactions ct
      LEFT JOIN bookings b ON ct.booking_id = b.id
      WHERE ct.user_id = $1
      ORDER BY ct.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Error getting credit history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get credit history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Request credit withdrawal (for stylists)
router.post('/request-withdrawal', async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, bankAccount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid withdrawal amount is required'
      });
    }

    // Get user credits
    const creditsResult = await query(`
      SELECT available_credits FROM user_credits WHERE user_id = $1
    `, [userId]);

    if (creditsResult.rows.length === 0 || creditsResult.rows[0].available_credits < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient available credits'
      });
    }

    // TODO: Integrate with Stripe Connect for actual withdrawal
    // For now, just move credits from available to pending
    await query('BEGIN');

    try {
      // Deduct from available credits
      await query(`
        UPDATE user_credits
        SET available_credits = available_credits - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
      `, [amount, userId]);

      // Record withdrawal transaction
      await query(`
        INSERT INTO credit_transactions (
          user_id, transaction_type, amount, credit_type,
          description, created_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      `, [userId, 'WITHDRAWAL_REQUEST', amount, 'AVAILABLE', `Withdrawal request for $${amount}`]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        amount: amount
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error processing withdrawal request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal request',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export helper functions for use in other routes
module.exports = router;
module.exports.addUserCredits = addUserCredits;
module.exports.distributeBookingPayment = distributeBookingPayment;