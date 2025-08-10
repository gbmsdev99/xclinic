import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, updateQueueSummary } from '../lib/supabase';
import { ClinicSettings, QueueSummary } from '../types';
import { Calendar, Clock, Users, CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const HomePage: React.FC = () => {
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [queueSummary, setQueueSummary] = useState<QueueSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time queue updates
    const queueSubscription = supabase
      .channel('queue-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_summary' },
        (payload) => {
          console.log('Queue update:', payload);
          setTimeout(() => {
            updateQueueSummary();
            fetchQueueSummary();
          }, 1000);
        }
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_summary' },
        (payload) => {
          console.log('Queue summary update:', payload);
          fetchQueueSummary();
        }
      )
      .subscribe();

    return () => {
      queueSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchClinicSettings(), fetchQueueSummary()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load clinic information');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinicSettings = async () => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .single();

    if (error) throw error;
    setClinicSettings(data);
  };

  const fetchQueueSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we're using demo mode
      const isDemo = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co' || 
                     !import.meta.env.VITE_SUPABASE_URL ||
                     import.meta.env.VITE_SUPABASE_ANON_KEY === 'demo-key';
      
      let data = null;
      let error = null;
      
      if (isDemo) {
        // Get from localStorage for demo
        const storedSummary = localStorage.getItem('demo_queue_summary');
        if (storedSummary) {
          data = JSON.parse(storedSummary);
        } else {
          // Create default summary
          data = {
            id: '1',
            date: today,
            total_appointments: 0,
            total_waiting: 0,
            total_completed: 0,
            total_cancelled: 0,
            estimated_wait_time: 0,
            average_consultation_time: 15,
            total_revenue: 0,
            updated_at: new Date().toISOString()
          };
          localStorage.setItem('demo_queue_summary', JSON.stringify(data));
        }
      } else {
        const result = await supabase
          .from('queue_summary')
          .select('*')
          .eq('date', today)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error && !isDemo) {
        console.log('Queue summary not found, creating default');
        setQueueSummary({
          id: '',
          date: today,
          total_appointments: 0,
          total_waiting: 0,
          total_completed: 0,
          total_cancelled: 0,
          estimated_wait_time: 0,
          average_consultation_time: 15,
          total_revenue: 0,
          updated_at: new Date().toISOString()
        });
      } else {
        setQueueSummary(data);
      }
    } catch (error) {
      console.error('Error fetching queue summary:', error);
      // Set default values on error
      const today = new Date().toISOString().split('T')[0];
      setQueueSummary({
        id: '',
        date: today,
        total_appointments: 0,
        total_waiting: 0,
        total_completed: 0,
        total_cancelled: 0,
        estimated_wait_time: 0,
        average_consultation_time: 15,
        total_revenue: 0,
        updated_at: new Date().toISOString()
      });
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
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        {clinicSettings?.doctor_photo_url && (
          <img 
            src={clinicSettings.doctor_photo_url} 
            alt={clinicSettings.doctor_name}
            className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg"
          />
        )}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to {clinicSettings?.clinic_name}
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            {clinicSettings?.doctor_name}, {clinicSettings?.doctor_qualifications}
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {clinicSettings?.clinic_address}
          </p>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clinic Hours</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-medium">Morning:</span> {clinicSettings?.morning_shift}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Evening:</span> {clinicSettings?.evening_shift}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Consultation Fee</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ₹{clinicSettings?.consultation_fee}
          </p>
          <p className="text-sm text-gray-600 mt-1">Per consultation</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Live Queue</h3>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold text-purple-600">
              {queueSummary?.total_waiting || 0} waiting
            </p>
            {queueSummary?.current_token && (
              <p className="text-sm text-gray-600">
                Current: Token #{queueSummary.current_token}
              </p>
            )}
            <p className="text-sm text-gray-600">
              Est. wait: {queueSummary?.estimated_wait_time || 0} min
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl shadow-2xl p-8 text-white text-center">
        <h2 className="text-3xl font-bold mb-4">Book Your Visit Today</h2>
        <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
          Skip the waiting room! Book your appointment online, get your unique token, 
          and track the queue in real-time from the comfort of your home.
        </p>
        
        <Link
          to="/book"
          className="inline-flex items-center space-x-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
        >
          <Calendar className="w-6 h-6" />
          <span>Book My Visit</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* How It Works */}
      <div className="space-y-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">1. Book Online</h3>
            <p className="text-gray-600">
              Fill out the booking form with your details and choose payment method
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">2. Get Your Token</h3>
            <p className="text-gray-600">
              Receive your unique UID and QR code instantly for quick check-in
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">3. Arrive on Time</h3>
            <p className="text-gray-600">
              Track the live queue and arrive just in time for your consultation
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Link
          to="/track"
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Track My Turn</h3>
              <p className="text-gray-600">Check your queue position and estimated wait time</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>
        
        <Link
          to="/visit"
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">View My Visit</h3>
              <p className="text-gray-600">Access your visit details and prescriptions</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
};