const express = require('express');
const router = express.Router();
const { query } = require('../db');
const axios = require('axios');

// BTCPay Server configuration
const BTCPAY_URL = process.env.BTCPAY_URL || 'https://beautycita.com/btcpay';
const BTCPAY_API_KEY = process.env.BTCPAY_API_KEY || ''; // Set after BTCPay setup
const BTCPAY_STORE_ID = process.env.BTCPAY_STORE_ID || ''; // Set after BTCPay setup

// CoinGecko API for price data
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

/**
 * Get current Bitcoin price in USD and MXN
 */
async function getBitcoinPrice() {
  try {
    // Check cache first (last 5 minutes)
    const cached = await query(`
      SELECT price_usd, price_mxn, created_at
      FROM bitcoin_price_history
      WHERE created_at > NOW() - INTERVAL '5 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (cached.rows.length > 0) {
      return {
        usd: parseFloat(cached.rows[0].price_usd),
        mxn: parseFloat(cached.rows[0].price_mxn)
      };
    }

    // Fetch fresh price from CoinGecko
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd,mxn'
      }
    });

    const priceUSD = response.data.bitcoin.usd;
    const priceMXN = response.data.bitcoin.mxn;

    // Cache the price
    await query(`
      INSERT INTO bitcoin_price_history (price_usd, price_mxn, source)
      VALUES ($1, $2, 'coingecko')
    `, [priceUSD, priceMXN]);

    return { usd: priceUSD, mxn: priceMXN };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    // Fallback to last known price
    const fallback = await query(`
      SELECT price_usd, price_mxn
      FROM bitcoin_price_history
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (fallback.rows.length > 0) {
      return {
        usd: parseFloat(fallback.rows[0].price_usd),
        mxn: parseFloat(fallback.rows[0].price_mxn)
      };
    }

    throw new Error('Unable to fetch Bitcoin price');
  }
}

/**
 * GET /api/bitcoin/price
 * Get current Bitcoin price
 */
router.get('/price', async (req, res) => {
  try {
    const price = await getBitcoinPrice();
    res.json({
      success: true,
      data: {
        btc_usd: price.usd,
        btc_mxn: price.mxn,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting Bitcoin price:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching Bitcoin price'
    });
  }
});

/**
 * GET /api/bitcoin/wallet
 * Get or create user's Bitcoin deposit wallet via BTCPay invoice
 */
router.get('/wallet', async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user already has an active wallet
    let walletResult = await query(`
      SELECT id, wallet_address, label, created_at, last_used_at, btcpay_invoice_id
      FROM bitcoin_wallets
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (walletResult.rows.length > 0) {
      return res.json({
        success: true,
        data: walletResult.rows[0]
      });
    }

    // Create BTCPay invoice to generate deposit address
    const btcpayResponse = await axios.post(
      `${BTCPAY_URL}/api/v1/stores/${BTCPAY_STORE_ID}/invoices`,
      {
        amount: "0",
        currency: "BTC",
        metadata: {
          userId: userId,
          purpose: "deposit_wallet"
        },
        checkout: {
          expirationMinutes: 525600, // 1 year
          paymentMethods: ["BTC", "BTC-LightningNetwork"]
        }
      },
      {
        headers: {
          'Authorization': `token ${BTCPAY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const invoice = btcpayResponse.data;
    const bitcoinAddress = invoice.checkoutLink; // BTCPay provides payment URI

    // Insert new wallet
    const newWallet = await query(`
      INSERT INTO bitcoin_wallets (
        user_id,
        wallet_address,
        label,
        btcpay_invoice_id,
        btcpay_store_id
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, wallet_address, label, created_at, btcpay_invoice_id
    `, [
      userId,
      bitcoinAddress,
      `${req.user.name || 'User'}'s Deposit Wallet`,
      invoice.id,
      BTCPAY_STORE_ID
    ]);

    res.json({
      success: true,
      data: {
        ...newWallet.rows[0],
        invoice_id: invoice.id,
        checkout_link: invoice.checkoutLink
      }
    });
  } catch (error) {
    console.error('Error creating BTCPay wallet:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating deposit wallet',
      error: error.response?.data?.message || error.message
    });
  }
});

/**
 * GET /api/bitcoin/balance
 * Get user's account balance
 */
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(`
      SELECT
        balance_usd,
        balance_mxn,
        total_deposited_btc,
        total_deposited_usd,
        total_deposited_mxn,
        total_withdrawn_usd,
        total_withdrawn_mxn
      FROM user_balances
      WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      // Create balance record
      await query(`
        INSERT INTO user_balances (user_id)
        VALUES ($1)
      `, [userId]);

      return res.json({
        success: true,
        data: {
          balance_usd: 0,
          balance_mxn: 0,
          total_deposited_btc: 0,
          total_deposited_usd: 0,
          total_deposited_mxn: 0,
          total_withdrawn_usd: 0,
          total_withdrawn_mxn: 0
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching balance'
    });
  }
});

/**
 * GET /api/bitcoin/deposits
 * Get user's deposit history
 */
router.get('/deposits', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT
        id,
        wallet_address,
        txid,
        amount_btc,
        amount_usd,
        amount_mxn,
        btc_usd_rate,
        btc_mxn_rate,
        confirmations,
        status,
        detected_at,
        confirmed_at,
        credited_at,
        notes
      FROM bitcoin_deposits
      WHERE user_id = $1
      ORDER BY detected_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM bitcoin_deposits
      WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      data: {
        deposits: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error getting deposits:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deposits'
    });
  }
});

/**
 * GET /api/bitcoin/transactions
 * Get user's balance transaction history
 */
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const result = await query(`
      SELECT
        id,
        transaction_type,
        amount_usd,
        amount_mxn,
        currency,
        reference_type,
        reference_id,
        description,
        created_at
      FROM balance_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

/**
 * POST /api/bitcoin/webhook
 * BTCPay Server webhook handler
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const event = req.body;

    // Log the webhook event
    const logResult = await query(`
      INSERT INTO btcpay_webhook_events (event_type, invoice_id, store_id, payload)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [
      event.type,
      event.invoiceId,
      event.storeId,
      JSON.stringify(event)
    ]);

    const webhookId = logResult.rows[0].id;

    // Process based on event type
    if (event.type === 'InvoiceReceivedPayment' || event.type === 'InvoiceProcessing') {
      // Payment detected - create or update deposit record
      await handleInvoicePayment(event, webhookId);
    } else if (event.type === 'InvoiceSettled' || event.type === 'InvoicePaymentSettled') {
      // Payment confirmed (3+ confirmations)
      await handleInvoiceSettled(event, webhookId);
    }

    // Mark webhook as processed
    await query(`
      UPDATE btcpay_webhook_events
      SET processed = true, processed_at = NOW()
      WHERE id = $1
    `, [webhookId]);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

/**
 * Handle invoice payment detection
 */
async function handleInvoicePayment(event, webhookId) {
  try {
    // Extract payment details
    const userId = event.metadata?.userId;
    if (!userId) return;

    const txid = event.payment?.id || event.payment?.transactionHash;
    const amountBTC = parseFloat(event.payment?.value || 0);
    const walletAddress = event.payment?.destination;

    // Check if deposit already exists
    const existing = await query(`
      SELECT id FROM bitcoin_deposits WHERE txid = $1
    `, [txid]);

    if (existing.rows.length > 0) {
      // Update existing
      await query(`
        UPDATE bitcoin_deposits
        SET confirmations = $1, status = 'confirming'
        WHERE txid = $2
      `, [event.payment?.confirmations || 0, txid]);
    } else {
      // Create new deposit
      await query(`
        INSERT INTO bitcoin_deposits (
          user_id, wallet_address, txid, amount_btc,
          confirmations, status, btcpay_invoice_id
        )
        VALUES ($1, $2, $3, $4, $5, 'pending', $6)
      `, [userId, walletAddress, txid, amountBTC, event.payment?.confirmations || 0, event.invoiceId]);
    }
  } catch (error) {
    console.error('Error handling invoice payment:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

/**
 * Handle invoice settlement (3+ confirmations)
 */
async function handleInvoiceSettled(event, webhookId) {
  try {
    const userId = event.metadata?.userId;
    if (!userId) return;

    const invoiceId = event.invoiceId;

    // Get deposit
    const depositResult = await query(`
      SELECT id, amount_btc, user_id
      FROM bitcoin_deposits
      WHERE btcpay_invoice_id = $1 AND status != 'credited'
    `, [invoiceId]);

    if (depositResult.rows.length === 0) return;

    const deposit = depositResult.rows[0];
    const amountBTC = parseFloat(deposit.amount_btc);

    // Get current BTC price
    const price = await getBitcoinPrice();
    const amountUSD = amountBTC * price.usd;
    const amountMXN = amountBTC * price.mxn;

    // Update deposit as confirmed
    await query(`
      UPDATE bitcoin_deposits
      SET
        status = 'confirmed',
        confirmations = $1,
        amount_usd = $2,
        amount_mxn = $3,
        btc_usd_rate = $4,
        btc_mxn_rate = $5,
        confirmed_at = NOW()
      WHERE id = $6
    `, [3, amountUSD, amountMXN, price.usd, price.mxn, deposit.id]);

    // Credit user's balance
    await creditUserBalance(deposit.user_id, amountUSD, amountMXN, amountBTC, deposit.id);

  } catch (error) {
    console.error('Error handling invoice settled:', error);
    await query(`
      UPDATE btcpay_webhook_events
      SET error = $1
      WHERE id = $2
    `, [error.message, webhookId]);
  }
}

/**
 * Credit user's balance
 */
async function creditUserBalance(userId, amountUSD, amountMXN, amountBTC, depositId) {
  // Get current balance
  const balanceResult = await query(`
    SELECT balance_usd, balance_mxn
    FROM user_balances
    WHERE user_id = $1
    FOR UPDATE
  `, [userId]);

  const currentBalanceUSD = parseFloat(balanceResult.rows[0]?.balance_usd || 0);
  const currentBalanceMXN = parseFloat(balanceResult.rows[0]?.balance_mxn || 0);

  // Update balance
  await query(`
    UPDATE user_balances
    SET
      balance_usd = balance_usd + $1,
      balance_mxn = balance_mxn + $2,
      total_deposited_btc = total_deposited_btc + $3,
      total_deposited_usd = total_deposited_usd + $1,
      total_deposited_mxn = total_deposited_mxn + $2,
      updated_at = NOW()
    WHERE user_id = $4
  `, [amountUSD, amountMXN, amountBTC, userId]);

  // Log transaction
  await query(`
    INSERT INTO balance_transactions (
      user_id, transaction_type, amount_usd, amount_mxn, currency,
      reference_type, reference_id,
      balance_before_usd, balance_after_usd,
      balance_before_mxn, balance_after_mxn,
      description
    )
    VALUES ($1, 'deposit', $2, $3, 'BOTH', 'bitcoin_deposit', $4, $5, $6, $7, $8, $9)
  `, [
    userId, amountUSD, amountMXN, depositId,
    currentBalanceUSD, currentBalanceUSD + amountUSD,
    currentBalanceMXN, currentBalanceMXN + amountMXN,
    `Bitcoin deposit: ${amountBTC.toFixed(8)} BTC`
  ]);

  // Mark deposit as credited
  await query(`
    UPDATE bitcoin_deposits
    SET status = 'credited', credited_at = NOW()
    WHERE id = $1
  `, [depositId]);
}

module.exports = router;