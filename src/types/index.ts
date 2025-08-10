export interface Visit {
  id: string;
  uid: string;
  token_number: number;
  name: string;
  age?: number;
  phone?: string;
  email?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  reason?: string;
  symptoms?: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  payment_method: 'online' | 'clinic';
  payment_status: 'pending' | 'paid';
  payment_id?: string;
  payment_amount?: number;
  visit_status: 'upcoming' | 'arrived' | 'in_consultation' | 'completed' | 'cancelled';
  queue_position: number;
  estimated_time?: string;
  actual_wait_time?: number;
  consultation_start_time?: string;
  consultation_end_time?: string;
  created_at: string;
  arrived_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  updated_at?: string;
  notes?: string;
  diagnosis?: string;
  treatment_plan?: string;
  follow_up_date?: string;
  follow_up_instructions?: string;
  prescription_id?: string;
  prescription_url?: string;
  prescription_notes?: string;
  doctor_rating?: number;
  feedback?: string;
}

export interface ClinicSettings {
  id: string;
  clinic_name: string;
  clinic_address: string;
  clinic_phone?: string;
  clinic_email?: string;
  doctor_name: string;
  doctor_qualifications: string;
  doctor_photo_url?: string;
  doctor_specialization?: string;
  morning_shift: string;
  evening_shift: string;
  consultation_fee: number;
  online_payment_enabled?: boolean;
  clinic_payment_enabled?: boolean;
  average_consultation_time?: number;
  max_daily_appointments?: number;
  emergency_contact?: string;
  clinic_logo_url?: string;
  website_url?: string;
  social_media?: any;
  operating_days?: string[];
  holiday_dates?: string[];
  created_at: string;
  updated_at: string;
}

export interface QueueSummary {
  id: string;
  date: string;
  total_appointments: number;
  total_waiting: number;
  total_completed: number;
  total_cancelled: number;
  current_token?: number;
  last_completed_token?: number;
  estimated_wait_time: number;
  average_consultation_time: number;
  total_revenue: number;
  updated_at: string;
}

export interface Prescription {
  id: string;
  visit_id: string;
  patient_name: string;
  patient_uid: string;
  doctor_name: string;
  prescription_date: string;
  medications: any[];
  instructions?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}