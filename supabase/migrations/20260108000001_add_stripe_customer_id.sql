-- TMC Studio - Add Stripe Customer ID
-- Migration: 20260108000001_add_stripe_customer_id.sql
-- Description: Adds stripe_customer_id column to profiles table for payment integration

-- =====================================================
-- ADD STRIPE CUSTOMER ID TO PROFILES
-- =====================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- Create index for fast customer lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
  ON public.profiles(stripe_customer_id) 
  WHERE stripe_customer_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 
  'Stripe Customer ID (cus_xxx) for payment integration';

-- =====================================================
-- ROLLBACK
-- =====================================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_profiles_stripe_customer_id;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS stripe_customer_id;
