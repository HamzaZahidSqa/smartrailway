-- Smart Railway Reservation – Supabase Schema
-- Run this in your Supabase SQL Editor before starting the app.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  email                 TEXT UNIQUE NOT NULL,
  password              TEXT NOT NULL,
  phone                 TEXT,
  role                  TEXT NOT NULL DEFAULT 'passenger' CHECK (role IN ('passenger','admin')),
  reset_password_token  TEXT,
  reset_password_expire TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRAINS
-- ============================================================
CREATE TABLE IF NOT EXISTS trains (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_number   TEXT UNIQUE NOT NULL,
  train_name     TEXT NOT NULL,
  source         TEXT NOT NULL,
  destination    TEXT NOT NULL,
  departure_time TEXT NOT NULL,
  arrival_time   TEXT NOT NULL,
  duration       TEXT,
  total_distance NUMERIC,
  running_days   TEXT[] DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Inactive','Delayed','Cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COACHES
-- ============================================================
CREATE TABLE IF NOT EXISTS coaches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id         UUID NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  coach_number     TEXT NOT NULL,
  coach_type       TEXT NOT NULL CHECK (coach_type IN ('Economy','Business','Executive','Sleeper')),
  total_seats      INTEGER NOT NULL,
  available_seats  INTEGER,
  booked_seats     INTEGER NOT NULL DEFAULT 0,
  fare_per_seat    NUMERIC NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id),
  train_id       UUID NOT NULL REFERENCES trains(id),
  coach_id       UUID NOT NULL REFERENCES coaches(id),
  pnr            TEXT UNIQUE,
  travel_date    DATE NOT NULL,
  from_city      TEXT NOT NULL,
  to_city        TEXT NOT NULL,
  seats          TEXT[] DEFAULT '{}',
  total_fare     NUMERIC NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed','WaitingList','Cancelled','Completed')),
  payment_status TEXT NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Pending','Paid','Refunded')),
  cancelled_at   TIMESTAMPTZ,
  refund_amount  NUMERIC NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKING PASSENGERS  (replaces embedded array in Mongoose)
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_passengers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  age         INTEGER NOT NULL,
  gender      TEXT NOT NULL CHECK (gender IN ('Male','Female','Other')),
  id_type     TEXT,
  id_number   TEXT,
  seat_number TEXT
);

-- ============================================================
-- SEATS
-- ============================================================
CREATE TABLE IF NOT EXISTS seats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  train_id    UUID NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  seat_number TEXT NOT NULL,
  row         INTEGER,
  col         TEXT,
  status      TEXT NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Booked','Reserved')),
  travel_date DATE,
  booking_id  UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, seat_number, travel_date)
);

-- ============================================================
-- TICKETS
-- ============================================================
CREATE TABLE IF NOT EXISTS tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    UUID NOT NULL REFERENCES bookings(id),
  ticket_number TEXT UNIQUE,
  pnr           TEXT,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES bookings(id),
  user_id        UUID NOT NULL REFERENCES users(id),
  amount         NUMERIC NOT NULL,
  method         TEXT NOT NULL DEFAULT 'JazzCash' CHECK (method IN ('JazzCash','EasyPaisa','BankTransfer')),
  status         TEXT NOT NULL DEFAULT 'Success' CHECK (status IN ('Success','Failed','Refunded','Pending')),
  transaction_id TEXT,
  payment_phone  TEXT,
  account_title  TEXT,
  account_number TEXT,
  bank_name      TEXT,
  iban           TEXT,
  refund_amount  NUMERIC NOT NULL DEFAULT 0,
  refunded_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS routes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  train_id      UUID NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'Daily' CHECK (schedule_type IN ('Daily','Weekly')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id       UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  city           TEXT NOT NULL,
  arrival_time   TEXT,
  departure_time TEXT,
  stop_number    INTEGER,
  distance       NUMERIC
);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['users','trains','coaches','bookings','seats','tickets','payments','routes'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
