-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS otps (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone      VARCHAR(20) NOT NULL,
  code       VARCHAR(6)  NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-delete expired OTPs (optional, keeps table clean)
CREATE INDEX IF NOT EXISTS otps_phone_idx ON otps(phone);
CREATE INDEX IF NOT EXISTS otps_expires_idx ON otps(expires_at);
