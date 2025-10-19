-- Bitcoin Payment System Schema
-- Created: 2025-09-30
-- Purpose: Handle Bitcoin deposits, wallet management, and user balances

-- Bitcoin Wallets - One per user for deposits
CREATE TABLE IF NOT EXISTS bitcoin_wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(100) UNIQUE NOT NULL,
    btcpay_store_id VARCHAR(100), -- BTCPay Store ID
    btcpay_derivation_path VARCHAR(100), -- HD wallet path
    label VARCHAR(255), -- User-friendly label
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP,

    UNIQUE(user_id) -- One wallet per user
);

-- Bitcoin Deposits - Track incoming transactions
CREATE TABLE IF NOT EXISTS bitcoin_deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(100) NOT NULL,
    txid VARCHAR(100) UNIQUE NOT NULL, -- Transaction ID
    amount_btc DECIMAL(16, 8) NOT NULL, -- BTC amount (8 decimals)
    amount_usd DECIMAL(12, 2), -- USD equivalent at time of deposit
    amount_mxn DECIMAL(12, 2), -- MXN equivalent at time of deposit
    btc_usd_rate DECIMAL(12, 2), -- Exchange rate at confirmation
    btc_mxn_rate DECIMAL(12, 2), -- Exchange rate at confirmation
    confirmations INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirming, confirmed, credited, failed
    btcpay_invoice_id VARCHAR(100), -- BTCPay invoice ID if applicable
    network_fee_btc DECIMAL(16, 8), -- Network fee paid
    detected_at TIMESTAMP DEFAULT NOW(), -- When we first saw it
    confirmed_at TIMESTAMP, -- When it reached 3+ confirmations
    credited_at TIMESTAMP, -- When we credited user's account
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_user ON bitcoin_deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_wallet ON bitcoin_deposits(wallet_address);
CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_txid ON bitcoin_deposits(txid);
CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_status ON bitcoin_deposits(status);

-- User Balances - Track USD and MXN balances from Bitcoin deposits
CREATE TABLE IF NOT EXISTS user_balances (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance_usd DECIMAL(12, 2) DEFAULT 0.00,
    balance_mxn DECIMAL(12, 2) DEFAULT 0.00,
    total_deposited_btc DECIMAL(16, 8) DEFAULT 0,
    total_deposited_usd DECIMAL(12, 2) DEFAULT 0,
    total_deposited_mxn DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn_usd DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn_mxn DECIMAL(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Balance Transactions - Audit log for all balance changes
CREATE TABLE IF NOT EXISTS balance_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- deposit, withdrawal, refund, fee, booking_payment, etc.
    amount_usd DECIMAL(12, 2),
    amount_mxn DECIMAL(12, 2),
    currency VARCHAR(3), -- USD or MXN
    reference_type VARCHAR(50), -- bitcoin_deposit, booking, refund, etc.
    reference_id INTEGER, -- ID of related record
    balance_before_usd DECIMAL(12, 2),
    balance_after_usd DECIMAL(12, 2),
    balance_before_mxn DECIMAL(12, 2),
    balance_after_mxn DECIMAL(12, 2),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_balance_transactions_user ON balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_type ON balance_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_ref ON balance_transactions(reference_type, reference_id);

-- Bitcoin Withdrawal Requests - Users request to cash out
CREATE TABLE IF NOT EXISTS bitcoin_withdrawal_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    destination_address VARCHAR(100) NOT NULL, -- User's BTC wallet
    amount_usd DECIMAL(12, 2) NOT NULL,
    amount_btc DECIMAL(16, 8), -- Calculated BTC amount
    btc_usd_rate DECIMAL(12, 2), -- Exchange rate at request
    network_fee_btc DECIMAL(16, 8), -- Estimated network fee
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, processing, completed, rejected, failed
    txid VARCHAR(100), -- Transaction ID once sent
    requested_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    admin_notes TEXT,
    rejection_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON bitcoin_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON bitcoin_withdrawal_requests(status);

-- Bitcoin Price History - Cache exchange rates
CREATE TABLE IF NOT EXISTS bitcoin_price_history (
    id SERIAL PRIMARY KEY,
    price_usd DECIMAL(12, 2) NOT NULL,
    price_mxn DECIMAL(12, 2) NOT NULL,
    source VARCHAR(50) DEFAULT 'coingecko', -- API source
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_created ON bitcoin_price_history(created_at);

-- BTCPay Webhooks Log - Track all webhook events
CREATE TABLE IF NOT EXISTS btcpay_webhook_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL, -- InvoiceReceivedPayment, InvoiceProcessing, etc.
    invoice_id VARCHAR(100),
    store_id VARCHAR(100),
    payload JSONB NOT NULL, -- Full webhook payload
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_invoice ON btcpay_webhook_events(invoice_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processed ON btcpay_webhook_events(processed);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_user_status ON bitcoin_deposits(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bitcoin_deposits_created ON bitcoin_deposits(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_transactions_created ON balance_transactions(created_at DESC);

-- Add trigger to update user_balances.updated_at
CREATE OR REPLACE FUNCTION update_user_balance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_balance_timestamp
    BEFORE UPDATE ON user_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_user_balance_timestamp();

-- Insert initial balance records for existing users
INSERT INTO user_balances (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_balances);

COMMENT ON TABLE bitcoin_wallets IS 'Bitcoin deposit wallet addresses assigned to users';
COMMENT ON TABLE bitcoin_deposits IS 'Tracks all incoming Bitcoin transactions';
COMMENT ON TABLE user_balances IS 'User account balances in USD and MXN from Bitcoin deposits';
COMMENT ON TABLE balance_transactions IS 'Audit log of all balance changes';
COMMENT ON TABLE bitcoin_withdrawal_requests IS 'User requests to withdraw BTC or convert to fiat';
COMMENT ON TABLE bitcoin_price_history IS 'Historical BTC/USD and BTC/MXN exchange rates';
COMMENT ON TABLE btcpay_webhook_events IS 'Log of all BTCPay Server webhook events';