-- Migration: Stripe Dispute Enhancements
-- Date: 2025-10-08
-- Description: Add columns to support comprehensive Stripe dispute handling

-- Add has_active_dispute column to stylists table
ALTER TABLE stylists
ADD COLUMN IF NOT EXISTS has_active_dispute BOOLEAN DEFAULT false;

-- Add index for quick lookup of stylists with active disputes
CREATE INDEX IF NOT EXISTS idx_stylists_active_disputes
ON stylists(has_active_dispute) WHERE has_active_dispute = true;

-- Add additional dispute tracking columns if not exists
ALTER TABLE payment_disputes
ADD COLUMN IF NOT EXISTS evidence_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_submitted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_outcome_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_network_reason_code VARCHAR(50);

-- Add indexes for better dispute query performance
CREATE INDEX IF NOT EXISTS idx_disputes_evidence_deadline
ON payment_disputes(evidence_deadline) WHERE status IN ('warning_needs_response', 'needs_response');

-- Create view for active disputes needing attention
CREATE OR REPLACE VIEW active_disputes_needing_response AS
SELECT
  pd.id,
  pd.stripe_dispute_id,
  pd.amount,
  pd.reason,
  pd.status,
  pd.evidence_deadline,
  pd.created_at,
  p.id as payment_id,
  p.booking_id,
  s.id as stylist_id,
  st.business_name as stylist_business_name,
  st.user_id as stylist_user_id,
  u.email as stylist_email,
  u.name as stylist_name,
  EXTRACT(EPOCH FROM (pd.evidence_deadline - NOW())) / 3600 as hours_until_deadline
FROM payment_disputes pd
JOIN payments p ON pd.payment_id = p.id
JOIN stylists s ON pd.stylist_id = s.id
JOIN stylists st ON s.id = st.id
JOIN users u ON st.user_id = u.id
WHERE pd.status IN ('warning_needs_response', 'needs_response')
  AND pd.evidence_deadline > NOW()
ORDER BY pd.evidence_deadline ASC;

-- Create function to auto-cleanup old dispute data
CREATE OR REPLACE FUNCTION cleanup_old_dispute_records()
RETURNS void AS $$
BEGIN
  -- Archive disputes older than 2 years
  -- This is a placeholder - you might want to move to archive table instead
  UPDATE payment_disputes
  SET admin_notes = CONCAT(admin_notes, ' [Archived due to age]')
  WHERE resolved_at < NOW() - INTERVAL '2 years'
    AND admin_notes NOT LIKE '%[Archived due to age]%';
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON COLUMN stylists.has_active_dispute IS 'Indicates if stylist has any active disputes requiring attention';
COMMENT ON COLUMN payment_disputes.evidence_submitted_at IS 'Timestamp when evidence was submitted to Stripe';
COMMENT ON COLUMN payment_disputes.auto_submitted IS 'Whether evidence was auto-submitted by system';
COMMENT ON COLUMN payment_disputes.stripe_outcome_type IS 'Type of outcome from Stripe (e.g., won, lost)';
COMMENT ON COLUMN payment_disputes.stripe_network_reason_code IS 'Reason code from card network';

COMMENT ON VIEW active_disputes_needing_response IS 'View of all disputes requiring response with time remaining';

-- Grant necessary permissions
-- GRANT SELECT ON active_disputes_needing_response TO beautycita_app;
