import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, generateUID, generateQRData, updateQueueSummary } from '../lib/supabase';
import { ClinicSettings } from '../types';
import { User, Phone, FileText, CreditCard, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    gender: '',
    address: '',
    reason: '',
    symptoms: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    payment_method: 'clinic' as 'online' | 'clinic',
  });

  useEffect(() => {
    fetchClinicSettings();
  }, []);

  const fetchClinicSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .single();

      if (error) throw error;
      setClinicSettings(data);
    } catch (error) {
      console.error('Error fetching clinic settings:', error);
      toast.error('Failed to load clinic information');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setLoading(true);

    try {
      // Get next token number
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we're using demo mode
      const isDemo = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co' || 
                     !import.meta.env.VITE_SUPABASE_URL ||
                     import.meta.env.VITE_SUPABASE_ANON_KEY === 'demo-key';
      
      let existingVisits: any[] = [];
      let countError = null;
      
      if (isDemo) {
        const allVisits = JSON.parse(localStorage.getItem('demo_visits') || '[]');
        existingVisits = allVisits
          .filter((visit: any) => visit.created_at.split('T')[0] === today)
          .sort((a: any, b: any) => b.token_number - a.token_number)
          .slice(0, 1);
      } else {
        const result = await supabase
          .from('visits')
          .select('token_number')
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .order('token_number', { ascending: false })
          .limit(1);
        existingVisits = result.data || [];
        countError = result.error;
      }

      if (countError) throw countError;

      const tokenNumber = existingVisits && existingVisits.length > 0 
        ? existingVisits[0].token_number + 1 
        : 1;
      const uid = generateUID(tokenNumber);

      // Get clinic settings for payment amount
      let consultationFee = 500;
      
      if (isDemo) {
        consultationFee = 500; // Default for demo
      } else {
        const { data: settings } = await supabase
          .from('clinic_settings')
          .select('consultation_fee')
          .single();
        consultationFee = settings?.consultation_fee || 500;
      }


      // Create visit record
      const visitData = {
        uid,
        token_number: tokenNumber,
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age) : null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        gender: formData.gender || null,
        address: formData.address.trim() || null,
        reason: formData.reason.trim() || null,
        symptoms: formData.symptoms?.trim() || null,
        medical_history: formData.medical_history?.trim() || null,
        allergies: formData.allergies?.trim() || null,
        current_medications: formData.current_medications?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        payment_method: formData.payment_method,
        payment_status: formData.payment_method === 'online' ? 'pending' : 'pending',
        payment_amount: consultationFee,
        visit_status: 'upcoming',
        queue_position: tokenNumber,
        estimated_time: `${tokenNumber * 15} minutes`,
      };

      let visit: any;
      let error = null;
      
      if (isDemo) {
        visit = {
          ...visitData,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const allVisits = JSON.parse(localStorage.getItem('demo_visits') || '[]');
        allVisits.push(visit);
        localStorage.setItem('demo_visits', JSON.stringify(allVisits));
      } else {
        const result = await supabase
          .from('visits')
          .insert(visitData)
          .select()
          .single();
        visit = result.data;
        error = result.error;
      }

      if (error) throw error;

      // Update queue summary
      await updateQueueSummary();

      // If online payment, redirect to payment (simulated)
      if (formData.payment_method === 'online') {
        // Simulate payment success for demo
        if (isDemo) {
          const allVisits = JSON.parse(localStorage.getItem('demo_visits') || '[]');
          const visitIndex = allVisits.findIndex((v: any) => v.id === visit.id);
          if (visitIndex >= 0) {
            allVisits[visitIndex] = {
              ...allVisits[visitIndex],
              payment_status: 'paid',
              payment_id: `pay_${Date.now()}`,
              updated_at: new Date().toISOString()
            };
            localStorage.setItem('demo_visits', JSON.stringify(allVisits));
          }
        } else {
          const { error: paymentError } = await supabase
            .from('visits')
            .update({ 
              payment_status: 'paid',
              payment_id: `pay_${Date.now()}`,
              updated_at: new Date().toISOString()
            })
            .eq('id', visit.id);

          if (paymentError) throw paymentError;
        }
      }

      toast.success('Booking confirmed successfully!');
      navigate(`/confirmation/${uid}`);

    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="p-8 border-b border-gray-200">
          <div className="text-center">
            <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900">Book Your Visit</h1>
            <p className="text-gray-600 mt-2">
              Fill in your details to secure your appointment
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Age, Phone, Email Row */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="1"
                max="120"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Age"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="10-digit mobile number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Gender and Address */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address (Optional)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your address"
              />
            </div>
          </div>

          {/* Reason Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Reason for Visit
            </label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description of your health concern (optional)"
            />
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Medical Information (Optional)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Symptoms
              </label>
              <textarea
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe your current symptoms"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any known allergies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <input
                  type="text"
                  name="current_medications"
                  value={formData.current_medications}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Medications you're taking"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medical History
              </label>
              <textarea
                name="medical_history"
                value={formData.medical_history}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Previous medical conditions, surgeries, etc."
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Emergency Contact (Optional)</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <CreditCard className="w-4 h-4 inline mr-1" />
              Payment Method
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                formData.payment_method === 'online' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  id="online"
                  name="payment_method"
                  value="online"
                  checked={formData.payment_method === 'online'}
                  onChange={handleInputChange}
                  className="absolute top-4 right-4"
                />
                <label htmlFor="online" className="cursor-pointer">
                  <div className="font-medium text-gray-900">Pay Online</div>
                  <div className="text-sm text-gray-600">₹{clinicSettings?.consultation_fee}</div>
                  <div className="text-xs text-green-600 mt-1">Secure & Instant</div>
                </label>
              </div>

              <div className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                formData.payment_method === 'clinic' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  id="clinic"
                  name="payment_method"
                  value="clinic"
                  checked={formData.payment_method === 'clinic'}
                  onChange={handleInputChange}
                  className="absolute top-4 right-4"
                />
                <label htmlFor="clinic" className="cursor-pointer">
                  <div className="font-medium text-gray-900">Pay at Clinic</div>
                  <div className="text-sm text-gray-600">₹{clinicSettings?.consultation_fee}</div>
                  <div className="text-xs text-blue-600 mt-1">Cash/Card/UPI</div>
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Booking...</span>
              </div>
            ) : (
              'Confirm Booking'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};