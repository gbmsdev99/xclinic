/*
  # Complete X Clinic Database Schema

  1. New Tables
    - `clinic_settings` - Store clinic configuration and settings
    - `visits` - All patient visits and bookings with comprehensive fields
    - `queue_summary` - Real-time queue statistics for homepage display
    - `prescriptions` - Separate table for prescription management

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access and authenticated admin access
    - Secure file storage policies

  3. Features
    - Complete visit management with all status transitions
    - Payment tracking with multiple methods
    - Queue position management
    - Prescription upload and download system
    - Real-time updates support
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS queue_summary CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS clinic_settings CASCADE;

-- Create clinic_settings table
CREATE TABLE clinic_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name text NOT NULL DEFAULT 'X Clinic',
  clinic_address text NOT NULL DEFAULT '123 Healthcare Street, Medical District, City - 123456',
  clinic_phone text DEFAULT '+91 98765 43210',
  clinic_email text DEFAULT 'info@xclinic.com',
  doctor_name text NOT NULL DEFAULT 'Dr. Sarah Johnson',
  doctor_qualifications text NOT NULL DEFAULT 'MBBS, MD (Internal Medicine)',
  doctor_photo_url text,
  doctor_specialization text DEFAULT 'General Medicine',
  morning_shift text NOT NULL DEFAULT '9:00 AM - 1:00 PM',
  evening_shift text NOT NULL DEFAULT '5:00 PM - 9:00 PM',
  consultation_fee numeric NOT NULL DEFAULT 500,
  online_payment_enabled boolean DEFAULT true,
  clinic_payment_enabled boolean DEFAULT true,
  average_consultation_time integer DEFAULT 15,
  max_daily_appointments integer DEFAULT 50,
  emergency_contact text DEFAULT '+91 98765 43210',
  clinic_logo_url text,
  website_url text,
  social_media jsonb DEFAULT '{}',
  operating_days text[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  holiday_dates date[] DEFAULT ARRAY[]::date[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create visits table with all required fields
CREATE TABLE visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uid text UNIQUE NOT NULL,
  token_number integer NOT NULL,
  name text NOT NULL,
  age integer,
  phone text,
  email text,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  address text,
  reason text,
  symptoms text,
  medical_history text,
  allergies text,
  current_medications text,
  emergency_contact_name text,
  emergency_contact_phone text,
  payment_method text NOT NULL CHECK (payment_method IN ('online', 'clinic')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_id text,
  payment_amount numeric DEFAULT 500,
  visit_status text NOT NULL DEFAULT 'upcoming' CHECK (visit_status IN ('upcoming', 'arrived', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  queue_position integer NOT NULL,
  estimated_time text,
  actual_wait_time integer,
  consultation_start_time timestamptz,
  consultation_end_time timestamptz,
  notes text,
  diagnosis text,
  treatment_plan text,
  follow_up_date date,
  follow_up_instructions text,
  prescription_id uuid,
  prescription_url text,
  prescription_notes text,
  doctor_rating integer CHECK (doctor_rating BETWEEN 1 AND 5),
  feedback text,
  created_at timestamptz DEFAULT now(),
  arrived_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES visits(id) ON DELETE CASCADE,
  patient_name text NOT NULL,
  patient_uid text NOT NULL,
  doctor_name text NOT NULL,
  prescription_date date DEFAULT CURRENT_DATE,
  medications jsonb DEFAULT '[]',
  instructions text,
  file_url text,
  file_name text,
  file_size integer,
  file_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create queue_summary table
CREATE TABLE queue_summary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date DEFAULT CURRENT_DATE,
  total_appointments integer DEFAULT 0,
  total_waiting integer DEFAULT 0,
  total_completed integer DEFAULT 0,
  total_cancelled integer DEFAULT 0,
  current_token integer,
  last_completed_token integer,
  estimated_wait_time integer DEFAULT 0,
  average_consultation_time integer DEFAULT 15,
  total_revenue numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_visits_uid ON visits(uid);
CREATE INDEX idx_visits_token ON visits(token_number);
CREATE INDEX idx_visits_status ON visits(visit_status);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_visits_phone ON visits(phone);
CREATE INDEX idx_visits_name ON visits(name);
CREATE INDEX idx_prescriptions_visit_id ON prescriptions(visit_id);
CREATE INDEX idx_prescriptions_patient_uid ON prescriptions(patient_uid);
CREATE INDEX idx_queue_summary_date ON queue_summary(date);

-- Enable Row Level Security
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clinic_settings
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

-- Create RLS policies for visits
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

CREATE POLICY "Authenticated users can delete visits"
  ON visits
  FOR DELETE
  TO authenticated
  USING (true);

-- Create RLS policies for prescriptions
CREATE POLICY "Anyone can read prescriptions"
  ON prescriptions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can manage prescriptions"
  ON prescriptions
  FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for queue_summary
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

-- Insert initial clinic settings
INSERT INTO clinic_settings (
  clinic_name,
  clinic_address,
  clinic_phone,
  clinic_email,
  doctor_name,
  doctor_qualifications,
  doctor_specialization,
  morning_shift,
  evening_shift,
  consultation_fee,
  average_consultation_time,
  max_daily_appointments,
  emergency_contact,
  operating_days
) VALUES (
  'X Clinic - Advanced Healthcare',
  '123 Healthcare Avenue, Medical District, Mumbai - 400001',
  '+91 98765 43210',
  'info@xclinic.com',
  'Dr. Sarah Johnson',
  'MBBS, MD (Internal Medicine), Fellowship in Cardiology',
  'Internal Medicine & Cardiology',
  '9:00 AM - 1:00 PM',
  '5:00 PM - 9:00 PM',
  500,
  15,
  50,
  '+91 98765 43210',
  ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
);

-- Insert initial queue summary
INSERT INTO queue_summary (
  date,
  total_appointments,
  total_waiting,
  total_completed,
  total_cancelled,
  estimated_wait_time,
  average_consultation_time,
  total_revenue
) VALUES (
  CURRENT_DATE,
  0,
  0,
  0,
  0,
  0,
  15,
  0
);

-- Create function to update queue summary
CREATE OR REPLACE FUNCTION update_queue_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update queue summary when visits change
  INSERT INTO queue_summary (date, total_appointments, total_waiting, total_completed, total_cancelled, estimated_wait_time, total_revenue, updated_at)
  VALUES (
    CURRENT_DATE,
    (SELECT COUNT(*) FROM visits WHERE DATE(created_at) = CURRENT_DATE),
    (SELECT COUNT(*) FROM visits WHERE DATE(created_at) = CURRENT_DATE AND visit_status IN ('upcoming', 'arrived')),
    (SELECT COUNT(*) FROM visits WHERE DATE(created_at) = CURRENT_DATE AND visit_status = 'completed'),
    (SELECT COUNT(*) FROM visits WHERE DATE(created_at) = CURRENT_DATE AND visit_status IN ('cancelled', 'no_show')),
    (SELECT COUNT(*) FROM visits WHERE DATE(created_at) = CURRENT_DATE AND visit_status IN ('upcoming', 'arrived')) * 15,
    (SELECT COALESCE(SUM(payment_amount), 0) FROM visits WHERE DATE(created_at) = CURRENT_DATE AND payment_status = 'paid'),
    now()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_appointments = EXCLUDED.total_appointments,
    total_waiting = EXCLUDED.total_waiting,
    total_completed = EXCLUDED.total_completed,
    total_cancelled = EXCLUDED.total_cancelled,
    estimated_wait_time = EXCLUDED.estimated_wait_time,
    total_revenue = EXCLUDED.total_revenue,
    updated_at = EXCLUDED.updated_at;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update queue summary
CREATE TRIGGER update_queue_summary_trigger
  AFTER INSERT OR UPDATE OR DELETE ON visits
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_summary();

-- Create function to generate UID
CREATE OR REPLACE FUNCTION generate_uid()
RETURNS text AS $$
DECLARE
  next_token integer;
  new_uid text;
BEGIN
  -- Get next token number for today
  SELECT COALESCE(MAX(token_number), 0) + 1 
  INTO next_token
  FROM visits 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Generate UID in XC-XXX format
  new_uid := 'XC-' || LPAD(next_token::text, 3, '0');
  
  RETURN new_uid;
END;
$$ LANGUAGE plpgsql;