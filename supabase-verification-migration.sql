
-- ================================================================
-- VERIFICATION SYSTEM MIGRATION
-- Run this in Supabase SQL Editor if you've already run the schema
-- ================================================================

ALTER TABLE builders
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_method text,
  ADD COLUMN IF NOT EXISTS insured_at timestamptz,
  ADD COLUMN IF NOT EXISTS insured_doc_type text;

-- Option A: Any builder with an active paid plan gets verified=true
UPDATE builders SET
  verified = true,
  verified_method = 'payment',
  verified_at = NOW()
WHERE plan IN ('builder_listed','builder_featured','builder_pro')
  AND subscription_status = 'active'
  AND verified = false;

-- Option B: Any builder who has uploaded PLI gets insured=true
UPDATE builders SET
  insured = true,
  insured_at = NOW()
WHERE id IN (
  SELECT DISTINCT user_id FROM builder_docs
  WHERE doc_type IN ('Public Liability Insurance','Employers Liability Insurance')
  AND expires_at > NOW()
)
AND insured = false;
