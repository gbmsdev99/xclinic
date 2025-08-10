import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ClinicSettings } from '../../types';
import { Save, Building, User, Clock, CreditCard, Image } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [formData, setFormData] = useState({
    clinic_name: '',
    clinic_address: '',
    clinic_phone: '',
    clinic_email: '',
    doctor_name: '',
    doctor_qualifications: '',
    doctor_specialization: '',
    doctor_photo_url: '',
    clinic_logo_url: '',
    morning_shift: '',
    evening_shift: '',
    consultation_fee: 0,
    average_consultation_time: 15,
    max_daily_appointments: 50,
    emergency_contact: '',
    online_payment_enabled: true,
    clinic_payment_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .single();

      if (error) throw error;
      
      setSettings(data);
      setFormData({
        clinic_name: data.clinic_name || '',
        clinic_address: data.clinic_address || '',
        clinic_phone: data.clinic_phone || '',
        clinic_email: data.clinic_email || '',
        doctor_name: data.doctor_name || '',
        doctor_qualifications: data.doctor_qualifications || '',
        doctor_specialization: data.doctor_specialization || '',
        doctor_photo_url: data.doctor_photo_url || '',
        clinic_logo_url: data.clinic_logo_url || '',
        morning_shift: data.morning_shift || '',
        evening_shift: data.evening_shift || '',
        consultation_fee: data.consultation_fee || 0,
        average_consultation_time: data.average_consultation_time || 15,
        max_daily_appointments: data.max_daily_appointments || 50,
        emergency_contact: data.emergency_contact || '',
        online_payment_enabled: data.online_payment_enabled !== false,
        clinic_payment_enabled: data.clinic_payment_enabled !== false,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load clinic settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : 
              type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (settings) {
        // Update existing settings
        const { error } = await supabase
          .from('clinic_settings')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Create new settings
        const { error } = await supabase
          .from('clinic_settings')
          .insert(formData);

        if (error) throw error;
      }

      toast.success('Settings saved successfully!');
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Clinic Settings</h1>
        <p className="text-gray-600 mt-1">Manage your clinic information and configuration</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Building className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Name
              </label>
              <input
                type="text"
                name="clinic_name"
                value={formData.clinic_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter clinic name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Consultation Fee (₹)
              </label>
              <input
                type="number"
                name="consultation_fee"
                value={formData.consultation_fee}
                onChange={handleInputChange}
                required
                min="0"
                step="50"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="500"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Phone
              </label>
              <input
                type="tel"
                name="clinic_phone"
                value={formData.clinic_phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clinic Email
              </label>
              <input
                type="email"
                name="clinic_email"
                value={formData.clinic_email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="info@xclinic.com"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinic Address
            </label>
            <textarea
              name="clinic_address"
              value={formData.clinic_address}
              onChange={handleInputChange}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Enter complete clinic address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Clinic Logo URL (Optional)
            </label>
            <input
              type="url"
              name="clinic_logo_url"
              value={formData.clinic_logo_url}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/clinic-logo.jpg"
            />
          </div>
        </div>

        {/* Doctor Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Doctor Information</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dr. Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualifications
              </label>
              <input
                type="text"
                name="doctor_qualifications"
                value={formData.doctor_qualifications}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="MBBS, MD, etc."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialization
            </label>
            <input
              type="text"
              name="doctor_specialization"
              value={formData.doctor_specialization}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Internal Medicine, Cardiology, etc."
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              Doctor Photo URL (Optional)
            </label>
            <input
              type="url"
              name="doctor_photo_url"
              value={formData.doctor_photo_url}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/doctor-photo.jpg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter a direct URL to the doctor's photo. Leave blank if not available.
            </p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Operating Hours</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Morning Shift
              </label>
              <input
                type="text"
                name="morning_shift"
                value={formData.morning_shift}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9:00 AM - 1:00 PM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evening Shift
              </label>
              <input
                type="text"
                name="evening_shift"
                value={formData.evening_shift}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="5:00 PM - 9:00 PM"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Consultation Time (minutes)
              </label>
              <input
                type="number"
                name="average_consultation_time"
                value={formData.average_consultation_time}
                onChange={handleInputChange}
                min="5"
                max="60"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Daily Appointments
              </label>
              <input
                type="number"
                name="max_daily_appointments"
                value={formData.max_daily_appointments}
                onChange={handleInputChange}
                min="10"
                max="200"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact
              </label>
              <input
                type="tel"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Payment Settings */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Options</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="online_payment_enabled"
                  checked={formData.online_payment_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Online Payments</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="clinic_payment_enabled"
                  checked={formData.clinic_payment_enabled}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable Clinic Payments</span>
              </label>
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> These timings will be displayed to patients on the homepage. 
              Use clear, easy-to-understand format like "9:00 AM - 1:00 PM".
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-green-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-3"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>

      {/* Preview Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <div className="text-center">
            {formData.doctor_photo_url && (
              <img 
                src={formData.doctor_photo_url} 
                alt={formData.doctor_name}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-white shadow-lg mb-4"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
            )}
            <h4 className="text-xl font-bold text-gray-900">
              Welcome to {formData.clinic_name || 'Your Clinic'}
            </h4>
            <p className="text-gray-600 mt-1">
              {formData.doctor_name || 'Doctor Name'}, {formData.doctor_qualifications || 'Qualifications'}
            </p>
            <p className="text-gray-600 text-sm mt-2">
              {formData.clinic_address || 'Clinic Address'}
            </p>
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <div>
                <span className="font-medium">Morning:</span> {formData.morning_shift || 'Not set'}
              </div>
              <div>
                <span className="font-medium">Evening:</span> {formData.evening_shift || 'Not set'}
              </div>
            </div>
            <div className="mt-2">
              <span className="text-lg font-bold text-green-600">
                ₹{formData.consultation_fee || 0}
              </span>
              <span className="text-gray-600 text-sm ml-1">consultation fee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};