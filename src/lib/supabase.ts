import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Generate UID in XC-XXX format
export const generateUID = (tokenNumber: number): string => {
  return `XC-${tokenNumber.toString().padStart(3, '0')}`;
};

// Generate QR code data
export const generateQRData = (uid: string, visitId: string): string => {
  return JSON.stringify({ uid, visitId, clinicCode: 'XC', timestamp: Date.now() });
};

// Parse QR code data
export const parseQRData = (qrData: string): { uid: string; visitId: string } | null => {
  try {
    const parsed = JSON.parse(qrData);
    if (parsed.uid && parsed.visitId && parsed.clinicCode === 'XC') {
      return { uid: parsed.uid, visitId: parsed.visitId };
    }
    return null;
  } catch {
    // Try to extract UID from plain text
    const uidMatch = qrData.match(/XC-\d{3}/);
    if (uidMatch) {
      return { uid: uidMatch[0], visitId: '' };
    }
    return null;
  }
};

// Update queue summary
export const updateQueueSummary = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's visit counts
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('visit_status, payment_status, payment_amount')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    if (visitsError) throw visitsError;

    const totalAppointments = visits?.length || 0;
    const totalWaiting = visits?.filter(v => ['upcoming', 'arrived'].includes(v.visit_status)).length || 0;
    const totalCompleted = visits?.filter(v => v.visit_status === 'completed').length || 0;
    const totalCancelled = visits?.filter(v => ['cancelled', 'no_show'].includes(v.visit_status)).length || 0;
    const totalRevenue = visits?.filter(v => v.payment_status === 'paid').reduce((sum, v) => sum + (v.payment_amount || 500), 0) || 0;
    const estimatedWaitTime = totalWaiting * 15;

    // Get current token
    const currentVisit = visits?.find(v => v.visit_status === 'in_consultation');
    const currentToken = currentVisit ? visits.find(v => v.id === currentVisit.id)?.token_number : null;

    // Update queue summary
    const { error: updateError } = await supabase
      .from('queue_summary')
      .upsert({
        date: today,
        total_appointments: totalAppointments,
        total_waiting: totalWaiting,
        total_completed: totalCompleted,
        total_cancelled: totalCancelled,
        current_token: currentToken,
        estimated_wait_time: estimatedWaitTime,
        total_revenue: totalRevenue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      });

    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating queue summary:', error);
  }
};