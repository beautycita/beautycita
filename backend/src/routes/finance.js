const express = require('express');
const router = express.Router();
const { query } = require('../db');
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'beautycita-secret', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.userId = user.id;
    next();
  });
};

/**
 * GET /api/finance/balance
 * Get user's current balance
 */
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT balance_usd FROM user_balances WHERE user_id = $1',
      [req.userId]
    );

    const balance = result.rows[0]?.balance_usd || 0;

    res.json({ success: true, balance: parseFloat(balance) });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch balance' });
  }
});

/**
 * GET /api/finance/transactions
 * Get user's transaction history
 */
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT
        id,
        type,
        amount,
        status,
        description,
        reference,
        created_at
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50`,
      [req.userId]
    );

    res.json({ success: true, transactions: result.rows });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/finance/deposit
 * Initiate a deposit
 */
router.post('/deposit', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Create transaction record
    const transactionResult = await query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'deposit', $2, 'pending', 'Deposit to BeautyCita wallet', NOW())
       RETURNING id`,
      [req.userId, amount]
    );

    // In a real system, you would integrate with Stripe/PayPal here
    // For now, we'll simulate immediate approval
    await query(
      'UPDATE transactions SET status = $1 WHERE id = $2',
      ['completed', transactionResult.rows[0].id]
    );

    // Update user balance
    await query(
      `INSERT INTO user_balances (user_id, balance_usd)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET balance_usd = user_balances.balance_usd + $2`,
      [req.userId, amount]
    );

    res.json({
      success: true,
      message: 'Deposit completed successfully',
      transaction_id: transactionResult.rows[0].id
    });
  } catch (error) {
    console.error('Error processing deposit:', error);
    res.status(500).json({ success: false, message: 'Failed to process deposit' });
  }
});

/**
 * POST /api/finance/withdraw
 * Initiate a withdrawal
 */
router.post('/withdraw', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    // Check balance
    const balanceResult = await query(
      'SELECT balance_usd FROM user_balances WHERE user_id = $1',
      [req.userId]
    );

    const currentBalance = parseFloat(balanceResult.rows[0]?.balance_usd || 0);

    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Create transaction record
    const transactionResult = await query(
      `INSERT INTO transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'withdraw', $2, 'pending', 'Withdrawal from BeautyCita wallet', NOW())
       RETURNING id`,
      [req.userId, amount]
    );

    // Update balance immediately
    await query(
      'UPDATE user_balances SET balance_usd = balance_usd - $1 WHERE user_id = $2',
      [amount, req.userId]
    );

    // Mark as completed (in real system, would wait for bank transfer)
    await query(
      'UPDATE transactions SET status = $1 WHERE id = $2',
      ['completed', transactionResult.rows[0].id]
    );

    res.json({
      success: true,
      message: 'Withdrawal initiated successfully',
      transaction_id: transactionResult.rows[0].id
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    res.status(500).json({ success: false, message: 'Failed to process withdrawal' });
  }
});

/**
 * POST /api/finance/pay
 * Send payment to another user
 */
router.post('/pay', authenticateToken, async (req, res) => {
  try {
    const { recipient, amount, description } = req.body;

    if (!recipient || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment details' });
    }

    // Check balance
    const balanceResult = await query(
      'SELECT balance_usd FROM user_balances WHERE user_id = $1',
      [req.userId]
    );

    const currentBalance = parseFloat(balanceResult.rows[0]?.balance_usd || 0);

    if (currentBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Find recipient
    const recipientResult = await query(
      'SELECT id FROM users WHERE email = $1 OR phone = $2',
      [recipient, recipient]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const recipientId = recipientResult.rows[0].id;

    // Create payment transaction
    const transactionResult = await query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference, created_at)
       VALUES ($1, 'payment', $2, 'completed', $3, $4, NOW())
       RETURNING id`,
      [req.userId, amount, description || 'Payment sent', `PAY-${Date.now()}`]
    );

    // Create receipt transaction for recipient
    await query(
      `INSERT INTO transactions (user_id, type, amount, status, description, reference, created_at)
       VALUES ($1, 'deposit', $2, 'completed', $3, $4, NOW())`,
      [recipientId, amount, description || 'Payment received', `PAY-${Date.now()}`]
    );

    // Update balances
    await query(
      'UPDATE user_balances SET balance_usd = balance_usd - $1 WHERE user_id = $2',
      [amount, req.userId]
    );

    await query(
      `INSERT INTO user_balances (user_id, balance_usd)
       VALUES ($1, $2)
       ON CONFLICT (user_id)
       DO UPDATE SET balance_usd = user_balances.balance_usd + $2`,
      [recipientId, amount]
    );

    res.json({
      success: true,
      message: 'Payment sent successfully',
      transaction_id: transactionResult.rows[0].id
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

/**
 * POST /api/finance/dispute
 * Create a dispute for a transaction
 */
router.post('/dispute', authenticateToken, async (req, res) => {
  try {
    const { transactionId, reason, description } = req.body;

    if (!transactionId || !reason || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Verify transaction belongs to user
    const transactionResult = await query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, req.userId]
    );

    if (transactionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Create dispute
    const disputeResult = await query(
      `INSERT INTO disputes (
        user_id,
        transaction_id,
        reason,
        description,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, 'pending', NOW())
      RETURNING id`,
      [req.userId, transactionId, reason, description]
    );

    // Mark transaction as disputed
    await query(
      'UPDATE transactions SET status = $1 WHERE id = $2',
      ['disputed', transactionId]
    );

    res.json({
      success: true,
      message: 'Dispute created successfully',
      dispute_id: disputeResult.rows[0].id
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ success: false, message: 'Failed to create dispute' });
  }
});

module.exports = router;
