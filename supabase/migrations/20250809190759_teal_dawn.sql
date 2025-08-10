/*
  # X Clinic Database Schema

  1. New Tables
    - `clinic_settings` - Store clinic configuration
    - `visits` - Store all patient visits and bookings
    - `queue_summary` - Real-time queue statistics

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access to clinic_settings and queue_summary
    - Add policies for visit management
*/

-- Clinic settings table
CREATE TABLE IF NOT EXISTS clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name text NOT NULL DEFAULT 'X Clinic',
  clinic_address text NOT NULL DEFAULT '123 Healthcare Street',
  doctor_name text NOT NULL DEFAULT 'Dr. Smith',
  doctor_qualifications text NOT NULL DEFAULT 'MBBS, MD',
  doctor_photo_url text,
  morning_shift text NOT NULL DEFAULT '9:00 AM - 1:00 PM',
  evening_shift text NOT NULL DEFAULT '5:00 PM - 9:00 PM',
  consultation_fee numeric NOT NULL DEFAULT 500,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visits table
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  token_number integer NOT NULL,
  name text NOT NULL,
  age integer,
  phone text,
  reason text,
  payment_method text NOT NULL CHECK (payment_method IN ('online', 'clinic')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid')),
  visit_status text NOT NULL DEFAULT 'upcoming' CHECK (visit_status IN ('upcoming', 'arrived', 'in_consultation', 'completed', 'cancelled')),
  queue_position integer NOT NULL,
  estimated_time text,
  notes text,
  prescription_url text,
  created_at timestamptz DEFAULT now(),
  arrived_at timestamptz,
  completed_at timestamptz
);

-- Queue summary table for real-time stats
CREATE TABLE IF NOT EXISTS queue_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_waiting integer NOT NULL DEFAULT 0,
  current_token integer,
  estimated_wait_time integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_summary ENABLE ROW LEVEL SECURITY;

-- Policies for clinic_settings (public read)
CREATE POLICY "Anyone can read clinic settings"
  ON clinic_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update clinic settings"
  ON clinic_settings
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for visits
CREATE POLICY "Anyone can read visits"
  ON visits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create visits"
  ON visits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits"
  ON visits
  FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for queue_summary
CREATE POLICY "Anyone can read queue summary"
  ON queue_summary
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can update queue summary"
  ON queue_summary
  FOR ALL
  TO authenticated
  USING (true);

-- Insert default clinic settings
INSERT INTO clinic_settings (clinic_name, clinic_address, doctor_name, doctor_qualifications, morning_shift, evening_shift, consultation_fee)
VALUES ('X Clinic', '123 Healthcare Street, Medical District', 'Dr. Sarah Johnson', 'MBBS, MD (General Medicine)', '9:00 AM - 1:00 PM', '5:00 PM - 9:00 PM', 500)
ON CONFLICT DO NOTHING;

-- Insert default queue summary
INSERT INTO queue_summary (total_waiting, estimated_wait_time)
VALUES (0, 0)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(visit_status);
CREATE INDEX IF NOT EXISTS idx_visits_uid ON visits(uid);
CREATE INDEX IF NOT EXISTS idx_visits_token ON visits(token_number);
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON visits(created_at);