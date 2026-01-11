-- Stripe Webhook Events Table
-- Tracks processed webhook events for idempotency
-- Prevents duplicate processing if Stripe retries

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,                    -- Stripe event ID (evt_xxx)
  event_type TEXT NOT NULL,                         -- checkout.session.completed, etc.
  status TEXT NOT NULL DEFAULT 'processing',        -- processing | success | error | duplicate
  error_message TEXT,                               -- Error details if status=error
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ                          -- When processing completed
);

-- Enable RLS (no policies = only service role can access)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Note: UNIQUE constraint on event_id automatically creates an index
-- No need for separate CREATE INDEX
